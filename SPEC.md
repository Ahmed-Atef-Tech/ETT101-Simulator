# Telecoms-Trainer 101 Simulator — model specification (v0.23)

Sources, in order of precedence:
1. **ETT-101 BiSKIT Specifications V1.1** (Emona, emona-tims.com) — the product's own spec table.
2. **ETT-101 User Manual** (Emona sample, tecnoedu.com / emona-tims.com).
3. **The course lab books**: Electrical Testing 4 (Emona Lab Manual Vol.1 Exp. 4–10) and Electrical Testing 7 (Vol.1 Exp. 11–20 + Vol.2: sampling, PCM, ASK, FSK, BPSK, QPSK, DSSS, PWM, PLL, SNR, delta and delta-sigma) — procedures, scope settings and expected results.
4. **Emona ETT-202 DATEx specifications** (NI, archived) — same module family as the ETT-101; numbers identical to Spec 1.1 for every shared module.
5. **Emona DATEx lab manual sample** (NI, download.ni.com) and the DATEx user manual — used only where 1–3 are silent.
6. **TIMS-301 user manual** (Emona, NJIT copy) — the parent product; used only to confirm the VCO's "G·Vin, 1 < G < 2" control.

### Where the official sources disagree (and what the model uses)
| Item | Sources | Model |
|---|---|---|
| Tuneable LPF range | Spec 1.1: 600 Hz–12 kHz. User manual text: 300 Hz–16 kHz. Lab manuals: "maximum cut-off about 15 kHz" (ET7 Vol.2 Exp.17 step 31 and Exp.18 step 28; DATEx Vol.2 Exp.14 "fully clockwise gives 15 kHz") | **300 Hz–15 kHz** |
| Tuneable LPF gain | Spec 1.1: 0–1.6. User manual: 0–×2 | 0–2 |
| Buffer gain | Spec 1.1 ("Amplifier"): 0.2–10. User manual: 0–10 | 0–10 (audio taper) |
| Adder / Buffer bandwidth | Spec 1.1: ≈600 kHz. User manual: ≈1 MHz / ≈700 kHz | 600 kHz |
| Speech output | Spec 1.1: 0.6 Vrms typ. User manual: 2 Vrms typ. | depends on the PC microphone |
| VCO HI low end | Spec 1.1: 60 kHz. ET7 Vol.2 Exp.2 step 38: ≈50 kHz | 60 kHz |

Not modelled (documented but not numerically pinned down): input loading. Inputs are 10 kΩ or 56 kΩ (which input has which is not published), outputs 330 Ω analog / 47 Ω digital, so a real reading can be 0.6–3 % lower than ideal. The DATEx lab manual says real measurements fall short of the ideal values "because of loading and imperfect gains".

Simulation: 4.8 MHz (100 kHz carrier = 48 samples/cycle; all Master Signals synchronous). Audio-band filters run at 600 kHz with decimation/interpolation (identical passband response).

## Module equations

| Module | Equation / model | Values | Source |
|---|---|---|---|
| Master Signals | exact periodic tables | 100 kHz sin & cos 4 Vp-p; 100 kHz, 8.333 kHz, 2.083 kHz digital 0–5 V; 2.083 kHz sine 4 Vp-p | Spec 1.1 |
| Adder | OUT = −(G·A + g·B) | 0 < G, g < 2; one pole at 600 kHz | Spec 1.1, User manual ("gains are negative"), lab manual Exp.3 ("gain … −1") |
| Adder (channel) | OUT = NOISE + SIGNAL | gain 1; pole 600 kHz | Spec 1.1 |
| Multiplier ×3 | OUT = k·X·Y | **k = 1**; pole 600 kHz; AC inputs: 1st-order HPF (16 Hz, assumed) | Spec 1.1 table "k approx 1"; lab book: DSBSC viewed at 2 V/div, overload at ½ BUFFER travel |
| Buffer | OUT = −Gain·IN | 0–10, audio taper (volume control); pole 600 kHz; **inverting** | User manual; inversion: ET7 Exp.12 & 13 ("used to invert the message"); taper matches ET4 DSBSC Part C |
| Noise | white 10 Hz–240 kHz | 0 dB 4.8 Vrms, −6 dB 2.4, −20 dB 0.48 | Spec 1.1 |
| Channel BPF | 6th-order Chebyshev I, 0.1 dB | 88–112 kHz, gain 1 | Spec 1.1 |
| Baseband LPF | 4th-order Butterworth | 1.6 kHz, gain 0.9 | Spec 1.1 |
| Phase Shifter | two 1st-order all-pass sections (phase lag: DATEx user manual gives the output as COS(m(t) − F), 340° in two steps) | 5°…175° at the range centre (2.083 kHz LO / 100 kHz HI), +180° switch, auto range at 40 kHz, LO LED | DATEx manual (range, auto-detect); circuit topology assumed |
| Comparator | 5 V if IN > REF (Emona DxIQ-45G user manual: "The OUT signal is non-inverting in that a positive going input results in a +5V digital hi output") | output rise time 500 ns (10–90 %); hysteresis ±50 mV (Emona DxIQ-45G manual: "IN Hysteresis Voltage approx. +/-50mV"); REF must be connected | Spec 1.1 ("TTL output risetime 500 ns typ."); DATEx/TIMS manuals (REF must not float) |
| Rectifier | precision half-wave | bandwidth 100 kHz | Spec 1.1 |
| Diode & RC LPF | peak detector: Si diode charges C, R discharges (τ = RC) | τ from 2.6 kHz; charge/discharge ratio 1:30 (assumed) | Spec 1.1; topology from ET7 Exp.9 (Q2 → DIODE & RC LPF = 8 kHz sawtooth) |
| RC LPF | 1 pole | 2.6 kHz | Spec 1.1 |
| Tuneable LPF | 8th-order elliptic, 0.3 dB ripple, 60 dB stop-band (meets "< 0.5 dB, > 50 dB at 1.4 fc"; 60 dB reached at 1.13 fc) | fc 300 Hz–15 kHz, linear control; gain 0–2; fc×100 square output | Spec 1.1, user manual, lab manuals (see the disagreement table) |
| Variable DCV | | −2.5…+2.5 V (linear), +5 V, GND | Spec 1.1 |
| VCO | f = f0 + K0·G·Vin, **1 < G < 2** | LO 1–17 kHz, HI 60–140 kHz (linear FREQUENCY control; middle of HI = 100 kHz); input range ±3 V; K0 = 1.3 kHz/V LO, 13 kHz/V HI (**K0 bounded by the books**: FM demod needs K0·G = 2.5 kHz/V with G ≤ 2 → K0 ≥ 1.25; FSK Part A at half GAIN and a quarter FREQ keeps both tones above 0 Hz → K0 < 1.67; HI ×10 assumed) | Spec 1.1 ("GAIN G.Vin : 1 < G < 2", "−3 V < VCO INPUT < 3 V"); TIMS-301 manual (same); ET4 FM demod steps 14–17 |
| Twin Pulse | non-retriggerable, rising-edge | width 5–40 µs, delay 50–300 µs, clock < 8 kHz | Spec 1.1 |
| Dual Analog Switch & S/H | OUT = IN1·[C1] + IN2·[C2]; S/H samples on C1 rising edge | analog input bandwidth 50 kHz (one pole); CONTROL digital only | Spec 1.1 |
| Sequence Generator / Line Code | X 31-bit, Y 255-bit m-sequences (5- and 8-bit shift registers), SYNC at start of X; NRZ-L, Bi-φ, RZ-AMI, NRZ-M at **±2 V** (spec "+/-2Vp-p"; DATEx user manual: "bipolar, +2V and -2V, or tri-level, +2V, 0V and -2V") | clock 1 Hz–100 kHz | Spec 1.1; DATEx lab manual Vol.2 Exp.14 (shift register lengths) |
| PCM Encoder / Decoder | 8-bit offset binary, ±2 V, FS coincident with the LSB, 2-channel TDM, no anti-alias / reconstruction filters | | Spec 1.1 |
| Divider | ÷1, ÷2, ÷4, ÷8 by DIP | | Spec 1.1; ET7 Exp.7 (÷2 setting) |
| Serial to Parallel | bipolar ±2 V parallel outputs, **logic 1 → −2 V** (inferred: the only polarity that makes the book's delta and delta-sigma modulators negative-feedback loops, given the inverting ADDER and the non-inverting comparator confirmed by ASK Part C) | CLK ≤ 100 kHz | Spec 1.1; ET7 Exp.7, Vol.2 Exp.16/17 |
| Speech | PC microphone, 300 Hz–3 kHz | | Spec 1.1 |
| Saturation | every analog output clips at ±11 V | op-amps on ±12 V rails (DATEx: max output ±12 V) | |

## Still to confirm on the real kit
1. Multiplier k: 2kHz SINE → Y AC, 100kHz SINE → X AC, measure kXY. 8 Vp-p means k = 1 (current model), 4 Vp-p means k = 0.5.
2. VCO sensitivity on LO with GAIN fully anticlockwise and fully clockwise (kHz per volt) — gives K0 directly.
4. Tuneable LPF fc×100 output with the knob fully anticlockwise and fully clockwise — settles 300/600 Hz and 12/15 kHz.
3. VCO HI range low end: spec says 60 kHz, ET7 Exp.2 step 38 says ~50 kHz fully anticlockwise (model uses the spec).

## Verification (tools/verify_book.mjs, tools/verify_more.mjs) — all pass
- Exp 1: ADDER out 1.000 V DC + 1.000 Vp-p; envelope correlates 0.999 with CH1; P 5.92, Q 1.97, m = 0.500; G max → over-modulation.
- Exp 2: DSBSC 7.9 Vp-p; envelope = |message|; BUFFER ¼ → no overload, just past ½ → clipping.
- Exp 3: recovered message correlates 0.997 with the message, 53 µs delay.
- Exp 4: product detector output correlates 1.000 with the message; VCO HI middle = 100 kHz.
- Exp 5: flat envelope at 270°, single sinewave 97.917 kHz; recovered message correlates 1.000.
- Exp 6: 2 kHz DIGITAL shifts the VCO between two frequencies.
- Exp 7: GAIN trimmed gives 15.00 / 5.00 kHz at ±2 V; BASEBAND LPF DC 0.272 / 0.544 / 0.816 V; Part D output correlates 0.996 with the message.

## Second-semester checks (tools/verify_vol2.mjs) — all pass
- Sampling: natural sampling = message while 8 kHz is high; S&H steps at 8.33 kHz; TLPF reconstructs (corr 1.000).
- PCM encoder: 0 V → 10000000, MSB first, FS during bit 0; 00000001 from −1.992 V, 11111111 from +1.996 V (15.6 mV steps).
- ASK: 0 V at logic 0. BPSK: LINE CODE NRZ-L ±2 V, product detector corr 0.990.
- QPSK: X1/X2 ±2 V; Divider left-up/right-down = ÷2.
- PWM: TWIN PULSE Q2 → DIODE & RC LPF = 8 kHz sawtooth, 4.0 V peak, fast rise / slow decay.
- FSK (Exp.16): Part A tones 4.20 / 16.72 kHz; Part B (FREQ at 2 o'clock, fc fully clockwise) tones 12.18 / 24.74 kHz, the filter passes the logic-0 tone and leaves 2.5 % of the logic-1 tone (elliptic ringing after each edge) → ASK-like output, Figure 6.
- Comparator output rise time 625 ns at this sample rate (spec 500 ns).

## Engine
- Scope FFT uses integer decimation (a fractional step put spurs about 35 dB down across the span).
- All biquad filters use direct form I, so turning the TUNEABLE LPF knob changes the filter without a burst (DF-II state reached the rails when fc was swept down).
- Feedback loops (delta, delta-sigma, PLL) are evaluated in 8-sample sub-blocks (1.7 µs loop delay); a loop broken at the 256-sample block (53 µs) latched the delta modulator.

## Setup files (tools/make_setups.mjs, checked by tools/check_setups.mjs) — 70 files, all pass
Extra (Emona Vol.1 Exp 3 from the official SAMPLE manual; Vol.1 Exp 14, Vol.1 Exp 20, Vol.2 Exp 18 adapted from the DATEx Lab Manual Vol.1, VCO in place of the NI ELVIS function generator): 12 files. Term 1: Exp 1–7 (12 files). Term 2: Exp 11, 12, 13, 15, 16, 17, 18, 19 and Vol.2 Exp 6, 8, 9, 16, 17 (46 files), one per part, wired from the book's figures.
