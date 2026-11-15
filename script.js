/* ==========================================================
   Europa Deep: Subsurface Ocean Explorer  (vanilla JS)
   Sections: 1 Data | 2 State & UI | 3 E.V.A. | 4 Validation
             5 Canvas simulation | 6 Crisis event | 7 Results
   ========================================================== */

/* ---------- 1. GAME DATA: see europa_data.js (FACTS, LIMITS, CATS, SOURCES) ---------- */

/* ---------- 2. STATE & UI ---------- */
const sel = { launch: [], hull: [], power: [], tools: [] };
const $ = id => document.getElementById(id);
const find = (cat, id) => CATS[cat].items.find(i => i.id === id);
const massLimit = () => {
  const launcher = picked('launch')[0];
  return launcher ? launcher.cap - launcher.stack : null;
};
const picked = cat => sel[cat].map(id => find(cat, id));

// Small inline SVG icon per category (no external images)
function icon(cat) {
  const s = { launch: '<path d="M20 4 L26 24 H14 Z M14 24 L10 32 L16 28 M26 24 L30 32 L24 28" />',
              hull: '<path d="M20 4 L34 10 V22 Q34 32 20 37 Q6 32 6 22 V10 Z" />',
              power: '<circle cx="20" cy="20" r="8"/><path d="M20 4 V10 M20 30 V36 M4 20 H10 M30 20 H36" />',
              tools: '<path d="M20 4 V28 M12 20 L20 30 L28 20 M10 36 H30" />' }[cat];
  return `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linejoin="round">${s}</svg>`;
}

// Build the selectable cards
function buildCards() {
  const root = $('categories');
  for (const [cat, c] of Object.entries(CATS)) {
    const sec = document.createElement('div');
    sec.innerHTML = `<h2 class="cat-title">${c.title}<small>${c.hint}</small></h2><div class="cards" id="g-${cat}"></div>`;
    root.appendChild(sec);
    c.items.forEach(it => {
      const b = document.createElement('button');
      b.className = 'card'; b.id = `c-${cat}-${it.id}`;
      // Tag badge: N / D / A with hover note (academic traceability)
      const T = (k, label, val) => `${label} <b>${val}</b>${it.t?.[k] ? `<sup class="tag tag-${it.t[k]}" title="${TAGS[it.t[k]]}${it.n?.[k] ? ': ' + it.n[k] : ''}">${it.t[k]}</sup>` : ''}`;
      const lines = [T('cost', 'Cost', '$' + it.cost.toLocaleString() + 'M')];
      if (cat === 'launch') lines.push(T('stack', 'Probe allowance', (it.cap - it.stack).toLocaleString() + ' kg'), T('yrs', 'Transit', it.yrs + ' yr'));
      else lines.push(T('mass', 'Mass', it.mass.toLocaleString() + ' kg'));
      if (it.shield) lines.push(T('shield', 'Shielding', 'Lv ' + it.shield));
      if (it.watts) lines.push(T('watts', 'Power', it.watts.toLocaleString() + ' W' + (it.solar ? ' (0 W under ice)' : ' at launch')));
      if (it.rate !== undefined && !it.solar) lines.push(T('rate', 'Decay', (it.rate * 100).toFixed(2) + ' %/yr'));
      if (it.draw) lines.push(T('draw', 'Needs', it.draw + ' W'));
      if (it.id === 'las') lines.push('Required to reach the ocean');
      if (it.science) lines.push(T('science', 'Science', '+' + it.science));
      b.innerHTML = `${icon(cat)}<div class="name">${it.name}</div><div class="stats">${lines.join(' &middot; ')}</div>`;
      b.onclick = () => toggle(cat, it.id);
      $(`g-${cat}`).appendChild(b);
    });
  }
}

function toggle(cat, id) {
  const list = sel[cat], i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1);
  else if (CATS[cat].max === 1) sel[cat] = [id];           // single-choice: replace
  else if (list.length < CATS[cat].max) list.push(id);      // multi-choice: up to max
  else {
    $('design-status').textContent = 'Instrument bay full. Deselect a tool before adding another.';
    return;
  }
  $('design-status').textContent = '';
  refresh();
}

// Compute all live telemetry from current selection
function stats() {
  const all = [...picked('launch'), ...picked('hull'), ...picked('power'), ...picked('tools')];
  const pw = picked('power')[0];
  return {
    cost: FIXED_COST_TOTAL + all.reduce((a, i) => a + i.cost, 0),
    mass: BASE.mass + all.reduce((a, i) => a + i.mass, 0),
    years: picked('launch')[0]?.yrs ?? 0,
    bol: pw ? (pw.solar ? 0 : pw.watts) : 0,
    supply: pw ? powerAt(pw, picked('launch')[0]?.yrs ?? 0) : 0, // watts at ARRIVAL, after decay
    need: BASE.watts + picked('tools').reduce((a, i) => a + i.draw, 0),
    shield: (h => !h ? 0 : (h.needsDrill && !picked('tools').some(t => t.id === 'las')) ? 1 : h.shield)(picked('hull')[0]),
    science: picked('tools').reduce((a, i) => a + i.science, 0),
    pw
  };
}

function setBar(id, frac, bad) { const b = $(id); b.style.width = Math.min(100, frac * 100) + '%'; b.classList.toggle('bad', bad); }

function refresh() {
  const s = stats();
  for (const cat in sel) for (const it of CATS[cat].items) {
    const card = $(`c-${cat}-${it.id}`);
    const selected = sel[cat].includes(it.id);
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', String(selected));
  }
  const capacity = massLimit();
  $('t-budget').textContent = `$${s.cost.toLocaleString()}M / $${LIMITS.budget.toLocaleString()}M`;
  $('t-mass').textContent = `${s.mass.toLocaleString()} kg / ${capacity ? capacity + ' kg' : 'choose rocket'}`;
  $('t-power').textContent = `${s.supply.toFixed(1)} W / ${s.need.toFixed(1)} W`;
  $('t-shield').textContent = `Level ${s.shield} / ${LIMITS.shield}+`;
  setBar('b-budget', s.cost / LIMITS.budget, s.cost > LIMITS.budget);
  setBar('b-mass', capacity ? s.mass / capacity : 0, Boolean(capacity && s.mass > capacity));
  setBar('b-power', s.supply / s.need, s.supply < s.need);
  setBar('b-shield', s.shield / 5, s.shield < LIMITS.shield);
  $('t-extra').textContent = 'Budget includes $2,000M in fixed mission costs. Rocket allowances, prices, and event outcomes are simplified game values. Juno’s 29 km ice estimate describes the region it observed. Sources and assumptions are listed in SOURCES.md.';
  evaAnalyze(s);
}

/* ---------- 3. E.V.A. CO-PILOT ---------- */
let lastMsgs = '';
function evaLog(msg, type = '') {
  const li = document.createElement('li'); li.className = type; li.textContent = msg;
  $('eva-log').prepend(li);
  while ($('eva-log').children.length > 6) $('eva-log').lastChild.remove();
}
function evaAnalyze(s) {
  const m = [];
  if (s.pw?.solar) m.push([`Alert Engineer: no sunlight under ${ICE_KM} km of ice. Solar can't power the probe. Choose a power source that works without sunlight.`, 'warn']);
  if (picked('hull')[0]?.needsDrill && s.shield < 3) m.push(['Ice shielding only works if the probe can melt into the ice. Add the drill.', 'warn']);
  if (s.pw && s.supply < s.need && !s.pw.solar) m.push([`Power short by ${(s.need - s.supply).toFixed(1)} W at arrival (${s.years} yr of decay; ${s.bol}W at launch). Upgrade the source or drop an instrument.`, 'warn']);
  if (s.shield && s.shield < LIMITS.shield) m.push(["Shielding is below level 3. Choose stronger protection for Europa’s radiation environment.", 'warn']);
  if (massLimit() && s.mass > massLimit()) m.push([`Probe is ${Math.round(s.mass - massLimit()).toLocaleString()} kg over this launcher's allowance. The launcher can't carry it to Jupiter.`, 'warn']);
  if (s.cost > LIMITS.budget) m.push([`We're $${s.cost - LIMITS.budget}M over budget. Choose a less expensive component.`, 'warn']);
  if (sel.power.length && !sel.tools.includes('las'))
    m.push(['No drill aboard. Without it the probe cannot melt through the ice.', '']);
  if (!m.length && Object.values(sel).every(a => a.length)) m.push(['All systems nominal. Ready when you are, Engineer.', 'good']);
  if (!m.length) m.push(['Pick a launcher, hull, power core and up to 3 instruments.', '']);
  const key = JSON.stringify(m);
  if (key === lastMsgs) return; lastMsgs = key;
  $('eva-log').innerHTML = ''; m.slice().reverse().forEach(([t, c]) => evaLog(t, c));
}

/* ---------- 4. VALIDATION ---------- */
$('launch-btn').onclick = () => {
  const s = stats(), fails = [];
  if (!sel.launch.length || !sel.hull.length || !sel.power.length) fails.push('Incomplete design: a launch vehicle, radiation protection and power source are required.');
  if (s.cost > LIMITS.budget) fails.push(`Budget exceeded by $${s.cost - LIMITS.budget}M.`);
  if (massLimit() && s.mass > massLimit()) fails.push(`Probe is ${Math.round(s.mass - massLimit()).toLocaleString()} kg over the ${massLimit().toLocaleString()} kg this launcher can deliver.`);
  if (!sel.tools.includes('las')) fails.push('No ice-melting drill: the probe cannot reach the ocean.');
  if (sel.power.length && s.supply < s.need) fails.push(`Power deficit at arrival after ${s.years} yr of decay: ${s.supply.toFixed(1)} W usable vs ${s.need.toFixed(1)} W needed (bus alone needs ${BASE.watts} W).${s.pw.solar ? ' Solar gives 0 W under the ice.' : ''}`);
  if (sel.hull.length && s.shield < LIMITS.shield) fails.push(`Shielding Level ${s.shield} is below Level ${LIMITS.shield}. Radiation will destroy onboard computers.`);
  if (fails.length) return showScrub(fails);
  startSim(s);
};

function showScrub(fails) {
  $('modal-card').innerHTML = `<h2 id="report-title" class="scrub-title">Launch paused</h2>
    <p>Fix these items in your design and run the checks again.</p>
    ${fails.map(f => `<div class="scrub-item">${f}</div>`).join('')}
    <div class="actions report-actions"><button class="primary" onclick="closeModal()">Back to Design</button></div>`;
  $('modal').showModal();
}

function closeModal() { $('modal').close(); }

function showDesign() {
  $('welcome').classList.add('hidden');
  $('design').classList.remove('hidden');
  $('design-heading').focus();
  window.scrollTo(0, 0);
}

function resetDesign() {
  closeModal();
  Object.keys(sel).forEach(category => { sel[category] = []; });
  lastMsgs = '';
  refresh();
  $('design-status').textContent = 'All selections cleared. Choose your equipment to start a new build.';
  showDesign();
}

$('start-btn').onclick = showDesign;
$('reset-btn').onclick = resetDesign;
$('brief-btn').onclick = () => {
  $('design').classList.add('hidden');
  $('welcome').classList.remove('hidden');
  $('start-btn').focus();
  window.scrollTo(0, 0);
};

/* ---------- 5. CANVAS SIMULATION ---------- */
const cv = $('stage'), ctx = cv.getContext('2d');
let sim = null, W = 0, H = 0, stars = [];
const lerp = (a, b, t) => a + (b - a) * t;

function resize() {
  W = cv.width = cv.clientWidth; H = cv.height = cv.clientHeight;
  stars = Array.from({ length: 120 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .3 }));
}
new ResizeObserver(() => { if (sim) resize(); }).observe(cv);

function startSim(s) {
  $('sim').classList.remove('hidden'); resize();
  sim = { s, phase: 1, t0: performance.now(), dur: picked('launch')[0].ms, event: null };
  $('design').classList.add('hidden');
  $('sim-phase').textContent = 'Phase 1: Launch & transit';
  $('sim-info').textContent = `Cruise: ${s.years} years in the mission model`;
  $('sim-phase').focus();
  frameId = requestAnimationFrame(loop);
}

let frameId;
$('abort-btn').onclick = () => {
  stopSim();
  showDesign();
};

function stopSim() {
  cancelAnimationFrame(frameId);
  sim = null;
  $('sim').classList.add('hidden');
  $('event-box').classList.add('hidden');
  $('ev-options').replaceChildren();
}

function loop(now) {
  if (!sim) return;
  const t = Math.min(1, (now - sim.t0) / sim.dur);
  ctx.fillStyle = '#040814'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#cbd5e1'; stars.forEach(st => { ctx.globalAlpha = .4 + .4 * Math.sin(now / 600 + st.x); ctx.fillRect(st.x, st.y, st.r, st.r); }); ctx.globalAlpha = 1;
  if (sim.phase === 1) drawPhase1(t, now);
  if (sim.phase === 2) drawPhase2(t, now);
  if (sim.phase >= 3) drawPhase3(now);
  const step = sim.phase;
  $('sim-progress').value = step < 3 ? step - 1 + t : step - 1;
  document.querySelectorAll('.phase-track li').forEach((item, i) => {
    if (i + 1 === step) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  if (t >= 1 && sim.phase < 3) {
    sim.phase++; sim.t0 = now; sim.dur = 7000;
    if (sim.phase === 3) startEvent();
  }
  frameId = requestAnimationFrame(loop);
}

function drawJupiter(x, y, r) {
  const g = ctx.createRadialGradient(x - r / 3, y - r / 3, r / 8, x, y, r);
  g.addColorStop(0, '#f1d9b5'); g.addColorStop(1, '#8a5a3a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
  ctx.fillStyle = 'rgba(120,70,40,.45)';
  [-.5, -.15, .25, .6].forEach(k => ctx.fillRect(x - r, y + k * r, r * 2, r * .14));
  ctx.fillStyle = 'rgba(180,70,50,.8)'; ctx.beginPath(); ctx.ellipse(x + r * .3, y + r * .35, r * .2, r * .11, 0, 0, 7); ctx.fill();
  ctx.restore();
}
function drawRocket(x, y, ang, flame) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  if (flame) { ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(-14 - 14 - Math.random() * 10, 0); ctx.lineTo(-14, 4); ctx.fill(); }
  ctx.fillStyle = '#e2e8f0'; ctx.fillRect(-14, -5, 26, 10);
  ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.moveTo(12, -5); ctx.lineTo(22, 0); ctx.lineTo(12, 5); ctx.fill();
  ctx.fillStyle = '#9f1239'; ctx.beginPath(); ctx.moveTo(-14, -5); ctx.lineTo(-20, -11); ctx.lineTo(-6, -5); ctx.moveTo(-14, 5); ctx.lineTo(-20, 11); ctx.lineTo(-6, 5); ctx.fill();
  ctx.restore();
}

// Phase 1: Earth liftoff, curved trajectory past Jupiter toward Europa
function drawPhase1(t, now) {
  ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.arc(W * .08, H * 1.1, H * .35, 0, 7); ctx.fill();
  ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(W * .1, H * .82, 30, 0, 7); ctx.fill();
  drawJupiter(W * .72, H * .45, Math.min(W, H) * .22);
  const P = [[W * .1, H * .78], [W * .35, H * .05], [W * .9, H * .6]];
  const x = (1 - t) ** 2 * P[0][0] + 2 * (1 - t) * t * P[1][0] + t * t * P[2][0];
  const y = (1 - t) ** 2 * P[0][1] + 2 * (1 - t) * t * P[1][1] + t * t * P[2][1];
  const ang = Math.atan2(2 * (1 - t) * (P[1][1] - P[0][1]) + 2 * t * (P[2][1] - P[1][1]), 2 * (1 - t) * (P[1][0] - P[0][0]) + 2 * t * (P[2][0] - P[1][0]));
  ctx.strokeStyle = 'rgba(56,189,248,.3)'; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(...P[0]); ctx.quadraticCurveTo(...P[1], ...P[2]); ctx.stroke(); ctx.setLineDash([]);
  drawRocket(x, y, ang, true);
  ctx.fillStyle = '#bae6fd'; ctx.beginPath(); ctx.arc(W * .9, H * .6, 8, 0, 7); ctx.fill(); // Europa target
}

// Phase 2: landing, then melting through the ice shell
function drawPhase2(t, now) {
  const top = H * .28, bot = H * .78, land = Math.min(1, t / .25), melt = Math.max(0, (t - .25) / .75);
  const phase = melt ? 'Phase 2: Melting through the ice' : 'Phase 2: Landing on Europa';
  if ($('sim-phase').textContent !== phase) $('sim-phase').textContent = phase;
  $('sim-info').textContent = `Depth: ${(melt * ICE_KM).toFixed(1)} km / ${ICE_KM} km`;
  drawJupiter(W * .8, H * .1, Math.min(W, H) * .16);
  const ice = ctx.createLinearGradient(0, top, 0, bot); ice.addColorStop(0, '#e0f2fe'); ice.addColorStop(1, '#38bdf8');
  ctx.fillStyle = ice; ctx.fillRect(0, top, W, bot - top);
  ctx.strokeStyle = 'rgba(15,23,42,.25)'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(i * W / 13, top); ctx.lineTo(i * W / 13 + 30, top + 40); ctx.stroke(); }
  const oc = ctx.createLinearGradient(0, bot, 0, H); oc.addColorStop(0, '#0c4a6e'); oc.addColorStop(1, '#020617');
  ctx.fillStyle = oc; ctx.fillRect(0, bot, W, H - bot);
  const cx = W / 2, by = melt ? top + melt * (bot - top - 30) : lerp(-40, top - 18, land);
  if (melt) { ctx.fillStyle = 'rgba(8,47,73,.8)'; ctx.fillRect(cx - 5, top, 10, by - top); }
  if (!melt) { ctx.fillStyle = '#e2e8f0'; ctx.fillRect(cx - 8, by - 16, 16, 34); ctx.fillStyle = '#9f1239'; ctx.fillRect(cx - 14, by + 14, 28, 4); }
  else drawCryobot(cx, by, now, picked('tools').some(t => t.id === 'las'));
}

function drawCryobot(x, y, now, laser) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.roundRect(-9, -22, 18, 38, 7); ctx.fill();
  ctx.fillStyle = '#38bdf8'; ctx.fillRect(-9, -8, 18, 4);
  ctx.fillStyle = '#9f1239'; ctx.beginPath(); ctx.arc(0, 18, 4 + Math.sin(now / 120), 0, 7); ctx.fill();
  if (laser) { ctx.strokeStyle = 'rgba(244,63,94,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, 32 + Math.random() * 6); ctx.stroke(); }
  ctx.restore();
}

/* ---------- 6. CRISIS EVENT ---------- */
const EVENTS = [
  { title: 'A plume crosses your path', text: 'Choose how to investigate the disturbed water.', type: 'geyser', options: [
    { label: 'Map the plume with sonar', tool: 'son', result: 'Sonar mapped the plume without moving the probe.', bonus: 12 },
    { label: 'Collect a water sample', tool: 'sub', result: 'The science payload collected a sample for chemical analysis.', bonus: 15 }
  ] },
  { title: 'Faint lights in the ocean', text: 'Investigate the signal and document what you can.', type: 'bio', options: [
    { label: 'Record images with the camera', tool: 'cam', result: 'The camera recorded an unexplained light pattern.', bonus: 12 },
    { label: 'Collect a water sample', tool: 'sub', result: 'The science payload collected a sample near the lights.', bonus: 15 },
    { label: 'Scan the area with sonar', tool: 'son', result: 'Sonar mapped structures near the signal.', bonus: 10 }
  ] }
];

function decisionButton(label, action, unavailable = '') {
  const button = document.createElement('button');
  button.className = 'ev-btn';
  button.textContent = unavailable ? `${label} · ${unavailable}` : label;
  button.disabled = Boolean(unavailable);
  button.onclick = action;
  $('ev-options').appendChild(button);
}

function showDecision(title, detail) {
  $('ev-title').textContent = title;
  $('ev-text').textContent = detail;
  $('ev-options').replaceChildren();
  $('event-box').classList.remove('hidden');
  $('ev-title').focus();
}

function startEvent() {
  const ev = sim.event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  $('sim-phase').textContent = 'Phase 3: Ocean exploration';
  $('sim-info').textContent = `Depth: ${ICE_KM}+ km, inside the ocean`;
  showDecision(ev.title, ev.text);
  for (const option of ev.options) {
    const equipped = sel.tools.includes(option.tool);
    decisionButton(option.label, () => startTransmission(option.result, option.bonus), equipped ? '' : 'tool not equipped');
  }
  decisionButton('Keep a safe distance', () => startTransmission('The probe logged basic environmental readings from a safe distance.', 0));
}

function startTransmission(observation, bonus) {
  sim.phase = 4;
  const reserve = Math.max(0, sim.s.supply - sim.s.need);
  const collected = sim.s.science + bonus;
  const relayWatts = 50;
  $('sim-phase').textContent = 'Phase 4: Transmit to Earth';
  $('sim-info').textContent = `${collected} science points collected · ${reserve.toFixed(1)} W power reserve`;
  showDecision('Send your findings home', `${observation} Send a low-power summary or use ${relayWatts} W of reserve power to relay the full dataset.`);
  decisionButton('Send summary · 60% of science', () => showResults(observation, Math.floor(collected * .6), collected, 'Summary'));
  decisionButton('Send full dataset · 100% of science', () => showResults(observation, collected, collected, 'Full dataset'),
    reserve >= relayWatts ? '' : `requires ${relayWatts} W reserve`);
}

function drawPhase3(now) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0c4a6e'); g.addColorStop(1, '#020617');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const ev = sim.event, cx = W / 2, cy = H * .4 + Math.sin(now / 500) * 8;
  if (ev.type === 'geyser') {
    for (let i = 0; i < 25; i++) { const k = ((now / 700 + i * .137) % 1); ctx.fillStyle = `rgba(186,230,253,${1 - k})`; ctx.beginPath(); ctx.arc(cx + Math.sin(i * 9) * 60 * k, H - k * H, 3 + i % 4, 0, 7); ctx.fill(); }
  } else {
    for (let i = 0; i < 12; i++) { const a = now / 1200 + i; ctx.fillStyle = `rgba(56,189,248,${.3 + .3 * Math.sin(now / 300 + i)})`; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (110 + i * 8), cy + Math.sin(a * 1.3) * 90, 5 + i % 3, 0, 7); ctx.fill(); }
    ctx.shadowBlur = 0;
  }
  drawCryobot(cx, cy, now, false);
}

function showResults(observation, transmitted, collected, packet) {
  const s = sim.s;
  const budgetLeft = LIMITS.budget - s.cost;
  const launchVehicle = picked('launch')[0].name;
  const maxScience = 53; // Drill, submarine payload, sonar, and the sampling bonus
  const score = 40 + Math.round(transmitted / maxScience * 60);
  stopSim();
  showDesign();
  $('modal-card').innerHTML = `<h2 id="report-title">Mission complete</h2>
    <p>You reached Europa’s ocean and sent data to Earth.</p>
    <p>${observation}</p>
    <p class="score">Mission score · ${score}/100</p>
    <div class="report-grid">
      <div class="panel">Science received<b>${transmitted} of ${collected} points</b></div>
      <div class="panel">Transmission<b>${packet}</b></div>
      <div class="panel">Budget remaining<b>$${budgetLeft.toLocaleString()}M</b></div>
      <div class="panel">Probe mass<b>${s.mass.toFixed(1)} / ${massLimit()} kg</b></div>
    </div>
    <p class="muted">${launchVehicle} · ${s.supply.toFixed(1)} W at arrival · Shielding level ${s.shield}</p>
    <div class="actions"><button class="primary" onclick="closeModal()">Improve This Design</button>
    <button class="secondary" onclick="resetDesign()">Reset All Selections</button></div>`;
  $('modal').showModal();
}

buildCards();
refresh();
