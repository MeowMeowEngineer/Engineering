# Laura Bassi Scholarship, Winter 2026: Application Answers

Deadline: 15 November 2026 · Results: 4 December 2026

Text in `[CONFIRM: ...]` is a placeholder for a fact only the applicant can supply. Remove every placeholder before pasting into the portal.

Two manuscript options are drafted. Version A is the recommended one. Use one version only.

---

## Form fields

The official form could not be opened from the drafting environment. The fields below are the ones usually asked; match them to the live portal.

| Field | Answer |
|---|---|
| Full name | Eunsung Jang |
| Email | jangstar@ajou.ac.kr |
| Institution | Ajou University, Suwon, Republic of Korea |
| Department | Department of Electrical and Computer Engineering (RF System Technologies Lab., advisor: Prof. Jeong-Wook Kim) |
| Academic status | Doctoral candidate, integrated M.S./Ph.D. program `[CONFIRM: how the university classifies the current semester]` |
| Field of study | Electrical engineering: RF systems, antennas, radar signal processing |
| Manuscript type | Journal article |
| Manuscript title | Version A: `[CONFIRM: working title]` / Version B: Coaxial Cable Loss Reduction through Uniform Air-Hole PTFE Dielectric Fabricated by Ram Extrusion |
| Manuscript length | `[CONFIRM: word count]` |
| Previous application | Yes, `[CONFIRM: round, e.g. Summer 2026]` |
| Attachment | CV (PDF), uploaded together with the form |

---

## Version A (recommended): through-the-wall radar journal manuscript

### A1. In 250 words or less, describe your manuscript's intended purpose.

The manuscript reports a distributed, dual-polarized FMCW radar that detects a person behind a wall when the person walks across the radar's line of sight. I plan to submit it to `[CONFIRM: target journal]` by `[CONFIRM: month, 2027]`.

One radar measures motion only along its own line of sight. A person who walks parallel to the wall barely changes range and produces almost no Doppler shift, so clutter suppression removes the person's echo along with the static returns. In IEEE Internet of Things Journal (2025), I designed the radar with high-gain lens array antennas to keep the echo above the noise after two passes through the wall. At APMC 2025, I used machine learning to select the range bins for coherent integration during frontal and lateral motion. At the KIEES Winter Conference 2026, I combined the co- and cross-polarized channels by their band-energy difference.

The manuscript joins these steps into one processing chain and tests it on measurements through `[CONFIRM: wall types]` with `[CONFIRM: number of subjects and motion patterns]`. It compares the chain with single-radar and single-polarization processing for each motion direction, reporting detection rate and false alarms. `[CONFIRM: one headline result with numbers]`

Through-the-wall studies often test only a person walking toward the radar or breathing in place; this manuscript measures lateral motion. English is my second language, and editing would help me submit a clear manuscript.

### A2. In 250 words or less, describe how your field of study stands to benefit from your research.

On 11 January 2022, the upper floors of an apartment tower under construction in Hwajeong-dong, Gwangju, collapsed, and six workers went missing. A week later, five of them had still not been located; the search ended on 8 February. Search teams at such sites rely on dogs, listening devices, and cameras pushed through gaps, which need an opening or a sound from the victim.

Radio waves pass through walls and debris, so radar can find a person who is silent and out of sight. Yet through-the-wall radar for rescue draws less research than automotive or communication radar, and most published systems use one radar with one polarization. That setup handles two cases poorly: a person who walks across the radar's line of sight, and a wall that changes the polarization of the echo.

My research addresses both cases with hardware I designed and measured. Two radars placed apart view the scene from different angles, so motion across one radar's line of sight moves toward the other. Dual-polarized lens array antennas receive the co- and cross-polarized echoes, which I combine by their band-energy difference. Machine-learning range-bin selection then decides where to integrate the echo coherently.

The field would gain measured results for lateral motion behind real walls, a reference that other groups can test their systems against. The same lens antenna approach now extends to C-band integrated sensing and communication (KICS 2026).

---

## Version B (alternative): coaxial cable manuscript under review

### B1. In 250 words or less, describe your manuscript's intended purpose.

The manuscript, "Coaxial Cable Loss Reduction through Uniform Air-Hole PTFE Dielectric Fabricated by Ram Extrusion," is under review at `[CONFIRM: journal]`. I am the first author, and I expect to revise it after the review.

Its purpose is to show that a PTFE dielectric with uniform air holes, formed by ram extrusion, lowers the loss of a coaxial cable. Air in the dielectric lowers its effective permittivity. For a fixed outer diameter and a 50-ohm impedance, a lower permittivity allows a thicker inner conductor, which reduces conductor loss, and the dielectric itself absorbs less power. Foamed PTFE uses the same idea, but its voids vary in size and position `[CONFIRM: keep only if the manuscript makes this comparison]`. In ram extrusion, PTFE paste is pushed through a die that forms the holes, so the die sets the hole size and spacing.

I ran the electromagnetic simulations, optimized the hole geometry, wrote the manuscript, and am answering the reviewers. The manuscript reports `[CONFIRM: measured loss in dB/m at a stated frequency, against a solid-PTFE cable of the same size]` and `[CONFIRM: impedance or return-loss uniformity along the cable]`.

English is my second language. Editing the revised manuscript would help me answer the reviewers' points in clear, precise English.

### B2. In 250 words or less, describe how your field of study stands to benefit from your research.

Every RF system carries its signal through cables, and cable loss rises with frequency. As radar, satellite, and 5G links move to higher bands, a fraction of a decibel per meter in the cable becomes a direct loss in range or data rate.

Even so, coaxial cable dielectrics get little attention in the research literature. Antenna and circuit papers usually treat the cable as a fixed loss to be calibrated out, and the methods for making low-loss dielectrics stay inside cable manufacturers as process know-how. An engineer who wants to know why one cable loses less than another has few published measurements to check.

My manuscript puts one such process into the open literature. It connects the hole geometry, the extrusion process, and the measured loss, so readers can see which design choice changes which part of the loss.

The topic connects to my radar research. In a through-the-wall radar, every decibel lost between the radar board and the antenna lowers the signal-to-noise ratio of the echo from a person behind the wall. Lower cable loss returns that margin without changing the radar itself.
