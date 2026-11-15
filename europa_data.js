/* ==========================================================
   europa_data.js  (v2) - all game data, with per-field traceability.
   Tag legend (shown as superscripts on every card; hover for the note):
     N = taken directly from a NASA/JPL document (URLs in SOURCES.md)
     S = SECONDARY source (press, encyclopedia, science site, workshop slides)
         that reports or relays NASA data but is not itself a NASA document
     D = derived arithmetically from N/S numbers, with no extra assumptions
         (math in the note)
     A = engineering assumption / game balance. No public NASA figure
         exists (a Europa cryobot has never flown). Do NOT cite as NASA data.
   Item fields: t = tag per field, n = note per field.
   ========================================================== */

const TAGS = { N: 'NASA/JPL document', S: 'Secondary source (not a NASA document)', D: 'Derived from NASA numbers', A: 'Assumption / game balance (no NASA figure)' };

/* ---------- Europa environment ---------- */
const FACTS = {
  iceKm: 29, iceErrKm: 10,   // 29 km [N] (Juno release); +/-10 km [S] (Nature Astronomy paper via summary site)
  surfaceC: -160,            // [S] Planetary Society / Space.com: ~ -160 C equator, ~ -220 C poles
  radSvPerDay: 5.4,          // [S] Universe Today and similar: ~5.4 Sv (540 rem) per day at the surface
  oceanKm: 100               // [N] NASA infographic: ocean ~100 km deep
};
const ICE_KM = FACTS.iceKm;

/* Traceability for every global constant. The UI renders these as badges
   under the telemetry panel (hover for the note). */
const GLOBALS = {
  iceKm:    { t: 'N', n: 'Juno microwave radiometer (SwRI/JPL release): about 29 km. Conductive layer only; total shell could be thicker' },
  iceErr:   { t: 'S', n: '+/-10 km is from the Nature Astronomy paper as relayed by a summary site, not the NASA release' },
  surfaceC: { t: 'S', n: 'Planetary Society / Space.com: about -160 C at the equator' },
  rad:      { t: 'S', n: 'About 5.4 Sv/day at the surface, from Universe Today and similar sites; NASA radiation-map page not checked for this number' },
  ocean:    { t: 'N', n: 'NASA/JPL Europa infographic: about 100 km' },
  budget:   { t: 'S', n: 'Clipper total of about $5.2B is press-reported (AP). The $3.8B development+launch plus $1.2B operations split (Planetary Society) sums to $5.0B, so the two do not match; neither is an official NASA line item' },
  ops:      { t: 'S', n: 'Clipper operations about $1.2B (Planetary Society via Live Science) used as an analog for this mission' },
  stack:    { t: 'A', n: 'No NASA figure for a cruise/deorbit/descent stack cost or mass' },
  bus:      { t: 'D', n: 'Sums of JPL cryobot trade-study lines (workshop slides, read from a search snippet; verify against the PDF). Power system excluded' }
};

/* ---------- Radioisotope decay model ----------
   Pu-238 decay alone (half-life 87.7 yr) is only ~0.79 %/yr, but that is NOT
   what a real MMRTG loses: thermocouple degradation adds to it. NASA's MMRTG
   fact sheet gives 110 We at launch and 72 We after 17 yr, so we use the
   NASA-derived rate (~2.4 %/yr) instead of the Pu-238-only rate. */
const PU238_RATE = 1 - Math.pow(0.5, 1 / 87.7);                 // D: ~0.0079 /yr, reference only
const decayRate = (p0, pEnd, yrs) => 1 - Math.pow(pEnd / p0, 1 / yrs);
const MMRTG_RATE  = decayRate(110, 72, 17);                      // D: NASA fact sheet 110 -> 72 We over 17 yr  (~0.0245 /yr)
const EMMRTG_RATE = decayRate(141, 72 * 1.5, 17);                // D/A: NASA RPS slide: EOL power ">50% above MMRTG" -> 108 We at 17 yr (~0.0155 /yr)
// Electrical watts after `yrs` years in transit (clock starts at launch)
const powerAt = (p, yrs) => p.solar ? 0 : p.watts * Math.pow(1 - (p.rate || 0), yrs);

/* ---------- Budget ---------- */
const LIMITS = {
  budget: 5200,              // [S] Clipper total ~$5.2B per press. NOTE: $3.8B + $1.2B = $5.0B, so the commonly quoted split does not match it
  shield: 3                  // [A] game rule, minimum protection level
};
// Costs every mission pays regardless of choices ($M)
const FIXED_COSTS = [
  { name: 'Mission operations', cost: 1200, tag: 'S', note: 'Clipper ops ~$1.2B (Planetary Society) used as an analog; not an official NASA line item' },
  { name: 'Cruise/deorbit/descent stack', cost: 800, tag: 'A', note: 'No NASA figure for a lander stack cost' }
];
const FIXED_COST_TOTAL = FIXED_COSTS.reduce((a, c) => a + c.cost, 0);

/* ---------- Mass model ---------- */
const BASE = {               // [D] from JPL cryobot trade study (Cwik workshop slides, [S] document): probe subsystems, power system excluded
  mass: 134.8,               // D: 4.59 nav + 1.50 C&DH + 5.55 telecom + 112 structure + 11.2 thermal = 134.84
  watts: 170.4               // D: 11.4 nav + 10 C&DH + 30 telecom + 5 structure + 110 thermal + 4 power = 170.4
};

const CATS = {
  launch: { title: 'Launch Vehicle', hint: 'Choose a lighter, slower route or pay more to carry a heavier probe.', max: 1, items: [
    { id: 'fh', name: 'Falcon Heavy (expendable)', cost: 178, mass: 0, cap: 5800, stack: 5410, yrs: 5.5, ms: 7000,
      t: { cost: 'A', stack: 'A', cap: 'N', yrs: 'N' },
      n: { cost: 'Press-reported ~$178M; not verified on a NASA page',
           cap: 'JPL press kit: Clipper weighs about 5,800 kg at launch (NASA blog: about 6,000 kg). Demonstrated mass, not a maximum capacity. The 6,065 kg figure appears only in Wikipedia and is not used',
           yrs: '5.5 yr using Mars and Earth gravity assists (NASA)' } },
    { id: 'sls', name: 'SLS Block 1B (direct)', cost: 2000, mass: 0, cap: 14000, stack: 13450, yrs: 2.7, ms: 4000,
      t: { cost: 'A', stack: 'A', cap: 'A', yrs: 'A' },
      n: { cost: 'About $2B per launch, press-reported; unverified',
           cap: 'Based on the 14 t Europa Lander concept launch mass (JPL slides), which is not an SLS capacity limit. NASA SLS brochure says up to 9.7 t to Europa: unreconciled',
           yrs: 'NASA only says a direct transfer takes under half of 5.5 yr; 2.7 is my pick' } } ] },
  hull: { title: 'Radiation Protection', hint: 'Choose one. You need level 3 or higher.', max: 1, items: [
    { id: 'al', name: 'Aluminum shell, no vault', cost: 30, mass: 20, shield: 1,
      t: { cost: 'A', mass: 'A', shield: 'A' }, n: { shield: 'Game rating, not a NASA unit' } },
    { id: 'ice', name: 'Melt-in ice shielding + sacrificial shell', cost: 50, mass: 15, shield: 3, needsDrill: true,
      t: { cost: 'A', mass: 'A', shield: 'A' }, n: { shield: 'Concept from JPL cryobot study (probe melts into ice to shield electronics); only works with the drill' } },
    { id: 'vlt', name: 'Clipper-class Al-Zn vault (9.2 mm, Ta plate)', cost: 250, mass: 150, shield: 3,
      t: { cost: 'A', mass: 'A', shield: 'A' }, n: { mass: 'NASA publishes wall thickness (up to 9.2 mm Al-Zn, ~1 mm Ta plate) but not vault mass', shield: 'Game rating' } },
    { id: 'tk', name: 'Thick Ta / Al-Zn vault (lander class)', cost: 400, mass: 300, shield: 5,
      t: { cost: 'A', mass: 'A', shield: 'A' }, n: { cost: 'Invented option; no NASA design' } } ] },
  power: { title: 'Power Source', hint: 'Choose one. Longer trips reduce the arrival power of radioisotope generators.', max: 1, items: [
    { id: 'sol', name: 'Clipper-class solar arrays', cost: 120, mass: 400, watts: 600, solar: true,
      t: { cost: 'A', mass: 'A', watts: 'S' },
      n: { watts: '600 W at Jupiter from Wikipedia (secondary); orbiter only. Gives 0 W under the ice' } },
    { id: 'mm', name: '6 x MMRTG', cost: 500, mass: 270, watts: 660, rate: MMRTG_RATE,
      t: { cost: 'A', mass: 'D', watts: 'D', rate: 'D' },
      n: { mass: '6 x 45 kg (NASA fact sheet)', watts: '6 x 110 We at launch (NASA fact sheet)', rate: '110 -> 72 We over 17 yr = ~2.4 %/yr (includes thermocouple loss). The 17 yr may include up to 3 yr of pre-launch storage, so starting the clock at launch may be slightly pessimistic' } },
    { id: 'emm', name: '5 x eMMRTG (projected)', cost: 600, mass: 215, watts: 705, rate: EMMRTG_RATE,
      t: { cost: 'A', mass: 'D', watts: 'D', rate: 'A' },
      n: { mass: '5 x 43 kg (NASA NTRS, projected)', watts: '5 x 141 We projected; never flown', rate: 'Assumption chain: NASA says EOL power is >50% above MMRTG; I took exactly 1.5 x 72 = 108 We at 17 yr, giving ~1.6 %/yr' } },
    { id: 'kp1', name: 'Kilopower 1 kWe fission', cost: 800, mass: 400, watts: 1000, rate: 0,
      t: { cost: 'A', mass: 'A', watts: 'N', rate: 'A' },
      n: { mass: 'NASA gives 2.5-6.5 W/kg across 1-10 kWe. Applying the LOW end to 1 kWe (1,000 / 2.5 = 400 kg) is my assumption', watts: 'NASA: 1-10 kWe class; never flown', rate: 'Fuel burn-up negligible over years; assumed 0' } },
    { id: 'kp10', name: 'Kilopower 10 kWe fission', cost: 1500, mass: 1538, watts: 10000, rate: 0,
      t: { cost: 'A', mass: 'A', watts: 'N', rate: 'A' },
      n: { mass: 'Applying the HIGH end of NASA range to 10 kWe (10,000 / 6.5 = 1,538 kg) is my assumption', watts: 'NASA: 1-10 kWe class; never flown' } } ] },
  tools: { title: 'Probe Instruments', hint: 'Include the drill. Pick one or two more tools to collect science.', max: 3, items: [
    { id: 'las', name: 'Ice-melting drill / water jet', cost: 150, mass: 16, draw: 400, science: 10,
      t: { cost: 'A', mass: 'N', draw: 'N', science: 'A' }, n: { mass: 'JPL cryobot trade study slides: 16 kg, 400 We. Slides are a workshop document and were read from a search snippet; verify against the PDF' } },
    { id: 'sub', name: 'Submarine science payload', cost: 300, mass: 26.7, draw: 27.2, science: 20,
      t: { cost: 'A', mass: 'N', draw: 'N', science: 'A' }, n: { mass: 'JPL cryobot trade study slides: 26.7 kg, 27.2 We. Read from a search snippet; verify against the PDF' } },
    { id: 'son', name: 'Echo sounder / ocean sonar', cost: 60, mass: 5, draw: 20, science: 8,
      t: { cost: 'A', mass: 'A', draw: 'A', science: 'A' }, n: {} },
    { id: 'cam', name: 'Camera & lights', cost: 40, mass: 2, draw: 10, science: 6,
      t: { cost: 'A', mass: 'A', draw: 'A', science: 'A' }, n: {} } ] }
};

const SOURCES = [
  ['Clipper mass, vault, launcher',   'https://jpl.nasa.gov/press-kits/europa-clipper/quick-facts'],
  ['Clipper spacecraft',              'https://science.nasa.gov/mission/europa-clipper/spacecraft-meet-europa-clipper'],
  ['Clipper tantalum vault plate',    'https://science.nasa.gov/blogs/europa-clipper/2024/10/14/meet-nasas-europa-clipper-spacecraft'],
  ['Clipper instruments',             'https://science.nasa.gov/mission/europa-clipper/spacecraft-instruments/'],
  ['Juno ice shell thickness',        'https://doi.org/10.1038/s41550-025-02718-0'],
  ['MMRTG fact sheet',                'https://science.nasa.gov/wp-content/uploads/2024/02/mmrtg-factsheet-updated-5-18-20-1.pdf'],
  ['eMMRTG (NTRS)',                   'https://ntrs.nasa.gov/api/citations/20160014874/downloads/20160014874.pdf'],
  ['Kilopower (NTRS)',                'https://ntrs.nasa.gov/api/citations/20180001487/downloads/20180001487.pdf'],
  ['JPL cryobot trade study',         'https://www.kiss.caltech.edu/workshops/oceanworlds/presentations/Cwik.pdf'],
  ['Europa Lander 14 t launch mass',  'https://colorado.edu/event/ippw2018/sites/default/files/attached-files/outersys_1_sell_presid716_presslides_docid1199.pdf'],
  ['Clipper cost (AP, press)',          'https://abc6onyourside.com/news/offbeat/nasa-jupiter-moon-life-space-rocket-craft-satellite-planet-europa-earth-alien-clipper-galaxy-mars-x-spacex-star-conditions-fly'],
  ['Clipper cost split (Live Science)', 'https://livescience.com/space/space-exploration/europa-clipper-blasts-off-whats-next-for-nasas-biggest-ever-interplanetary-spacecraft'],
  ['Europa radiation maps',           'https://europa.nasa.gov/news/17/radiation-maps-of-europa-key-to-future-missions']
];
