# Europa Deep: data sources and traceability

Mission Nova is a fictional Europa mission simulator. Equipment cards use source tags where applicable:

| Tag | Meaning |
|---|---|
| **N** | Taken directly from a NASA/JPL document |
| **S** | Secondary source: press, encyclopedia, science site, or workshop slides that relay NASA data but are not themselves a NASA mission document |
| **D** | Derived arithmetically from N/S numbers with no extra assumptions |
| **A** | Engineering assumption or game balance. No public NASA figure exists: a Europa cryobot has never been built or flown. **Do not cite as NASA data.** |

## Europa environment
| Value | Tag | Source |
|---|---|---|
| Ice shell about 29 km (conductive layer; total could be thicker) | N | Juno microwave radiometer release: https://www.missionjuno.swri.edu/news/nasa-s-juno-measures-thickness-of-europa-s-ice-shell ; paper: https://doi.org/10.1038/s41550-025-02718-0 |
| Ice shell uncertainty ±10 km | S | Relayed by a summary site (Scientific Frontline) of the Nature Astronomy paper; check the paper itself |
| Ocean depth about 100 km | N | NASA/JPL infographic: https://europa.nasa.gov/resources/193 |
| Surface about -160 °C (equator), about -220 °C (poles) | S | https://www.planetary.org/explore-worlds/europa |
| Radiation about 5.4 Sv (540 rem) per day at the surface | S | Universe Today and similar sites. NASA radiation-map page (not checked for this figure): https://europa.nasa.gov/news/17/radiation-maps-of-europa-key-to-future-missions |

## Budget
- **Cap $5,200M: S.** The Clipper total of about $5.2B is press-reported (AP): https://abc6onyourside.com/news/offbeat/nasa-jupiter-moon-life-space-rocket-craft-satellite-planet-europa-earth-alien-clipper-galaxy-mars-x-spacex-star-conditions-fly
- The commonly quoted split of about $3.8B development+launch and about $1.2B operations (Planetary Society, via https://livescience.com/space/space-exploration/europa-clipper-blasts-off-whats-next-for-nasas-biggest-ever-interplanetary-spacecraft) **sums to $5.0B, not $5.2B**. The two do not match, and neither is an official NASA line item.
- Clipper is an orbiter. A lander plus cryobot would cost more, so the cap is only an analog.
- **Fixed costs deducted before any choice ($2,000M total):** mission operations $1,200M (S, Clipper ops used as an analog) and the cruise/deorbit/descent stack $800M (A).
- All item costs and launcher prices are A. Falcon Heavy about $178M and SLS about $2B are press-reported and unverified.

## Launch vehicles
- **Falcon Heavy:** carries about 5,800 kg (N). The JPL press kit says about 5,800 kg: https://jpl.nasa.gov/press-kits/europa-clipper/quick-facts ; a NASA blog says about 6,000 kg: https://science.nasa.gov/blogs/europa-clipper/2024/10/14/meet-nasas-europa-clipper-spacecraft . This is the demonstrated Clipper mass, not a maximum capacity. The 6,065 kg figure appears only in Wikipedia, so it is not used. Transit 5.5 yr (N, same JPL page).
- **SLS Block 1B:** 14,000 kg (A) is based on the Europa Lander concept launch mass (JPL IPPW 2018 slides: https://colorado.edu/event/ippw2018/sites/default/files/attached-files/outersys_1_sell_presid716_presslides_docid1199.pdf), which is not an SLS capacity limit. NASA's SLS brochure separately says "up to 9.7 t to Europa"; the two are unreconciled. Transit 2.7 yr is A: NASA only says a direct transfer takes under half of 5.5 yr.

## Radiation protection
- Clipper's vault has aluminum-zinc walls up to 9.2 mm thick (https://europa.nasa.gov/spacecraft) and a tantalum plate of about 1 mm (NASA blog above). NASA does not publish vault mass or cost here.
- All vault masses, costs, the thick lander-class vault, and shielding levels 1-5 are A.
- Melt-in ice shielding is a JPL cryobot-study concept (S); mass and cost are A.

## Power
- **MMRTG:** 110 We at launch, 45 kg, 72 We after 17 yr (N): https://science.nasa.gov/wp-content/uploads/2024/02/mmrtg-factsheet-updated-5-18-20-1.pdf . Six units give 660 We and 270 kg (D).
- **eMMRTG:** 141 We and 43 kg, projected and never flown (N): https://ntrs.nasa.gov/api/citations/20160014874/downloads/20160014874.pdf . Five units give 705 We and 215 kg (D).
- **Kilopower:** 1-10 kWe class, 2.5-6.5 W/kg, never flown (N): https://ntrs.nasa.gov/api/citations/20180001487/downloads/20180001487.pdf . The masses 400 kg (1 kWe) and 1,538 kg (10 kWe) are A: applying the low end of the range to 1 kWe and the high end to 10 kWe is my choice.
- **Solar arrays 600 W at Jupiter:** S (Wikipedia). Usable power under the ice is 0 W (no sunlight). Mass and cost are A.

### Radioactive decay model (power checked at arrival)
Power at arrival = launch watts × (1 − rate)^(transit years), with the clock starting at launch.
- **Pu-238 alone** decays about 0.79%/yr (half-life 87.7 yr). Kept in the data file for reference only, because it understates real RTG losses (thermocouple degradation is extra).
- **MMRTG, about 2.5%/yr (D):** 110 We falling to 72 We over 17 yr, from the NASA fact sheet. The 17 yr may include up to 3 yr of pre-launch storage, so starting the clock at launch may be slightly pessimistic.
- **eMMRTG, about 1.6%/yr (A):** assumption chain. NASA says end-of-life power is more than 50% above the MMRTG's; I took exactly 1.5 × 72 = 108 We at 17 yr.
- **Kilopower:** rate assumed 0 (A).
- Check: with SLS (2.7 yr), 5 eMMRTGs give 675.8 We against 617.6 We needed for drill + science payload + sonar. 6 MMRTGs give 617.0 We and fail by 0.6 W.

## Probe bus and instruments (JPL cryobot trade study)
Source: https://www.kiss.caltech.edu/workshops/oceanworlds/presentations/Cwik.pdf (JPL workshop slides, **S**, not a NASA mission document). These values were read from a search snippet and **must be verified against the PDF before citing**.
- Probe total 210.8 kg and 597.6 We (the line items sum correctly). Margins in the slides: 41% mass against a 335 kg landed allocation; 29% power against 836 W end-of-life.
- Probe bus 134.8 kg and 170.4 We (D): sums of the study lines, excluding the power system mass and the drill and payload.
- Drill / water jet 16 kg, 400 We; submarine payload 26.7 kg, 27.2 We (S; costs and science points A).
- Sonar and camera specs are A.

## Known gaps (state these in your submission)
- **No melt-energy or melt-time model.** The study uses about 7 kWth main plus 1 kWth nose heat sources, which the game does not model. The 400 W drill is a placeholder.
- **No power margin.** The JPL study kept 29%; the game checks bare needs.
- **Rocket allowances are game balance assumptions.** Falcon Heavy uses a 5,410 kg fictional carrier stack and a 390 kg probe allowance. SLS uses a 13,450 kg fictional stack and a 550 kg probe allowance. These are playable scenarios, not launch capability claims.
- **Not NASA data:** all game logic: scoring, science points, science bonuses, transmission thresholds, animation timing, and the rule that ice shielding requires the drill.
