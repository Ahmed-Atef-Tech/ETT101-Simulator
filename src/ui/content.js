// Teaching content in English and Arabic.
// YouTube links: fill HELP_LINKS (or help-links.json next to the program).

export const HELP_LINKS = {
  _channel: '',
  master: '', adder: '', mult1: '', mult2: '', mult3: '', buffer: '', noise: '', channel: '', adder2: '', phase: '', util: '', tlpf: '',
  vdc: '', speech: '', exor: '', vco: '', tpg: '', das: '', seq: '', div: '', pcmenc: '', pcmdec: '', s2p: '', expansion: '', scope: '',
  exp1: '', exp2: '', exp3: '', exp4: '', exp5: '', exp6: '', exp7: '', // lab sheet videos, by sheet id
};

// ------------------------------------------------------------------ modules
const M = (t, eq, en, ar) => ({ t, eq, en, ar });
export const MODULE_INFO = {
  master: M('MASTER SIGNALS', '100kHz SINE = 2·sin(2π·100k·t)\n100kHz COS  = 2·cos(2π·100k·t)\n2kHz SINE   = 2·sin(2π·2.083k·t)',
    { d: 'The fixed signal sources of the trainer. Every output is derived from the 100 kHz carrier, so all of them are locked together and the scope picture stays still.',
      spec: ['Carrier: 100 kHz sine and cosine (90° apart), 4 Vp-p, plus a 0–5 V digital version', 'Message: 2.083 kHz sine (4 Vp-p) and digital', 'Sample clock: 8.333 kHz digital'],
      use: ['2kHz SINE is the message in the AM, DSBSC and SSB experiments', '100kHz SINE is the carrier; 100kHz COS is needed for SSB'] },
    { d: 'مصدر الإشارات الثابتة في الجهاز. كل المخارج مشتقة من الحامل 100kHz، لذلك تكون متزامنة وتبقى الصورة على راسم الإشارة ثابتة.',
      spec: ['الحامل: 100kHz sine و cosine (بينهما 90°) بسعة 4Vp-p، ونسخة رقمية من 0 إلى 5V', 'الرسالة: 2.083kHz sine بسعة 4Vp-p ونسخة رقمية', 'ساعة أخذ العينات: 8.333kHz رقمية'],
      use: ['2kHz SINE هي الرسالة في تجارب AM و DSBSC و SSB', '100kHz SINE هو الحامل، و 100kHz COS مطلوب في SSB'] }),
  adder: M('ADDER', 'OUT = −(G·A + g·B)      0 < G, g < 2',
    { d: 'Adds two signals in proportions set by the G and g knobs. The output is inverted.', spec: ['G sets the gain of input A, g the gain of input B (0 to 2)', 'Inputs and output are DC coupled', 'Output is inverted (180°)'],
      use: ['AM: A = message, B = a negative VDC, so the output is +DC + (inverted) message', 'SSB: adds the two DSBSC signals', 'Use one input alone to make an amplifier'] },
    { d: 'يجمع إشارتين بنسب يحددها المقبضان G و g. الخرج مقلوب.', spec: ['G يحدد كسب المدخل A، و g يحدد كسب المدخل B (من 0 إلى 2)', 'المداخل والخرج باقتران DC', 'الخرج مقلوب (180°)'],
      use: ['في AM: المدخل A هو الرسالة و B جهد VDC سالب، فيكون الخرج DC موجباً مع الرسالة (مقلوبة)', 'في SSB: يجمع إشارتَي DSBSC', 'عند استخدام مدخل واحد فقط يعمل كمكبّر'] }),
  adder2: M('ADDER (channel module)', 'CHANNEL OUT = NOISE + SIGNAL',
    { d: 'Fixed unity-gain adder, used to add noise to a signal before it enters the channel.', spec: ['Gain fixed at 1 for both inputs'], use: ['Signal on SIGNAL, noise on NOISE'] },
    { d: 'جامع بكسب ثابت يساوي 1، يُستخدم لإضافة الضوضاء إلى الإشارة قبل دخولها القناة.', spec: ['الكسب ثابت ويساوي 1 للمدخلين'], use: ['الإشارة على SIGNAL والضوضاء على NOISE'] }),
  mult1: M('MULTIPLIER', 'kXY = k · X · Y      (k ≈ 1)',
    { d: 'Multiplies two signals in real time. This is the heart of every modulator and product detector.', spec: ['DC and AC inputs: the AC inputs remove any DC before multiplying', 'k ≈ 1 (ETT-101 spec): two 4 Vp-p inputs give about 8 Vp-p'],
      use: ['DSBSC = message × carrier', 'AM = (DC + message) × carrier', 'Product detector = received signal × local carrier'] },
    { d: 'يضرب إشارتين لحظياً. وهو أساس كل مُعدِّل (modulator) وكل كاشف ضرب (product detector).', spec: ['مداخل DC و AC: مداخل AC تزيل أي مركبة DC قبل الضرب', 'k ≈ 1 (مواصفات ETT-101): مدخلان بسعة 4Vp-p يعطيان حوالي 8Vp-p'],
      use: ['DSBSC = رسالة × حامل', 'AM = (DC + رسالة) × حامل', 'كاشف الضرب = الإشارة المستقبَلة × حامل محلي'] }),
  mult2: M('MULTIPLIER (2)', 'kXY = k · X · Y      (k ≈ 1)', { d: 'Second multiplier, DC inputs only.', spec: ['DC coupled inputs'], use: ['Product detector, or the second modulator in SSB'] },
    { d: 'مضاعِف ثانٍ بمداخل DC فقط.', spec: ['مداخل باقتران DC'], use: ['كاشف ضرب، أو المُعدِّل الثاني في SSB'] }),
  mult3: M('MULTIPLIER (3)', 'kXY = k · X · Y      (k ≈ 1)', { d: 'Third multiplier (bottom row), DC inputs only.', spec: ['DC coupled inputs'], use: ['Product detector for SSB reception'] },
    { d: 'مضاعِف ثالث في الصف السفلي بمداخل DC فقط.', spec: ['مداخل باقتران DC'], use: ['كاشف ضرب في استقبال SSB'] }),
  buffer: M('BUFFER', 'OUT = −Gain · IN      (Gain 0 → 10, inverting)',
    { d: 'Variable-gain amplifier. It is the only module that can drive headphones.', spec: ['Gain 0 to 10 with the GAIN knob', '3.5 mm headphone socket'], use: ['Turn GAIN fully anticlockwise before putting the headphones on', 'Click the headphone socket to plug or unplug the headphones'] },
    { d: 'مكبّر بكسب متغيّر، وهو الوحدة الوحيدة التي يمكن توصيل السماعة بها.', spec: ['الكسب من 0 إلى 10 بالمقبض GAIN', 'مقبس سماعة 3.5mm'], use: ['أدِر GAIN عكس اتجاه عقارب الساعة حتى النهاية قبل وضع السماعة', 'انقر على مقبس السماعة لتوصيلها أو فصلها'] }),
  noise: M('NOISE GENERATOR', '0dB ≈ 4.8 Vrms    −6dB ≈ 2.4 Vrms    −20dB ≈ 0.48 Vrms',
    { d: 'White noise source with three output levels.', spec: ['Bandwidth 10 Hz to 240 kHz'], use: ['Connect to NOISE on the channel ADDER to model a noisy channel'] },
    { d: 'مولّد ضوضاء بيضاء بثلاثة مستويات.', spec: ['عرض النطاق من 10Hz إلى 240kHz'], use: ['صِله بمدخل NOISE في ADDER الخاص بالقناة لتمثيل قناة بها ضوضاء'] }),
  channel: M('CHANNEL MODULE', 'CHANNEL BPF: 88–112 kHz, 6th-order Chebyshev\nBASEBAND LPF: fc = 1.6 kHz, 4th-order Butterworth, gain 0.9',
    { d: 'Two filters that model the channel: a band-pass for 100 kHz modulated signals and a low-pass for baseband signals.', spec: ['BPF centred on 100 kHz', 'Baseband LPF extracts the message in zero-crossing FM demodulation'], use: ['FM demod: TWIN PULSE Q1 → BASEBAND LPF'] },
    { d: 'مرشِّحان يمثّلان القناة: BPF للإشارات المعدَّلة على 100kHz و LPF لإشارات النطاق الأساسي.', spec: ['مركز BPF عند 100kHz', 'BASEBAND LPF يستخرج الرسالة في فك تعديل FM بطريقة ZCD'], use: ['في فك تعديل FM: يدخل خرج Q1 إلى BASEBAND LPF'] }),
  phase: M('PHASE SHIFTER', 'IN = cos(ωt)  →  OUT = cos(ωt − Φ)',
    { d: 'Delays the phase of a signal by an amount set with the PHASE knob; the 0°/180° switch adds another 180°.', spec: ['Works around 2 kHz (LO) or 100 kHz (HI), range chosen automatically', 'LO lamp lights for low-frequency signals', 'The shift depends on frequency (not wideband)'], use: ['SSB: shifts the message by 90°'] },
    { d: 'يؤخّر طور الإشارة بمقدار يحدده المقبض PHASE، ويضيف مفتاح 0°/180° زاوية 180° أخرى.', spec: ['يعمل حول 2kHz (LO) أو 100kHz (HI)، ويُختار المدى تلقائياً', 'يضيء مصباح LO مع الإشارات منخفضة التردد', 'مقدار الإزاحة يتغيّر مع التردد'], use: ['في SSB: يزيح طور الرسالة بمقدار 90°'] }),
  util: M('UTILITIES', 'COMPARATOR: OUT = 5 V if IN > REF, else 0 V\nRECTIFIER: OUT = max(IN, 0)\nDIODE & RC LPF: peak detector, decay τ = RC (fc ≈ 2.6 kHz)\nRC LPF: fc ≈ 2.6 kHz, single pole',
    { d: 'Four independent circuits: comparator, rectifier, diode & RC LPF, and RC LPF.', spec: ['The comparator REF input must always be connected (for example to GND)', 'Precision half-wave rectifier'], use: ['Envelope detector = RECTIFIER then RC LPF', 'The comparator squares the FM signal before the zero-crossing detector'] },
    { d: 'أربع دوائر مستقلة: Comparator و Rectifier و Diode & RC LPF و RC LPF.', spec: ['يجب توصيل مدخل REF في المقارن دائماً (مثلاً بـ GND)', 'مقوّم نصف موجة دقيق'], use: ['كاشف الغلاف = RECTIFIER يليه RC LPF', 'يحوّل المقارن إشارة FM إلى موجة مربعة قبل ZCD'] }),
  tlpf: M('TUNEABLE LPF', 'fc: 300 Hz → about 15 kHz      Gain: 0 → 2',
    { d: 'Sharp low-pass filter (8th-order elliptic) with an adjustable cut-off frequency.', spec: ['fc×100 output: square wave at 100 × fc (measure it and divide by 100)', 'Stop-band below −50 dB at 1.4 × fc'], use: ['Product detector: after the multiplier, removes the 200 kHz terms', 'Cleans up the FM demodulator output'] },
    { d: 'مرشِّح تمرير منخفض حادّ (Elliptic من الرتبة 8) بتردد قطع متغيّر.', spec: ['مخرج fc×100 موجة مربعة ترددها 100 ضعف fc (قِسه واقسم على 100)', 'نطاق الإيقاف أقل من −50dB عند 1.4·fc'], use: ['في كاشف الضرب: يأتي بعد المضاعِف ويزيل مركبات 200kHz', 'يُنقّي خرج فاكّ تعديل FM'] }),
  vdc: M('VARIABLE DCV', 'VDC: −2.5 V → +2.5 V',
    { d: 'Adjustable DC voltage, with a fixed +5 V and a ground point.', spec: ['+5 V (digital socket)', 'GND'], use: ['AM: provides the DC added to the message', 'Measuring the VCO sensitivity'] },
    { d: 'مصدر جهد DC متغيّر، ومعه جهد ثابت +5V ونقطة GND.', spec: ['+5V (مقبس رقمي)', 'GND'], use: ['في AM: يعطي مستوى DC الذي يُضاف إلى الرسالة', 'لقياس حساسية VCO'] }),
  speech: M('SPEECH', '', { d: 'Microphone: turns your voice into an electrical signal (300 Hz – 3 kHz). The simulator uses the computer microphone.', spec: ['The first time, the program asks for microphone permission'], use: ['Replaces 2kHz SINE as the message in any experiment'] },
    { d: 'ميكروفون: يحوّل صوتك إلى إشارة كهربائية (300Hz – 3kHz). يستخدم البرنامج ميكروفون الحاسوب.', spec: ['في المرة الأولى يطلب البرنامج إذن استخدام الميكروفون'], use: ['يمكن استخدامه بدلاً من 2kHz SINE رسالةً في أي تجربة'] }),
  exor: M('EXOR', 'OUT = A ⊕ B', { d: 'Digital exclusive-OR gate.', spec: ['Digital inputs (0/5 V)'], use: [] }, { d: 'بوابة Exclusive-OR رقمية.', spec: ['مداخل رقمية (0/5V)'], use: [] }),
  vco: M('VCO', 'f = f0 + K0 · G · Vin      (1 < G < 2)',
    { d: 'Oscillator whose frequency follows its input voltage, which makes it the FM modulator.', spec: ['LO: 1–17 kHz, HI: 60–140 kHz', 'FREQ sets f0 (frequency with 0 V input)', 'GAIN sets G from 1 to 2 (it never reaches zero deviation)', 'VCO INPUT range: −3 V to +3 V', 'SINE (4 Vp-p) and DIGITAL outputs'], use: ['FM: message on VCO INPUT', 'In HI mode, a non-synchronised local carrier for DSBSC demodulation'] },
    { d: 'مذبذب يتغيّر تردده مع جهد الدخل، ولذلك يُستخدم مُعدِّلاً لـ FM.', spec: ['LO: من 1 إلى 17kHz، و HI: من 60 إلى 140kHz', 'FREQ يحدد f0 (التردد عندما يكون الدخل 0V)', 'GAIN يحدد G من 1 إلى 2 (لا يصل الانحراف إلى الصفر أبداً)', 'مدى VCO INPUT: من −3V إلى +3V', 'مخرجا SINE (4Vp-p) و DIGITAL'], use: ['في FM: تدخل الرسالة على VCO INPUT', 'في وضع HI يكون حاملاً محلياً غير متزامن في فك تعديل DSBSC'] }),
  tpg: M('TWIN PULSE GENERATOR', 'Width: 5–40 µs      Delay Q1→Q2: 50–300 µs',
    { d: 'Every rising edge on CLK produces pulse Q1, followed after the delay by pulse Q2.', spec: ['CLK is a digital input', 'WIDTH sets the width of both pulses'], use: ['FM demod: works as the zero-crossing detector, pulses per second = signal frequency'] },
    { d: 'مع كل حافة صاعدة على CLK تخرج النبضة Q1، ثم تخرج النبضة Q2 بعد زمن التأخير.', spec: ['CLK مدخل رقمي', 'WIDTH يحدد عرض النبضتين'], use: ['في فك تعديل FM يعمل ككاشف عبور الصفر (ZCD): عدد النبضات في الثانية يساوي تردد الإشارة'] }),
  das: M('DUAL ANALOG SWITCH', 'OUT = IN1·[C1] + IN2·[C2]', { d: 'Two analog switches controlled by digital signals, plus a sample-and-hold.', spec: ['S&H holds S&H IN at each rising edge of CONTROL 1'], use: ['Sampling experiment (Term 2)'] },
    { d: 'مفتاحان تماثليان تتحكم فيهما إشارات رقمية، ومعهما دائرة Sample & Hold.', spec: ['تحفظ دائرة S&H قيمة S&H IN عند كل حافة صاعدة لـ CONTROL 1'], use: ['يُستخدم في تجربة أخذ العينات (الترم الثاني)'] }),
  seq: M('SEQUENCE GENERATOR', '', { d: 'Pseudo-random digital data (X: 31 bits, Y: 255 bits) and a line-coded output.', spec: ['00 NRZ-L, 01 Bi-Ø, 10 RZ-AMI, 11 NRZ-M', 'LINE CODE output ±2 V'], use: ['ASK, FSK, BPSK, QPSK, DSSS and SNR experiments (Term 2)'] },
    { d: 'يُخرج بيانات رقمية شبه عشوائية (X: 31 بت و Y: 255 بت) ومخرج ترميز الخط (Line code).', spec: ['00 NRZ-L و 01 Bi-Ø و 10 RZ-AMI و 11 NRZ-M', 'مخرج LINE CODE بسعة ±2V'], use: ['تجارب ASK و FSK و BPSK و QPSK و DSSS و SNR (الترم الثاني)'] }),
  div: M('DIVIDER', '', { d: 'Divides the frequency of a digital signal by 1, 2, 4 or 8.', spec: [], use: [] }, { d: 'يقسم تردد إشارة رقمية على 1 أو 2 أو 4 أو 8.', spec: [], use: [] }),
  pcmenc: M('PCM ENCODER', '', { d: '8-bit analog-to-digital converter (offset binary) with a frame-sync output.', spec: ['Input range ±2 V', 'TDM: two channels in turn'], use: ['PCM encoding and decoding experiments (Term 2)'] },
    { d: 'محوّل من تماثلي إلى رقمي بدقة 8 بت (offset binary)، ومعه مخرج FS لبداية كل إطار.', spec: ['مدى الدخل ±2V', 'TDM: قناتان بالتناوب'], use: ['تجربتا تشفير PCM وفك تشفيره (الترم الثاني)'] }),
  pcmdec: M('PCM DECODER', '', { d: '8-bit digital-to-analog converter.', spec: ['TDM lamp lights when two channels are received'], use: [] }, { d: 'محوّل من رقمي إلى تماثلي بدقة 8 بت.', spec: ['يضيء مصباح TDM عند استقبال قناتين'], use: [] }),
  s2p: M('SERIAL TO PARALLEL', '', { d: 'Sends alternate bits to outputs X1 and X2 (±2 V).', spec: ['Bipolar outputs: logic 1 → −2 V, logic 0 → +2 V'], use: ['QPSK: X1 and X2 are the I and Q data', 'Delta and delta-sigma modulators: works as the Sampler'] }, { d: 'يوزّع البتات بالتناوب على المخرجين X1 و X2 (±2V).', spec: ['مخارج ثنائية القطبية: المنطق 1 يعطي −2V، والمنطق 0 يعطي +2V'], use: ['في QPSK: المخرجان X1 و X2 هما بيانات I و Q', 'في Delta و Delta-Sigma: يعمل كأداة لأخذ العينات (Sampler)'] }),
  expansion: M('EXPANSION', '', { d: 'Slot for add-on boards; not used in these experiments.', spec: [], use: [] }, { d: 'مكان لتركيب لوحات إضافية، ولا يُستخدم في هذه التجارب.', spec: [], use: [] }),
};

// ------------------------------------------------------------------ about / disclaimer
export const NOTICE = {
  en: `<p class="lead"><b>This is a preliminary (beta) version</b> and is still being tested.</p><ul>
<li><b>Not an exact copy of the kit.</b> The simulator models the Emona ETT-101 and the oscilloscope from their published specifications and the lab books. Readings may not match the real kit 100%. When they differ, the real kit is the reference.</li>
<li><b>For students, free and non-commercial.</b> It was made to help students practise and prepare for the communications labs. It must not be sold, rented, put behind a paywall, bundled with paid courses or used to make money in any way.</li>
<li><b>Not affiliated with Emona Instruments or UNI-T.</b> Kit and instrument names are used only to say what is being simulated.</li>
<li>Found something that does not match the kit? Use <b>Report a bug</b> so it can be fixed.</li></ul>`,
  ar: `<p class="lead"><b>هذه نسخة أولية (تجريبية)</b> وما زالت قيد الاختبار.</p><ul>
<li><b>ليست نسخة مطابقة تماماً للجهاز.</b> البرنامج محاكاة لجهاز Emona ETT-101 ولراسم الإشارة، مبنية على المواصفات المنشورة وكتب المعمل، لذلك قد لا تطابق القراءات الجهاز الحقيقي بنسبة 100%. وعند وجود اختلاف، يكون الجهاز الحقيقي هو المرجع.</li>
<li><b>للطلاب، مجاني وغير ربحي.</b> صُمّم البرنامج لمساعدة الطلاب على التدرّب والاستعداد لمعمل الاتصالات. ولا يجوز بيعه أو تأجيره أو وضعه ضمن دورة مدفوعة أو التربح منه بأي شكل من الأشكال.</li>
<li><b>غير تابع لشركة Emona Instruments أو UNI-T.</b> تُستخدم أسماء الجهاز والأدوات فقط لتوضيح ما يحاكيه البرنامج.</li>
<li>إذا وجدت شيئاً لا يطابق الجهاز، استخدم زر <b>الإبلاغ عن مشكلة</b> ليتم إصلاحه.</li></ul>`,
};

// ------------------------------------------------------------------ help pages
export const HELP = {
  en: {
    app: `<h3>Using the simulator</h3><ul>
<li><b>Patch a lead:</b> drag from one socket to another. Several leads can share a socket, just like the stackable leads.</li>
<li><b>Remove a lead:</b> double-click it. Right-click a lead to change its colour.</li>
<li><b>Knobs:</b> drag around the knob, sideways or up and down, or use the mouse wheel. Hold Shift for fine steps.</li>
<li><b>View:</b> Kit, Both and Scope fit that part to the screen. Ctrl + wheel zooms at the cursor; drag the empty bench to move around. Keys 1, 2, 3 switch views.</li>
<li><b>Headphones:</b> click the headphone socket on the BUFFER. Sound comes out of the computer speakers.</li>
<li><b>Guidance</b> (switch at the top) shows the <b>i</b> button on every module, socket names with a live reading, and knob values. Turn it off to practise like the real exam.</li></ul>`,
    scope: `<h3>The oscilloscope (UTD2102CEL style)</h3><ul>
<li><b>Connect:</b> drag from a BNC socket (CH1, CH2, EXT TRIG) to any socket on the kit. Double-click the lead to remove it.</li>
<li><b>CH1 / CH2:</b> the first press selects the channel and opens its menu; the shared VERTICAL knobs then control it. Press again while its menu is open to turn the channel off.</li>
<li><b>VERTICAL:</b> SCALE is volts/div and POSITION moves the trace. Click a knob without turning it to reset its position.</li>
<li><b>HORIZONTAL:</b> SCALE is time/div (12 × 8 divisions on screen); POSITION moves the trace sideways. MENU holds Zoom and XY.</li>
<li><b>TRIGGER:</b> LEVEL sets the trigger level (click it for 50 %). MENU sets source, slope, Auto/Normal/Single and coupling.</li>
<li><b>RUN/STOP:</b> freezes the capture. While stopped you can still change time/div and position to look through the captured signal.</li>
<li><b>MEASURE</b> gives automatic readings, <b>CURSOR</b> gives time or voltage cursors moved with MULTI PURPOSE, <b>MATH</b> gives A+B, A−B, A×B or FFT, <b>AUTO</b> sets everything up, <b>PrtSc</b> saves a picture of the screen.</li></ul>
<p>The lab manual is written for an analog scope: “Mode DUAL” means CH1 and CH2 both on, “Timebase” is HORIZONTAL SCALE, “Vertical attenuation” is VERTICAL SCALE and “Sweep magnification” is HORIZONTAL MENU → Zoom.</p>`,
  },
  ar: {
    app: `<h3>طريقة الاستخدام</h3><ul>
<li><b>توصيل سلك:</b> اسحب من مقبس إلى مقبس آخر. يمكن توصيل أكثر من سلك بالمقبس نفسه، كما في الأسلاك الحقيقية.</li>
<li><b>إزالة سلك:</b> انقر عليه مرتين. وانقر بالزر الأيمن لتغيير لونه.</li>
<li><b>المقابض:</b> أدِر حول المقبض، أو اسحب يميناً ويساراً أو لأعلى ولأسفل، أو استخدم عجلة الفأرة. اضغط Shift للحركة الدقيقة.</li>
<li><b>العرض:</b> الأزرار Kit و Both و Scope تُكبّر الجزء المطلوب على الشاشة. Ctrl مع عجلة الفأرة للتكبير عند المؤشر، واسحب في المساحة الفارغة للتحرّك. المفاتيح 1 و 2 و 3 تبدّل طريقة العرض.</li>
<li><b>السماعة:</b> انقر على مقبس السماعة في BUFFER، ويخرج الصوت من سماعات الحاسوب.</li>
<li><b>الإرشادات</b> (المفتاح في الأعلى) تُظهر زر <b>i</b> على كل وحدة، وأسماء المقابس مع قراءاتها اللحظية، وقيم المقابض. أوقفها لتتدرّب كما في الامتحان.</li></ul>`,
    scope: `<h3>راسم الإشارة (على نمط UTD2102CEL)</h3><ul>
<li><b>التوصيل:</b> اسحب من مقبس BNC (CH1 أو CH2 أو EXT TRIG) إلى أي مقبس على الجهاز. انقر على السلك مرتين لإزالته.</li>
<li><b>CH1 / CH2:</b> الضغطة الأولى تختار القناة وتفتح قائمتها، ثم تتحكم فيها مقابض VERTICAL المشتركة. وإذا كانت قائمتها مفتوحة، فالضغطة توقف القناة.</li>
<li><b>VERTICAL:</b> المقبض SCALE يحدد الفولت لكل مربع (Volts/div)، و POSITION يحرّك الإشارة. النقر على المقبض دون تدويره يعيد الموضع إلى الصفر.</li>
<li><b>HORIZONTAL:</b> المقبض SCALE يحدد الزمن لكل مربع (Time/div)، والشاشة 12 × 8 مربعات. و POSITION يحرّك الإشارة أفقياً. وفي MENU يوجد Zoom و XY.</li>
<li><b>TRIGGER:</b> المقبض LEVEL يحدد مستوى الزناد (النقر عليه يضبطه على 50%). وفي MENU تختار المصدر والميل (Slope) والوضع Auto/Normal/Single والاقتران.</li>
<li><b>RUN/STOP:</b> يوقف الالتقاط. وأثناء الإيقاف يمكنك تغيير Time/div والموضع لفحص الإشارة الملتقطة.</li>
<li><b>MEASURE</b> قياسات تلقائية، و<b>CURSOR</b> مؤشرات للزمن أو الجهد تُحرَّك بالمقبض MULTI PURPOSE، و<b>MATH</b> فيه A+B و A−B و A×B و FFT، و<b>AUTO</b> ضبط تلقائي، و<b>PrtSc</b> يحفظ صورة الشاشة.</li></ul>
<p>كُتب دليل المعمل لراسم إشارة تماثلي: «Mode DUAL» يعني تشغيل CH1 و CH2 معاً، و«Timebase» هو HORIZONTAL SCALE، و«Vertical attenuation» هو VERTICAL SCALE، و«Sweep magnification» هو HORIZONTAL MENU ثم Zoom.</p>`,
  },
};
