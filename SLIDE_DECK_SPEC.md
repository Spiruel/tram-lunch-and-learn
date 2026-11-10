# Transit Time Machine — Slide Deck Specification (`SLIDE_DECK_SPEC.md`)

> **How to use this file:** This is the source of truth for the **36-slide** Fuzzy Labs Lunch & Learn deck ([`src/slides.ts`](./src/slides.ts) + renderers in [`src/engine/`](./src/engine/)).
> Edit any slide's **Objective / Content / Pointers / Iteration Notes**, then prompt:
> *"Update the slide deck to match my changes in `SLIDE_DECK_SPEC.md`."*

---

## Global Directives

- **Title (kept)**: *Britain buried its trams — and shrunk its cities*.
- **Bookends**: Opens with **Londonmaxxing** (why concentrating everything in London makes the whole country poorer) and closes with **"Hiding in plain sight: the UK's second megacity"** (the 8.3M polycentric North).
- **Role of the trams**: The archival timetables are the **smoking gun inside a bigger national economic story**. They are not the whole argument.
- **Real thesis**: Britain entered the knowledge economy with a disadvantaged urban structure, partly because of post-war transport decisions, and is now trying to rebuild the urban concentrations it dismantled.
- **Causal humility (non-negotiable)**:
  - We **prove Level 1** (accessibility loss, never restored).
  - **Level 2** (neighbourhood trajectories) is testable but confounded.
  - **Level 3** (productivity) is the hardest. We don't claim it.
  - Many European cities also cut trams. The comparison is about *retention and reinvestment*, not Britain vs Europe.
- **Visual system**:
  - Pure `#ffffff` 16:9 slides, `88px` margins, sentence-case `50px` titles, monospace `[TAG]` + one-line subtitle.
  - Accent colours: `#7000ff` electric purple, `#f2ecff` lavender, `#00c4a7` mint.
  - About 35–55 words per slide. Nuance goes in the presenter pointers.
- **Layouts (`slideLayout`)**:
  - `cover`: 3 step cards.
  - `split`: hero stat + 4 bullets + 2 pills on the left, canvas figure on the right.
  - `comparison`: CURRENT vs NEW cards + optional stat strip.
  - `closing`: reading list + QR feedback.
- **Standing constraint**: Slide 32's map must frame **only Liverpool, Manchester, Leeds and Sheffield** (`lon -2.23, lat 53.60, spanKm 76`). No Hull, Preston or Birmingham, and no visible satellite-image edges.
- **Claim strength tags** used below:
  - `[MEASURED]`: from our own pipeline.
  - `[CITED]`: from external literature.
  - `[MODELLED]`: an external model estimate.
  - `[ILLUSTRATIVE]`: not yet computed.

## Narrative Arc

| Act | Slides | Goal |
| :--- | :--- | :--- |
| **I · Londonmaxxing & the puzzle** | 01–11 | London is a success, but Britain's other big cities underperform. Why? 30-minute reach matters, still matters with hybrid work, and Britain trails Europe. We pre-empt car substitution and set up the causal problem (Explanation A vs B) honestly. |
| **II · The archival smoking gun** | 12–18 | What did we have? Digitise 1929–1957 timetables and rebuild historical accessibility, accounting for walking, waiting and transfers. |
| **III · Five cities + Harehills** | 19–29 | What did we throw away? City-by-city Level-1 losses, plus the human-scale Harehills micro-history. |
| **IV · Second megacity bookend** | 30–36 | Why the rails were scrapped, the 5/5 scoreboard, fragmentation at two scales, the 8.3M polycentric North, Londonmaxxing vs the polycentric alternative, then further reading and the QR code. |

---

# Act I · Londonmaxxing & the Productivity Puzzle

### 01 · `cover`
- **Layout**: `cover`
- **Objective**: Thesis, method and punchline in 30 seconds.
- **Content**:
  - Kicker: `SAMUEL BANCROFT · TRANSIT TIME MACHINE`
  - Title: *Britain buried its trams — and shrunk its cities*
  - Subtitle: `[SMOKING GUN]` How archival 1929–1957 timetables expose the urban fragmentation behind Britain's productivity gap
  - Cards:
    - `57%` Prosperity gap `[CITED]`
    - `6` Archival guides `[MEASURED]`
    - `5 / 5` Cities shrank `[MEASURED]` (highlight card)
- **Pointers**: Open with the braindump hook: *"Bigger cities should be more productive… Britain is a strange exception… What if some of the explanation was sitting in an archive?"*
- **Iteration Notes**: *(edit here)*

### 02 · `londonmaxxing-provocation` *(NEW · opening bookend)*
- **Layout / scene**: `split` · `londonmaxxing`
- **Objective**: Make the audience care. This is a national growth problem, not regional resentment.
- **Content**:
  - Hero: `57%` of the UK prosperity gap `[CITED · CfC 2026]`
  - Bullets: London is a genuine success · one engine can't carry 68M people · SE business R&D +33% (2018–24) `[CITED · Forth]` · everyone pays via lower GDP
  - Figure: 72% / 57% / +33% bars, and 4 "why everyone pays" mechanisms
- **Pointers**:
  - *"London doesn't become poorer because Manchester becomes richer. Britain becomes poorer because Manchester, Leeds and Birmingham aren't generating the output they could."*
  - Cite Tom Forth's "Londonmaxxing" (10 Mar 2026).
- **Iteration Notes**: *(Verify the +33% and 72% figures against the original sources before presenting.)*

### 03 · `most-important-graph` *(reframed from the ONS slide)*
- **Layout / scene**: `split` · `productivity-chart`
- **Objective**: Show Tom Forth's "most important graph" and "Density is done": UK cities already have the density, but not the connections.
- **Content**:
  - Hero: `5 / 5` below the UK average
  - Figure:
    - Left: ONS output per hour.
    - Right: city size vs GDP per worker. The green EU/US slope sits against a flat red dashed UK-ex-London line.
- **Pointers**: Ask the room *"why is the UK different?"* Stress that this is not an argument for "just build denser".
- **Iteration Notes**: *(edit here)*

### 04 · `agglomeration-theory`
- **Layout**: `split`
- **Objective**: Explain why 30-minute reach drives output, and introduce the effective-city metric `A_i(t) = Σ P_j · 1(T_ji ≤ t)`.
- **Pointers**: Area scales with speed². 18 km/h gives 254 km²; 11 km/h gives 95 km².
- **Iteration Notes**: *(edit here)*

### 05 · `remote-work-objection` *(NEW)*
- **Layout / scene**: `split` · `remote-agglomeration`
- **Objective**: Pre-empt the "but remote work" objection.
- **Content**:
  - Hero: `+1.0%` output per +10% density, after sorting `[CITED · OECD 2020]`
  - DfT October 2024 caveat: agglomeration benefits shrink with remote work, but adapt with land use.
  - Four ecosystem pillars: matching, spillovers, institutions, amenities.
- **Pointers**:
  - Fewer commute days make **reliable** connections matter more, not less.
  - Be nuanced and concede the DfT finding.
- **Iteration Notes**: *(The "22 min vs 70+ min" hybrid example is illustrative. Replace it with real Leeds numbers if wanted.)*

### 06 · `centre-for-cities`
- **Layout**: `split`
- **Objective**: European benchmark: 67% vs 40% reach the centre in 30 minutes.
- **Pointers**: Present the £23.1bn/yr as a **modelled** estimate, not causal proof.
- **Iteration Notes**: *(edit here)*

### 07 · `birmingham-small-city`
- **Layout**: `split`
- **Objective**: Tom Forth's provocation, made visual. 3.74M people live within 30 km, but only 347k (9.3%) can reach the centre at 08:15.
- **Iteration Notes**: *(edit here)*

### 08 · `car-congestion-collapse`
- **Layout**: `split`
- **Objective**: Answer "why not drive?" Peak car reach is 66% lower than free-flow.
- **Iteration Notes**: *(Essential setup for the spatial geometry proof on slide 09.)*

### 09 · `netherlands-backtest` *(reframed: "We dismantled the rails we now need back")*
- **Layout**: `split`
- **Objective**: The historical twist. We spent the 20th century disconnecting our second cities and the 21st century trying to reconnect them.
- **Pointers**: Randstad vs North trajectories are associative. Frame them as the motivation for slide 10, not as proof.

### 10 · `causal-natural-experiment` *(NEW)*
- **Layout / scene**: `split` · `natural-experiment`
- **Objective**: Show intellectual honesty and research design.
- **Content**:
  - Explanation A (tram loss caused decline) vs Explanation B (decline caused tram loss).
  - Group A: Leeds, Birmingham, Liverpool, Sheffield, Manchester, Newcastle.
  - Group B: Rotterdam, Cologne, Lyon, Strasbourg, Lille.
  - Group C: Dresden, Leipzig, and the 120 West German cities.
  - Three levels of evidence.
  - Hero: `+10%` permanent rise in car ownership `[CITED · Kleinschmidt, Roesel & Gäbler 2026, Transport Policy]`
- **Pointers**:
  - *"If German cities measurably changed travel behaviour when they cut trams, what happened to British cities that made the same decision?"*
  - Group B cities **evolved**. They were not frozen in 1945.
- **Iteration Notes**: *(Newcastle isn't reconstructed yet. Either drop it from Group A or add it as future work.)*

# Act II · The Archival Smoking Gun (slides 11–17)

### 11 · `archive-question`
- **Objective**: Three historical questions: what did we have, what did we throw away, what did we build instead?
- **Content**: 6 guides on fixed 2021 LSOAs. Walks, waits and transfers are included.

### 12 · `crich-scan-leeds`
- **Objective**: The artefact itself, and why naive OCR fails on it.
- **Pointers**: *"So I started digitising it."* Show the timetable here (the braindump hook).

### 13 · `surya-crop-bands`
- **Objective**: 3× Lanczos upscale plus 40px overlapping bands.

### 14 · `surya-ocr-validation`
- **Objective**: Surya OCR plus 4 domain invariants.

### 15 · `track-stop-interpolation`
- **Objective**: Stops placed every 300 m on OS track, with dwell times.

### 16 · `gtfs-relational-stack`
- **Objective**: Same GTFS schema for 1957 and 2026.

### 17 · `raptor-wavefront`
- **Objective**: RAPTOR averaging across 08:00, 08:10 and 08:20, covering waits and transfers. This computes `A_i(30)`.
- **Pointers**: Pitch the **reusable methodology** as the real contribution.

### 18 · `but-what-about-cars` *(David Frost Tweet · BBC News Broadcast Graphic)*
- **Layout / scene**: `focus` · `frost-car-objection`
- **Objective**: Front and centre broadcast-style quote of Lord David Frost’s viral objection to Samuel Bancroft’s 1957 Leeds tramway article.
- **Design**: Clean, uncluttered BBC News television-style graphic of the verified X post with author portrait, quoted article embed, and engagement metrics. Stripped of all info-dense rebuttal cards to let the presenter speak to the quote before Act III delivers the empirical data.

# Act III · Five-City Reconstruction & Harehills (slides 19–29)

### 19 · `leeds-historical`
- **Measured**: 433k people within 30 minutes in 1957 `[MEASURED]`.

### 20 · `leeds-crossfade`
- **Objective**: −41% reach, and it was **never restored**. Leeds is the largest Western European city without urban rail.

### 21 · `harehills-micro-story` *(NEW)*
- **Layout / scene**: `split` · `harehills-triptych`
- **Objective**: Turn the macro argument into a human one: where you live decides which opportunities you can reach.
- **Content**:
  - Hero: `−10m` (Harehills & Gipton cluster, worse by 10.3 min) `[MEASURED]`
  - Panel 1: 1957 tram network. Median **11 min** to Briggate across 19 LSOAs (range 7–21 min) `[MEASURED]`.
  - Panel 2: 2026 buses. Median **25 min** (19–32 min). About 45% of households have no car `[MEASURED]`.
  - Panel 3: modernised-LRT counterfactual, **not yet modelled** `[ILLUSTRATIVE]`.
- **Caveat (keep on the slide)**: The Chapeltown Rd → Harehills Ave spur to Reginald Terrace was **already disused before 1945**. It did **not** close in 1959. It's a micro-history of gradual contraction.
- **Pointers**:
  - The point is not "Harehills would be richer". It's about who can participate in the urban economy.
  - Optional follow-up question: how does Harehills compare with a similar neighbourhood in Lyon or Rotterdam?
- **Iteration Notes**:
  - *(Run a modern-LRT GTFS through RAPTOR to fill Panel 3.)*
  - *(Add jobs-accessible counts instead of only travel times.)*

### 22 · `leeds-stress-test`
- **Objective**: Robustness checks plus the low-car equity overlay.

### 23 · `trans-pennine-expanse`
- **Objective**: Connecting towns to cities (a Tom Forth idea). A 68-mile chain of trams.

### 24–29 · Liverpool / Manchester / Sheffield / Birmingham
- **Slides**: 24 Liverpool 1937 · 25 Liverpool loss 2.24× · 26 Manchester 1933 · 27 Manchester loss (even the 1943 Blitz timetable beats 2026) · 28 Sheffield 1.40× · 29 Birmingham 1.20×
- **Iteration Notes**: *(Consider collapsing 24 and 26 into their crossfade slides to save about 2 minutes.)*

# Act IV · Second Megacity Bookend (slides 30–36)

### 30 · `tramway-conspiracy`
- **Layout**: `comparison`
- **Objective**: Why were the rails scrapped?
- **Content**:
  - Tramways Act 1870 road rates, deferred track renewal, "flexible" buses.
  - **Key nuance**: many European cities cut trams too. What made Britain different was the lack of reinvestment.
  - Stat strip includes the German DiD result (≥10%).

### 31 · `five-city-scoreboard`
- **Objective**: The Level-1 headline: 5/5 cities lost reach, and it was never restored.
- **Pointers**: *"You don't need Level 3 to have established something meaningful."*

### 32 · `two-speed-curves`
- **Objective**: Fragmentation at **two scales**:
  - Within cities (0–30 min): buses replaced trams and reach shrank.
  - Between cities (42 min+): rail was retained and reach grew.

### 33 · `northern-megacity` *(closing bookend)*
- **Objective**: *Hiding in plain sight: the UK's second megacity.* 8.3M people across Greater Manchester (2.9M), West Yorkshire (2.4M), Liverpool City Region (1.6M) and South Yorkshire (1.4M).
- **Content**:
  - Map nodes are relabelled with specialisms.
  - Badge: `8.3M polycentric megacity`.
  - Source: r/GoodNewsUK / CityEd and NAO NPR (2026).
- **Constraint**: frame only Liverpool, Manchester, Leeds and Sheffield.
- **Pointers**: *"London has the agglomeration benefits of a megacity. The North has the ingredients of one, but not yet the connectivity."*

### 34 · `polycentric-knowledge-clusters` *(NEW)*
- **Layout / scene**: `split` · `polycentric-north`
- **Objective**: What if the North worked like one big city?
- **Content**:
  - Four city cards: specialisms plus a cross-city collaboration example.
  - Three ingredients: urban LRT, Northern Powerhouse Rail, public R&D & devolution.
  - Hero: `£40bn/yr` `[MODELLED · HM Gov]`
  - Rhine-Ruhr as a comparator.
- **Pointers**:
  - Polycentric does not mean merged.
  - Transport isn't the only missing ingredient (Forth, "Researching R&D").

### 35 · `london-vs-polycentric` *(NEW · verdict)*
- **Layout**: `comparison`
- **Objective**: The Londonmaxxing model vs the polycentric alternative.
- **Pointers**:
  - Return to the timetable: *"Perhaps the most interesting thing about this old timetable isn't where the trams used to go. It's the economic potential of the places they connected."*
  - *"Can Britain afford to have only one great city?"*

### 36 · `further-reading`
- **Layout**: `closing`
- **Content**:
  - Reading list: Tom Forth essays · Second Megacity (Reddit / CityEd) · 2026 German DiD study · DfT 2024 + CfC 2026 · Crich archive + pipeline.
  - QR code: `https://tinyurl.com/fuzzy-labs` (`tinyurl.com/fuzzy-labs`).
- **Pointers**: Leave this slide up during Q&A.
