// Teaching content in English and Arabic.
// YouTube links: fill HELP_LINKS (or help-links.json next to the program).

export const HELP_LINKS = {
  _channel: '',
  master: '', adder: '', mult1: '', mult2: '', mult3: '', buffer: '', noise: '', channel: '', adder2: '', phase: '', util: '', tlpf: '',
  vdc: '', speech: '', exor: '', vco: '', tpg: '', das: '', seq: '', div: '', pcmenc: '', pcmdec: '', s2p: '', expansion: '', scope: '',
  exp1: '', exp2: '', exp3: '', exp4: '', exp5: '', exp6: '', exp7: '',
};

// ------------------------------------------------------------------ modules
const M = (t, eq, en, ar) => ({ t, eq, en, ar });
export const MODULE_INFO = {
  master: M('MASTER SIGNALS', '100kHz SINE = 2·sin(2π·100k·t)\n100kHz COS  = 2·cos(2π·100k·t)\n2kHz SINE   = 2·sin(2π·2.083k·t)',
    { d: 'The fixed signal sources of the trainer. Every output is derived from the 100 kHz carrier, so all of them are locked together and the scope picture stays still.',
      spec: ['Carrier: 100 kHz sine and cosine (90° apart), 4 Vp-p, plus a 0–5 V digital version', 'Message: 2.083 kHz sine (4 Vp-p) and digital', 'Sample clock: 8.333 kHz digital'],
      use: ['2kHz SINE is the message in the AM, DSBSC and SSB experiments', '100kHz SINE is the carrier; 100kHz COS is needed for SSB'] },
    { d: 'مصدر الإشارات الأساسية في الكيت. كل المخارج مشتقة من الحامل 100kHz، فكلها متزامنة والرسم على الأوسيلوسكوب ثابت.',
      spec: ['الحامل: 100kHz sine و cosine (فرق 90°) بسعة 4Vp-p، ونسخة digital من 0 لـ 5V', 'الرسالة: 2.083kHz sine بسعة 4Vp-p و digital', 'Sample clock: 8.333kHz digital'],
      use: ['الـ 2kHz SINE هي الرسالة في تجارب AM و DSBSC و SSB', 'الـ 100kHz SINE هو الحامل، والـ COS مطلوب في SSB'] }),
  adder: M('ADDER', 'OUT = −(G·A + g·B)      0 < G, g < 2',
    { d: 'Adds two signals in proportions set by the G and g knobs. The output is inverted.', spec: ['G sets the gain of input A, g the gain of input B (0 to 2)', 'Inputs and output are DC coupled', 'Output is inverted (180°)'],
      use: ['AM: A = message, B = a negative VDC, so the output is +DC + (inverted) message', 'SSB: adds the two DSBSC signals', 'Use one input alone to make an amplifier'] },
    { d: 'بيجمع إشارتين بنسب بيحددها المقبضين G و g. المخرج مقلوب.', spec: ['G بيحدد كسب المدخل A و g كسب المدخل B (من 0 لـ 2)', 'المدخلات والمخرج DC coupled', 'المخرج مقلوب (180°)'],
      use: ['في AM: A = الرسالة و B = VDC سالب، فالمخرج = DC موجب + رسالة (مقلوبة)', 'في SSB: بيجمع إشارتي DSBSC', 'لو استخدمت مدخل واحد يبقى مكبر'] }),
  adder2: M('ADDER (channel module)', 'CHANNEL OUT = NOISE + SIGNAL',
    { d: 'Fixed unity-gain adder, used to add noise to a signal before it enters the channel.', spec: ['Gain fixed at 1 for both inputs'], use: ['Signal on SIGNAL, noise on NOISE'] },
    { d: 'جامع بكسب ثابت = 1، بيستخدم لإضافة الضوضاء على الإشارة قبل ما تدخل القناة.', spec: ['الكسب ثابت = 1 للمدخلين'], use: ['الإشارة على SIGNAL والضوضاء على NOISE'] }),
  mult1: M('MULTIPLIER', 'kXY = k · X · Y      (k ≈ 1)',
    { d: 'Multiplies two signals in real time. This is the heart of every modulator and product detector.', spec: ['DC and AC inputs: the AC inputs remove any DC before multiplying', 'k ≈ 1 (ETT-101 spec): two 4 Vp-p inputs give about 8 Vp-p'],
      use: ['DSBSC = message × carrier', 'AM = (DC + message) × carrier', 'Product detector = received signal × local carrier'] },
    { d: 'بيضرب إشارتين في بعض لحظياً. ده قلب أي modulator أو product detector.', spec: ['مدخلات DC و AC: الـ AC بيشيل أي DC قبل الضرب', 'k ≈ 1 (مواصفات ETT-101): مدخلين 4Vp-p بيدّوا حوالي 8Vp-p'],
      use: ['DSBSC = رسالة × حامل', 'AM = (DC + رسالة) × حامل', 'Product detector = الإشارة المستقبلة × حامل محلي'] }),
  mult2: M('MULTIPLIER (2)', 'kXY = k · X · Y      (k ≈ 1)', { d: 'Second multiplier, DC inputs only.', spec: ['DC coupled inputs'], use: ['Product detector, or the second modulator in SSB'] },
    { d: 'مضاعف تاني بمدخلات DC بس.', spec: ['مدخلات DC coupled'], use: ['Product detector أو الـ modulator التاني في SSB'] }),
  mult3: M('MULTIPLIER (3)', 'kXY = k · X · Y      (k ≈ 1)', { d: 'Third multiplier (bottom row), DC inputs only.', spec: ['DC coupled inputs'], use: ['Product detector for SSB reception'] },
    { d: 'مضاعف تالت في الصف التحتاني بمدخلات DC بس.', spec: ['مدخلات DC coupled'], use: ['Product detector في استقبال SSB'] }),
  buffer: M('BUFFER', 'OUT = −Gain · IN      (Gain 0 → 10, inverting)',
    { d: 'Variable-gain amplifier. It is the only module that can drive headphones.', spec: ['Gain 0 to 10 with the GAIN knob', '3.5 mm headphone socket'], use: ['Turn GAIN fully anticlockwise before putting the headphones on', 'Click the headphone socket to plug or unplug the headphones'] },
    { d: 'مكبر بكسب متغير، وهو الوحيد اللي ينفع تركّب عليه السماعة.', spec: ['الكسب من 0 لـ 10 بالمقبض GAIN', 'مخرج سماعة 3.5mm'], use: ['لف GAIN للآخر عكس عقارب الساعة قبل ما تلبس السماعة', 'دوس على فتحة السماعة علشان تركّبها أو تفكها'] }),
  noise: M('NOISE GENERATOR', '0dB ≈ 4.8 Vrms    −6dB ≈ 2.4 Vrms    −20dB ≈ 0.48 Vrms',
    { d: 'White noise source with three output levels.', spec: ['Bandwidth 10 Hz to 240 kHz'], use: ['Connect to NOISE on the channel ADDER to model a noisy channel'] },
    { d: 'مولد ضوضاء بيضاء بتلات مستويات.', spec: ['النطاق من 10Hz لـ 240kHz'], use: ['وصّله على NOISE في ADDER القناة علشان تحاكي قناة فيها ضوضاء'] }),
  channel: M('CHANNEL MODULE', 'CHANNEL BPF: 88–112 kHz, 6th-order Chebyshev\nBASEBAND LPF: fc = 1.6 kHz, 4th-order Butterworth, gain 0.9',
    { d: 'Two filters that model the channel: a band-pass for 100 kHz modulated signals and a low-pass for baseband signals.', spec: ['BPF centred on 100 kHz', 'Baseband LPF extracts the message in zero-crossing FM demodulation'], use: ['FM demod: TWIN PULSE Q1 → BASEBAND LPF'] },
    { d: 'فلترين بيمثلوا القناة: BPF للإشارات المعدّلة على 100kHz و LPF للإشارات اللي مش معدّلة.', spec: ['الـ BPF مركزه 100kHz', 'الـ Baseband LPF بيطلّع الرسالة في FM demodulation بطريقة ZCD'], use: ['في FM demod: مخرج Q1 → BASEBAND LPF'] }),
  phase: M('PHASE SHIFTER', 'IN = cos(ωt)  →  OUT = cos(ωt − Φ)',
    { d: 'Delays the phase of a signal by an amount set with the PHASE knob; the 0°/180° switch adds another 180°.', spec: ['Works around 2 kHz (LO) or 100 kHz (HI), range chosen automatically', 'LO lamp lights for low-frequency signals', 'The shift depends on frequency (not wideband)'], use: ['SSB: shifts the message by 90°'] },
    { d: 'بيأخّر طور الإشارة بمقدار بيحدده المقبض PHASE، ومفتاح 0°/180° بيزود 180° كمان.', spec: ['بيشتغل حوالين 2kHz (LO) أو 100kHz (HI) والمدى بيتحدد أوتوماتيك', 'لمبة LO بتنور مع الإشارات منخفضة التردد', 'مقدار الإزاحة بيتغير مع التردد'], use: ['في SSB: بنزيح الرسالة 90°'] }),
  util: M('UTILITIES', 'COMPARATOR: OUT = 5 V if IN > REF, else 0 V\nRECTIFIER: OUT = max(IN, 0)\nDIODE & RC LPF: peak detector, decay τ = RC (fc ≈ 2.6 kHz)\nRC LPF: fc ≈ 2.6 kHz, single pole',
    { d: 'Four independent circuits: comparator, rectifier, diode & RC LPF, and RC LPF.', spec: ['The comparator REF input must always be connected (for example to GND)', 'Precision half-wave rectifier'], use: ['Envelope detector = RECTIFIER then RC LPF', 'The comparator squares the FM signal before the zero-crossing detector'] },
    { d: 'أربع دواير مستقلة: Comparator و Rectifier و Diode & RC LPF و RC LPF.', spec: ['مدخل REF للـ comparator لازم يتوصل دايماً (مثلاً بالـ GND)', 'Rectifier نص موجة دقيق'], use: ['Envelope detector = RECTIFIER وبعده RC LPF', 'الـ comparator بيحوّل إشارة FM لـ square قبل الـ ZCD'] }),
  tlpf: M('TUNEABLE LPF', 'fc: 300 Hz → about 15 kHz      Gain: 0 → 2',
    { d: 'Sharp low-pass filter (8th-order elliptic) with an adjustable cut-off frequency.', spec: ['fc×100 output: square wave at 100 × fc (measure it and divide by 100)', 'Stop-band below −50 dB at 1.4 × fc'], use: ['Product detector: after the multiplier, removes the 200 kHz terms', 'Cleans up the FM demodulator output'] },
    { d: 'فلتر Low-pass حاد (Elliptic رتبة 8) وتردد القطع بتاعه متغير.', spec: ['مخرج fc×100 = square تردده 100 ضعف fc (قيسه واقسم على 100)', 'الـ stop-band أقل من −50dB عند 1.4·fc'], use: ['Product detector: بعد المضاعف بيشيل مركبات 200kHz', 'بينضّف مخرج الـ FM demodulator'] }),
  vdc: M('VARIABLE DCV', 'VDC: −2.5 V → +2.5 V',
    { d: 'Adjustable DC voltage, with a fixed +5 V and a ground point.', spec: ['+5 V (digital socket)', 'GND'], use: ['AM: provides the DC added to the message', 'Measuring the VCO sensitivity'] },
    { d: 'مصدر جهد DC متغير، ومعاه +5V ثابت ونقطة GND.', spec: ['+5V (مقبس digital)', 'GND'], use: ['في AM: بيدّي الـ DC اللي بيتجمع على الرسالة', 'لقياس حساسية الـ VCO'] }),
  speech: M('SPEECH', '', { d: 'Microphone: turns your voice into an electrical signal (300 Hz – 3 kHz). The simulator uses the computer microphone.', spec: ['The first time, the program asks for microphone permission'], use: ['Replaces 2kHz SINE as the message in any experiment'] },
    { d: 'ميكروفون: بيحوّل صوتك لإشارة كهربية (300Hz – 3kHz). البرنامج بيستخدم مايك الجهاز.', spec: ['أول مرة البرنامج هيطلب إذن المايك'], use: ['تقدر تستخدمه بدل 2kHz SINE كرسالة في أي تجربة'] }),
  exor: M('EXOR', 'OUT = A ⊕ B', { d: 'Digital exclusive-OR gate.', spec: ['Digital inputs (0/5 V)'], use: [] }, { d: 'بوابة Exclusive-OR رقمية.', spec: ['مدخلات digital (0/5V)'], use: [] }),
  vco: M('VCO', 'f = f0 + K0 · G · Vin      (1 < G < 2)',
    { d: 'Oscillator whose frequency follows its input voltage, which makes it the FM modulator.', spec: ['LO: 1–17 kHz, HI: 60–140 kHz', 'FREQ sets f0 (frequency with 0 V input)', 'GAIN sets G from 1 to 2 (it never reaches zero deviation)', 'VCO INPUT range: −3 V to +3 V', 'SINE (4 Vp-p) and DIGITAL outputs'], use: ['FM: message on VCO INPUT', 'In HI mode, a non-synchronised local carrier for DSBSC demodulation'] },
    { d: 'مذبذب تردده ماشي مع جهد المدخل، علشان كده هو الـ FM modulator.', spec: ['LO: من 1 لـ 17kHz، HI: من 60 لـ 140kHz', 'FREQ بيحدد f0 (التردد والمدخل 0V)', 'GAIN بيحدد G من 1 لـ 2 (عمره ما يوصل لصفر)', 'مدى VCO INPUT: من −3V لـ +3V', 'مخرج SINE (4Vp-p) و DIGITAL'], use: ['في FM: الرسالة على VCO INPUT', 'في وضع HI يبقى حامل محلي مش متزامن في DSBSC demod'] }),
  tpg: M('TWIN PULSE GENERATOR', 'Width: 5–40 µs      Delay Q1→Q2: 50–300 µs',
    { d: 'Every rising edge on CLK produces pulse Q1, followed after the delay by pulse Q2.', spec: ['CLK is a digital input', 'WIDTH sets the width of both pulses'], use: ['FM demod: works as the zero-crossing detector, pulses per second = signal frequency'] },
    { d: 'مع كل حافة صاعدة على CLK بيطلع نبضة Q1، وبعد التأخير نبضة Q2.', spec: ['CLK مدخل digital', 'WIDTH بيحدد عرض النبضتين'], use: ['في FM demod بيشتغل كـ Zero-Crossing Detector: عدد النبضات في الثانية = التردد'] }),
  das: M('DUAL ANALOG SWITCH', 'OUT = IN1·[C1] + IN2·[C2]', { d: 'Two analog switches controlled by digital signals, plus a sample-and-hold.', spec: ['S&H holds S&H IN at each rising edge of CONTROL 1'], use: ['Not used in the seven lab experiments'] },
    { d: 'مفتاحين تناظريين بيتحكم فيهم إشارات رقمية، ومعاهم Sample & Hold.', spec: ['الـ S&H بيمسك قيمة S&H IN عند الحافة الصاعدة لـ CONTROL 1'], use: ['مش مستخدم في التجارب السبعة'] }),
  seq: M('SEQUENCE GENERATOR', '', { d: 'Pseudo-random digital data (X: 31 bits, Y: 255 bits) and a line-coded output.', spec: ['00 NRZ-L, 01 Bi-Ø, 10 RZ-AMI, 11 NRZ-M', 'LINE CODE output ±2 V'], use: ['ASK, FSK, BPSK, QPSK, DSSS and SNR experiments (Term 2)'] },
    { d: 'بيطلّع بيانات رقمية شبه عشوائية (X: 31 bit و Y: 255 bit) ومخرج Line code.', spec: ['00 NRZ-L و 01 Bi-Ø و 10 RZ-AMI و 11 NRZ-M', 'مخرج LINE CODE بسعة ±2V'], use: ['تجارب ASK و FSK و BPSK و QPSK و DSSS و SNR (الترم التاني)'] }),
  div: M('DIVIDER', '', { d: 'Divides the frequency of a digital signal by 1, 2, 4 or 8.', spec: [], use: [] }, { d: 'بيقسم تردد إشارة رقمية على 1 أو 2 أو 4 أو 8.', spec: [], use: [] }),
  pcmenc: M('PCM ENCODER', '', { d: '8-bit analog-to-digital converter (offset binary) with a frame-sync output.', spec: ['Input range ±2 V', 'TDM: two channels in turn'], use: ['Not used in the seven lab experiments'] },
    { d: 'محول تناظري لرقمي 8 bit (offset binary) ومعاه FS لبداية كل كلمة.', spec: ['المدى ±2V', 'TDM: قناتين بالتناوب'], use: ['مش مستخدم في التجارب السبعة'] }),
  pcmdec: M('PCM DECODER', '', { d: '8-bit digital-to-analog converter.', spec: ['TDM lamp lights when two channels are received'], use: [] }, { d: 'محول رقمي لتناظري 8 bit.', spec: ['لمبة TDM بتنور لما يستقبل قناتين'], use: [] }),
  s2p: M('SERIAL TO PARALLEL', '', { d: 'Sends alternate bits to outputs X1 and X2 (±2 V).', spec: ['Bipolar outputs: logic 1 → −2 V, logic 0 → +2 V'], use: ['QPSK: X1 and X2 are the I and Q data', 'Delta and delta-sigma modulators: works as the Sampler'] }, { d: 'بيوزّع البتات بالتناوب على X1 و X2 (±2V).', spec: ['مخارج ثنائية القطبية: logic 1 → −2V و logic 0 → +2V'], use: ['QPSK: الـ X1 و X2 هما بيانات I و Q', 'Delta و Delta-Sigma: بيشتغل كـ Sampler'] }),
  expansion: M('EXPANSION', '', { d: 'Slot for add-on boards; not used in these experiments.', spec: [], use: [] }, { d: 'مكان تركيب كروت إضافية، مش مستخدم في التجارب دي.', spec: [], use: [] }),
};

// ------------------------------------------------------------------ about / disclaimer
export const NOTICE = {
  en: `<p class="lead"><b>This is a preliminary (beta) version</b> and is still being tested.</p><ul>
<li><b>Not an exact copy of the kit.</b> The simulator models the Emona ETT-101 and the oscilloscope from their published specifications and the lab books. Readings may not match the real kit 100%. When they differ, the real lab and your instructor are the reference.</li>
<li><b>For students, free and non-commercial.</b> It was made to help students practise and prepare for the communications labs. It must not be sold, rented, put behind a paywall, bundled with paid courses or used to make money in any way.</li>
<li><b>Not affiliated with Emona Instruments or UNI-T.</b> Kit and instrument names are used only to say what is being simulated.</li>
<li>Found something that does not match the kit? Use <b>Report a bug</b> so it can be fixed.</li></ul>`,
  ar: `<p class="lead"><b>دي نسخة أولية (تجريبية)</b> ولسه تحت الاختبار.</p><ul>
<li><b>مش نسخة طبق الأصل من الكيت.</b> البرنامج محاكاة لكيت Emona ETT-101 والأوسيلوسكوب، معمولة من المواصفات المنشورة وكتب المعمل، فممكن القراءات متكونش مطابقة للكيت الحقيقي 100%. لو فيه اختلاف، المعمل الحقيقي والمعيد هما المرجع.</li>
<li><b>للطلبة، مجاني وغير ربحي.</b> معمول لمساعدة الطلبة يتدربوا ويحضّروا لمعمل الاتصالات. ممنوع بيعه أو تأجيره أو إنه يتحط في كورس مدفوع أو التربح منه بأي شكل من الأشكال.</li>
<li><b>مش تابع لشركة Emona Instruments أو UNI-T.</b> أسامي الكيت والجهاز مستخدمة بس علشان توضّح البرنامج بيحاكي إيه.</li>
<li>لو لقيت حاجة مش مطابقة للكيت، استخدم زرار <b>بلّغ عن مشكلة</b> علشان تتصلح.</li></ul>`,
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
<li><b>توصيل سلك:</b> اسحب من مقبس لمقبس تاني. ينفع أكتر من سلك على نفس المقبس زي الأسلاك الحقيقية.</li>
<li><b>فك سلك:</b> دبل كليك عليه، وكليك يمين لتغيير لونه.</li>
<li><b>المقابض:</b> لف حوالين المقبض أو اسحب يمين وشمال أو فوق وتحت، أو استخدم عجلة الماوس. Shift للحركة الدقيقة.</li>
<li><b>العرض:</b> Kit و Both و Scope بيكبّروا الجزء ده على الشاشة. Ctrl + عجلة الماوس للتكبير عند المؤشر، واسحب في المساحة الفاضية علشان تتحرك. المفاتيح 1 و 2 و 3 بتبدّل العرض.</li>
<li><b>السماعة:</b> دوس على فتحة السماعة في BUFFER، والصوت بيطلع من سماعات الجهاز.</li>
<li><b>الإرشادات</b> (المفتاح اللي فوق) بتظهر زرار <b>i</b> على كل موديول، وأسماء المقابس وقراءتها اللحظية، وقيم المقابض. اقفلها علشان تتدرب زي الامتحان.</li></ul>`,
    scope: `<h3>الأوسيلوسكوب (نفس فكرة UTD2102CEL)</h3><ul>
<li><b>التوصيل:</b> اسحب من فتحة BNC (CH1 أو CH2 أو EXT TRIG) لأي مقبس على الكيت. دبل كليك على السلك بيفكه.</li>
<li><b>CH1 / CH2:</b> أول ضغطة بتختار القناة وتفتح قائمتها، ومقابض VERTICAL المشتركة بتتحكم فيها. لو قائمتها مفتوحة، الضغطة بتقفل القناة.</li>
<li><b>VERTICAL:</b> SCALE = Volts/div و POSITION بيحرّك الإشارة. كليك على المقبض من غير لف بيرجّع الـ position للصفر.</li>
<li><b>HORIZONTAL:</b> SCALE = Time/div (الشاشة 12 × 8 مربعات)، و POSITION بيحرّك الإشارة يمين وشمال. MENU فيه Zoom و XY.</li>
<li><b>TRIGGER:</b> LEVEL لمستوى التريجر (كليك عليه = 50%). MENU للمصدر والـ Slope و Auto/Normal/Single والـ Coupling.</li>
<li><b>RUN/STOP:</b> بيجمّد الالتقاط، وانت واقف تقدر تغيّر Time/div والـ position وتتفرج على الإشارة الملتقطة.</li>
<li><b>MEASURE</b> قياسات أوتوماتيك، <b>CURSOR</b> مؤشرات وقت أو جهد بتتحرك بـ MULTI PURPOSE، <b>MATH</b> فيه A+B و A−B و A×B و FFT، <b>AUTO</b> ضبط تلقائي، و<b>PrtSc</b> بيحفظ صورة الشاشة.</li></ul>
<p>كتاب المعمل مكتوب لأوسيلوسكوب Analog: «Mode DUAL» يعني CH1 و CH2 شغالين، و«Timebase» = HORIZONTAL SCALE، و«Vertical attenuation» = VERTICAL SCALE، و«Sweep magnification» = HORIZONTAL MENU ثم Zoom.</p>`,
  },
};

// ------------------------------------------------------------------ experiments
// step: { en, ar, c: [[a,b]...] required connections, p: {CH1: sock} required probes, q: {en, ar} }
const S = (en, ar, c, p, q) => ({ en, ar, c, p, q });
const Q = (en, ar) => ({ en, ar });
export const EXPERIMENTS = [
  { id: 'exp1', title: { en: 'AM modulation', ar: 'AM Modulation' }, steps: [
    S('Steps 3–5: CH1 coupling DC. Turn the ADDER G and g fully anticlockwise and the VARIABLE DCV knob almost fully anticlockwise.',
      'الخطوات 3–5: Coupling بتاع CH1 على DC. لف G و g في الـ ADDER للآخر عكس عقارب الساعة، ومقبض VARIABLE DCV تقريباً للآخر عكس عقارب الساعة.'),
    S('Step 6 (Figure 3): VDC → ADDER B, 2kHz SINE → ADDER A, CH1 on the ADDER output (GA+gB).',
      'الخطوة 6 (Figure 3): VDC → ADDER B، و 2kHz SINE → ADDER A، و CH1 على مخرج الـ ADDER (GA+gB).', [['vdc.VDC', 'adder.B'], ['master.SINE2', 'adder.A']], { CH1: 'adder.OUT' }),
    S('Steps 7–9: CH1 at 0.5 V/div, trace on the centre line. Turn g clockwise until the DC level is +1 V. (VDC is negative and the ADDER inverts, so the output goes positive.)',
      'الخطوات 7–9: CH1 على 0.5V/div والخط في نص الشاشة. لف g مع عقارب الساعة لحد ما الـ DC يبقى +1V. (الـ VDC سالب والـ ADDER بيقلب، فالمخرج بيطلع موجب.)'),
    S('Step 10: turn G clockwise for a 1 Vp-p sinewave on top of the 1 V DC.', 'الخطوة 10: لف G مع عقارب الساعة لحد ما تطلع sinewave 1Vp-p فوق الـ 1V DC.'),
    S('Step 11 (Figure 5): ADDER output → X DC of the lower MULTIPLIER, 100kHz SINE → its Y DC, CH2 on its kXY. CH1 stays on the ADDER output.',
      'الخطوة 11 (Figure 5): مخرج الـ ADDER → X DC في الـ MULTIPLIER اللي تحت، و 100kHz SINE → Y DC بتاعه، و CH2 على kXY بتاعه. CH1 يفضل على مخرج الـ ADDER.',
      [['adder.OUT', 'mult2.XDC'], ['master.SINE100', 'mult2.YDC']], { CH1: 'adder.OUT', CH2: 'mult2.KXY' }),
    S('Steps 12–14: both channels on, CH2 at 1 V/div, 0.1 ms/div. Draw both waveforms: AM = (1 VDC + 1 Vp-p 2 kHz) × 4 Vp-p 100 kHz. The upper envelope has the shape of the CH1 message.',
      'الخطوات 12–14: القناتين شغالين، و CH2 على 1V/div، و 0.1ms/div. ارسم الإشارتين: AM = (1VDC + 1Vp-p 2kHz) × 4Vp-p 100kHz. الغلاف العلوي بنفس شكل الرسالة اللي على CH1.'),
    S('Part B, steps 16–19: move the plug from 2kHz SINE to the SPEECH output, 2 ms/div, and talk.', 'Part B، الخطوات 16–19: انقل الفيشة من 2kHz SINE لمخرج SPEECH، و 2ms/div، واتكلم.', [['speech.OUT', 'adder.A']], null,
      Q('Why is there still a signal out of the multiplier when you are not talking?', 'ليه فيه إشارة طالعة من المضاعف حتى وانت مش بتتكلم؟')),
    S('Part C, steps 20–23: back to 0.1 ms/div and 2kHz SINE on ADDER A. Turn G a little each way.', 'Part C، الخطوات 20–23: رجّع 0.1ms/div و 2kHz SINE على ADDER A. لف G شوية يمين وشمال.', [['master.SINE2', 'adder.A']], null,
      Q('What is the relationship between the message amplitude and the amount of modulation?', 'إيه العلاقة بين سعة الرسالة ومقدار التعديل؟')),
    S('Steps 24–27: set the message back to 1 Vp-p. Measure P and Q (cursors help) and work out m = (P − Q) / (P + Q). Expected m ≈ 0.5.',
      'الخطوات 24–27: رجّع الرسالة 1Vp-p. قيس P و Q (الـ cursors بتساعد) واحسب m = (P − Q) / (P + Q). المتوقع m ≈ 0.5.'),
    S('Steps 28–29: turn G fully clockwise and overlay the message on the envelope with CH1 vertical position.', 'الخطوات 28–29: لف G للآخر مع عقارب الساعة، وركّب الرسالة على الغلاف بالـ vertical position بتاع CH1.', null, null,
      Q('What is the problem with an over-modulated AM signal? What is the maximum m without over-modulation?', 'إيه المشكلة في إشارة AM لما تبقى over-modulated؟ وإيه أقصى m من غير over-modulation؟')),
  ] },
  { id: 'exp2', title: { en: 'DSBSC modulation', ar: 'DSBSC Modulation' }, steps: [
    S('Step 3 (Figure 4): 100kHz SINE → X AC and 2kHz SINE → Y AC on the upper MULTIPLIER. CH1 on 2kHz SINE, CH2 on kXY.',
      'الخطوة 3 (Figure 4): 100kHz SINE → X AC و 2kHz SINE → Y AC في الـ MULTIPLIER اللي فوق. CH1 على 2kHz SINE و CH2 على kXY.',
      [['master.SINE100', 'mult1.XAC'], ['master.SINE2', 'mult1.YAC']], { CH1: 'master.SINE2', CH2: 'mult1.KXY' }),
    S('Steps 4–7: two cycles of the message on screen, both channels on, CH1 1 V/div, CH2 2 V/div. Draw both: DSBSC = 4 Vp-p 2 kHz × 4 Vp-p 100 kHz.',
      'الخطوات 4–7: دورتين من الرسالة على الشاشة، والقناتين شغالين، و CH1 على 1V/div و CH2 على 2V/div. ارسم الاتنين: DSBSC = 4Vp-p 2kHz × 4Vp-p 100kHz.', null, null,
      Q('Why is the DSBSC envelope not the same shape as the message?', 'ليه غلاف DSBSC مش بنفس شكل الرسالة؟')),
    S('Part B, steps 9–12: move both plugs from 2kHz SINE to the SPEECH output, 2 ms/div, and talk.', 'Part B، الخطوات 9–12: انقل الفيشتين من 2kHz SINE لمخرج SPEECH، و 2ms/div، واتكلم.', [['speech.OUT', 'mult1.YAC']], null,
      Q('Why is there no signal out of the multiplier when you are not talking?', 'ليه مافيش إشارة طالعة من المضاعف وانت مش بتتكلم؟')),
    S('Part C, steps 13–15 (Figure 7): 0.1 ms/div, BUFFER gain at a quarter of its travel. 2kHz SINE → BUFFER IN, BUFFER OUT → Y AC. CH1 stays on 2kHz SINE.',
      'Part C، الخطوات 13–15 (Figure 7): 0.1ms/div، و GAIN في BUFFER على ربع المشوار. 2kHz SINE → BUFFER IN، و BUFFER OUT → Y AC. CH1 يفضل على 2kHz SINE.',
      [['master.SINE2', 'buffer.IN'], ['buffer.OUT', 'mult1.YAC']], { CH1: 'master.SINE2' }),
    S('Step 16: turn the BUFFER gain a little each way and watch the DSBSC P and Q dimensions.', 'الخطوة 16: لف GAIN في BUFFER شوية يمين وشمال ولاحظ P و Q بتوع الـ DSBSC.', null, null,
      Q('When the message amplitude changes, which of P and Q are affected?', 'لما سعة الرسالة بتتغير، أنهي من P و Q بيتأثر؟')),
    S('Steps 17–18: set the BUFFER gain to about half its travel (a little more if nothing changes) and draw the overloaded DSBSC signal.', 'الخطوات 17–18: خلي GAIN في BUFFER حوالي نص المشوار (وزوّد شوية لو مفيش تغيير) وارسم إشارة الـ DSBSC وهي overloaded.'),
  ] },
  { id: 'exp3', title: { en: 'AM demodulation', ar: 'AM Demodulation' }, steps: [
    S('Steps 3–5: CH1 coupling DC. ADDER G and g fully anticlockwise, VARIABLE DCV knob almost fully anticlockwise.', 'الخطوات 3–5: Coupling بتاع CH1 على DC. G و g في الـ ADDER للآخر عكس عقارب الساعة، ومقبض VARIABLE DCV تقريباً للآخر عكس عقارب الساعة.'),
    S('Step 6 (Figure 2): VDC → ADDER B, 2kHz SINE → ADDER A, ADDER output → X DC of the lower MULTIPLIER, 100kHz SINE → its Y DC. CH1 on the ADDER output, CH2 on kXY.',
      'الخطوة 6 (Figure 2): VDC → ADDER B، و 2kHz SINE → ADDER A، ومخرج الـ ADDER → X DC في الـ MULTIPLIER اللي تحت، و 100kHz SINE → Y DC بتاعه. CH1 على مخرج الـ ADDER و CH2 على kXY.',
      [['vdc.VDC', 'adder.B'], ['master.SINE2', 'adder.A'], ['adder.OUT', 'mult2.XDC'], ['master.SINE100', 'mult2.YDC']], { CH1: 'adder.OUT', CH2: 'mult2.KXY' }),
    S('Steps 7–11: trace on the centre line, g for +1 V DC (0.5 V/div), G for a 1 Vp-p sinewave, both channels on. Measure m: it should be about 0.5.',
      'الخطوات 7–11: الخط في النص، و g لحد +1V DC (0.5V/div)، و G لحد sinewave 1Vp-p، والقناتين شغالين. قيس m: المفروض حوالي 0.5.'),
    S('Part B, step 12 (Figure 4): kXY → RECTIFIER input, RECTIFIER output → RC LPF input. CH2 on the RECTIFIER output.',
      'Part B، الخطوة 12 (Figure 4): kXY → مدخل RECTIFIER، ومخرج RECTIFIER → مدخل RC LPF. CH2 على مخرج RECTIFIER.',
      [['mult2.KXY', 'util.RECT_IN'], ['util.RECT', 'util.RC_IN']], { CH2: 'util.RECT' }),
    S('Steps 13–16: draw the message and the rectified AM signal, then move CH2 to the RC LPF output and draw the demodulated signal.', 'الخطوات 13–16: ارسم الرسالة والإشارة المقوّمة، وبعدين انقل CH2 لمخرج RC LPF وارسم الإشارة بعد الـ demodulation.', null, { CH2: 'util.RC' },
      Q('How does the recovered message compare with the original?', 'الرسالة المسترجعة شبه الأصلية إزاي؟')),
    S('Part D, steps 19–21 (Figure 6): CH1 back on the ADDER output, message back to 1 Vp-p. SPEECH → ADDER A, RC LPF output → BUFFER IN.',
      'Part D، الخطوات 19–21 (Figure 6): رجّع CH1 على مخرج الـ ADDER والرسالة 1Vp-p. SPEECH → ADDER A، ومخرج RC LPF → BUFFER IN.', [['speech.OUT', 'adder.A'], ['util.RC', 'buffer.IN']], { CH1: 'adder.OUT' }),
    S('Steps 22–27: 2 ms/div, BUFFER gain fully anticlockwise, plug in the headphones, then raise the gain to a comfortable level and talk.', 'الخطوات 22–27: 2ms/div، و GAIN في BUFFER للآخر عكس عقارب الساعة، وركّب السماعة، وبعدين علّي الـ GAIN لمستوى مريح واتكلم.'),
  ] },
  { id: 'exp4', title: { en: 'DSBSC demodulation', ar: 'DSBSC Demodulation' }, steps: [
    S('Step 3 (Figure 2): 100kHz SINE → X AC and 2kHz SINE → Y AC on the upper MULTIPLIER. CH1 on 2kHz SINE, CH2 on kXY.',
      'الخطوة 3 (Figure 2): 100kHz SINE → X AC و 2kHz SINE → Y AC في الـ MULTIPLIER اللي فوق. CH1 على 2kHz SINE و CH2 على kXY.',
      [['master.SINE100', 'mult1.XAC'], ['master.SINE2', 'mult1.YAC']], { CH1: 'master.SINE2', CH2: 'mult1.KXY' }),
    S('Steps 4–6: two cycles of the message, both channels on, draw the message and the DSBSC signal.', 'الخطوات 4–6: دورتين من الرسالة، والقناتين شغالين، وارسم الرسالة وإشارة الـ DSBSC.'),
    S('Part B, steps 7–9 (Figure 4): TUNEABLE LPF gain to the middle and fc fully clockwise. Upper kXY → X DC of the lower MULTIPLIER, 100kHz SINE → its Y DC, its kXY → TUNEABLE LPF IN, CH2 on TUNEABLE LPF OUT.',
      'Part B، الخطوات 7–9 (Figure 4): GAIN في TUNEABLE LPF في النص و fc للآخر مع عقارب الساعة. kXY اللي فوق → X DC في الـ MULTIPLIER اللي تحت، و 100kHz SINE → Y DC بتاعه، و kXY بتاعه → TUNEABLE LPF IN، و CH2 على TUNEABLE LPF OUT.',
      [['mult1.KXY', 'mult2.XDC'], ['master.SINE100', 'mult2.YDC'], ['mult2.KXY', 'tlpf.IN']], { CH2: 'tlpf.OUT' }, Q('How does the recovered message compare with the original?', 'الرسالة المسترجعة شبه الأصلية إزاي؟')),
    S('Part C, steps 11–13 (Figure 7): BUFFER gain at a quarter of its travel. 2kHz SINE → BUFFER IN, BUFFER OUT → Y AC of the upper MULTIPLIER. CH1 on the BUFFER output.',
      'Part C، الخطوات 11–13 (Figure 7): GAIN في BUFFER على ربع المشوار. 2kHz SINE → BUFFER IN، و BUFFER OUT → Y AC في الـ MULTIPLIER اللي فوق. CH1 على مخرج BUFFER.',
      [['master.SINE2', 'buffer.IN'], ['buffer.OUT', 'mult1.YAC']], { CH1: 'buffer.OUT' }),
    S('Vary the BUFFER gain and watch how the message amplitude, and overloading the modulator, show up in the recovered message.', 'غيّر GAIN في BUFFER ولاحظ تأثير سعة الرسالة، وتأثير الـ overload على الـ modulator، على الرسالة المسترجعة.'),
    S('Part D, steps 16–22 (Figure 9): SPEECH → Y AC of the upper MULTIPLIER, TUNEABLE LPF OUT → BUFFER IN. 2 ms/div, BUFFER gain fully anticlockwise, headphones in, raise the gain and talk.',
      'Part D، الخطوات 16–22 (Figure 9): SPEECH → Y AC في الـ MULTIPLIER اللي فوق، و TUNEABLE LPF OUT → BUFFER IN. 2ms/div، و GAIN في BUFFER للآخر عكس عقارب الساعة، وركّب السماعة، وعلّي الـ GAIN واتكلم.',
      [['speech.OUT', 'mult1.YAC'], ['tlpf.OUT', 'buffer.IN']]),
    S('Steps 33–38 (Figure 12): VCO range HI, frequency adjust to the middle. Replace the 100kHz SINE on the lower MULTIPLIER Y DC with VCO SINE. Tune the VCO as close to 100 kHz as you can by eye and ear.',
      'الخطوات 33–38 (Figure 12): الـ VCO على HI والـ Frequency Adjust في النص. استبدل 100kHz SINE على Y DC في الـ MULTIPLIER اللي تحت بـ VCO SINE. ظبط الـ VCO أقرب ما تقدر لـ 100kHz بعينك وودنك.',
      [['vco.SINE', 'mult2.YDC']], null, Q('What happens to the recovered message when the local carrier frequency is wrong?', 'إيه اللي بيحصل للرسالة المسترجعة لما تردد الحامل المحلي يبقى غلط؟')),
    S('Steps 39–40: move the 2kHz SINE plugs to the SPEECH output, talk, and vary the VCO frequency adjust.', 'الخطوات 39–40: انقل فيش 2kHz SINE لمخرج SPEECH، واتكلم، وغيّر الـ Frequency Adjust بتاع الـ VCO.'),
  ] },
  { id: 'exp5', title: { en: 'SSBSC modulation and demodulation', ar: 'SSBSC Modulation & Demodulation' }, steps: [
    S('Steps 4–8 (Figure 3): 2kHz SINE → PHASE SHIFTER IN. CH1 on 2kHz SINE, CH2 on PHASE SHIFTER OUT. Phase change switch to 180°, phase adjust to the middle.',
      'الخطوات 4–8 (Figure 3): 2kHz SINE → PHASE SHIFTER IN. CH1 على 2kHz SINE و CH2 على PHASE SHIFTER OUT. مفتاح الـ Phase change على 180° والـ Phase adjust في النص.',
      [['master.SINE2', 'phase.IN']], { CH1: 'master.SINE2', CH2: 'phase.OUT' }),
    S('Step 9 (Figure 5): PHASE SHIFTER OUT → X AC and 100kHz COS → Y AC on the upper MULTIPLIER. 100kHz SINE → X DC and 2kHz SINE → Y DC on the lower MULTIPLIER. CH2 on the lower kXY.',
      'الخطوة 9 (Figure 5): PHASE SHIFTER OUT → X AC و 100kHz COS → Y AC في الـ MULTIPLIER اللي فوق. 100kHz SINE → X DC و 2kHz SINE → Y DC في اللي تحت. CH2 على kXY اللي تحت.',
      [['phase.OUT', 'mult1.XAC'], ['master.COS100', 'mult1.YAC'], ['master.SINE100', 'mult2.XDC'], ['master.SINE2', 'mult2.YDC']], { CH2: 'mult2.KXY' }),
    S('Steps 10–14 (Figure 7): check both multiplier outputs are DSBSC. ADDER G and g to the middle. Upper kXY → ADDER A, lower kXY → ADDER B, CH2 on the ADDER output.',
      'الخطوات 10–14 (Figure 7): اتأكد إن مخرج المضاعفين DSBSC. G و g في الـ ADDER في النص. kXY اللي فوق → ADDER A، و kXY اللي تحت → ADDER B، و CH2 على مخرج الـ ADDER.',
      [['mult1.KXY', 'adder.A'], ['mult2.KXY', 'adder.B']], { CH2: 'adder.OUT' }, Q('The output is unlikely to be SSB yet. Give two reasons.', 'المخرج غالباً لسه مش SSB. اذكر سببين.')),
    S('Steps 15–19: G fully anticlockwise, set g for a 4 Vp-p output. Remove the ADDER B lead, set G for 4 Vp-p, then reconnect B.', 'الخطوات 15–19: G للآخر عكس عقارب الساعة، واظبط g على 4Vp-p. افصل سلك ADDER B، واظبط G على 4Vp-p، وبعدين رجّع B.'),
    S('Steps 20–23: turn the phase adjust until the envelopes are as flat as possible, then tweak G and the phase adjust to make them flatter still.', 'الخطوات 20–23: لف الـ Phase adjust لحد ما الغلاف يبقى مسطّح قد ما تقدر، وبعدين ظبط G والـ Phase adjust علشان يتسطح أكتر.'),
    S('Steps 24–27: 50 µs/div, then HORIZONTAL MENU → Zoom (the sweep magnification) and HORIZONTAL POSITION to look along the SSB signal.', 'الخطوات 24–27: 50µs/div، وبعدين HORIZONTAL MENU ثم Zoom (بدل الـ sweep magnification)، واستخدم HORIZONTAL POSITION علشان تتفرج على إشارة الـ SSB.', null, null,
      Q('How many sinewaves make up this SSB signal, and which two frequencies could it be?', 'إشارة SSB دي فيها كام sinewave، وإيه الترددين المحتملين ليها؟')),
    S('Part B, steps 28–30 (Figure 9): TUNEABLE LPF gain to the middle, fc fully clockwise. ADDER output → X DC of the bottom-row MULTIPLIER, 100kHz SINE → its Y DC, its kXY → TUNEABLE LPF IN, CH2 on TUNEABLE LPF OUT.',
      'Part B، الخطوات 28–30 (Figure 9): GAIN في TUNEABLE LPF في النص و fc للآخر مع عقارب الساعة. مخرج الـ ADDER → X DC في الـ MULTIPLIER اللي في الصف التحتاني، و 100kHz SINE → Y DC بتاعه، و kXY بتاعه → TUNEABLE LPF IN، و CH2 على TUNEABLE LPF OUT.',
      [['adder.OUT', 'mult3.XDC'], ['master.SINE100', 'mult3.YDC'], ['mult3.KXY', 'tlpf.IN']], { CH1: 'master.SINE2', CH2: 'tlpf.OUT' },
      Q('What is the relationship between the original and the recovered message?', 'إيه العلاقة بين الرسالة الأصلية والمسترجعة؟')),
  ] },
  { id: 'exp6', title: { en: 'FM modulation', ar: 'FM Modulation' }, steps: [
    S('Steps 3–6 (Figure 2): VCO GAIN at about two thirds of its travel, FREQUENCY ADJUST to the middle, range LO. CH1 on VCO SINE.',
      'الخطوات 3–6 (Figure 2): GAIN في الـ VCO حوالي تلتين المشوار، و FREQUENCY ADJUST في النص، والمدى LO. CH1 على VCO SINE.', null, { CH1: 'vco.SINE' }),
    S('Steps 7–9: 20 µs/div, adjust FREQUENCY until one cycle is exactly 5 divisions (10 kHz rest frequency), then 0.1 ms/div.', 'الخطوات 7–9: 20µs/div، ولف FREQUENCY لحد ما الدورة تبقى 5 مربعات بالظبط (تردد الراحة 10kHz)، وبعدين 0.1ms/div.'),
    S('Step 10 (Figure 3): 2kHz DIGITAL → VCO INPUT. CH1 on 2kHz DIGITAL, CH2 on VCO SINE.', 'الخطوة 10 (Figure 3): 2kHz DIGITAL → VCO INPUT. CH1 على 2kHz DIGITAL و CH2 على VCO SINE.', [['master.DIG2', 'vco.IN']], { CH1: 'master.DIG2', CH2: 'vco.SINE' }),
    S('Steps 11–13: both channels on; tweak the VCO GAIN for an FM signal like Figure 1 and overlay the message with CH1 vertical position.', 'الخطوات 11–13: القناتين شغالين، وظبط GAIN في الـ VCO لحد ما تطلع إشارة FM زي Figure 1، وركّب الرسالة عليها بالـ vertical position بتاع CH1.', null, null,
      Q('Why does the frequency of the carrier change?', 'ليه تردد الحامل بيتغير؟')),
    S('Part B, steps 14–20 (Figure 5): move both plugs from 2kHz DIGITAL to the SPEECH output. Trigger source CH2. Talk, then at 20 µs/div hum louder and louder at the same pitch.',
      'Part B، الخطوات 14–20 (Figure 5): انقل الفيشتين من 2kHz DIGITAL لمخرج SPEECH. الـ Trigger source على CH2. اتكلم، وبعدين على 20µs/div دندن بصوت أعلى وأعلى بنفس النغمة.', [['speech.OUT', 'vco.IN']]),
    S('Part C, steps 21–24 (Figure 6): CH2 only. 2kHz SINE → VCO INPUT. The display looks like Figure 7, a smear of many sinewaves; Display → Persist helps. If not, turn GAIN anticlockwise slowly.',
      'Part C، الخطوات 21–24 (Figure 6): CH2 بس. 2kHz SINE → VCO INPUT. الشاشة هتبان زي Figure 7، sinewaves كتير فوق بعض، و Display → Persist بيساعد. لو مش كده، لف GAIN عكس عقارب الساعة بالراحة.', [['master.SINE2', 'vco.IN']]),
    S('Steps 25–28: try 2kHz DIGITAL, then SPEECH, as the message and note the spectral composition each time.', 'الخطوات 25–28: جرّب 2kHz DIGITAL وبعدين SPEECH كرسالة ولاحظ مكونات الإشارة في كل مرة.'),
  ] },
  { id: 'exp7', title: { en: 'FM demodulation (zero crossing)', ar: 'FM Demodulation (ZCD)' }, steps: [
    S('Steps 3–8 (Figure 3): VCO GAIN fully clockwise, FREQUENCY ADJUST to the middle, range LO. CH1 on VCO SINE; set it to 10 kHz (period 100 µs).',
      'الخطوات 3–8 (Figure 3): GAIN في الـ VCO للآخر مع عقارب الساعة، و FREQUENCY ADJUST في النص، والمدى LO. CH1 على VCO SINE، واظبطه على 10kHz (الزمن الدوري 100µs).', null, { CH1: 'vco.SINE' }),
    S('Steps 9–13 (Figure 4): trigger source CH2, both channels DC coupled. VDC → VCO INPUT, CH1 on VDC, CH2 on VCO SINE. Vary VDC and watch the frequency.',
      'الخطوات 9–13 (Figure 4): الـ Trigger source على CH2، والقناتين DC coupled. VDC → VCO INPUT، و CH1 على VDC و CH2 على VCO SINE. غيّر VDC ولاحظ التردد.', [['vdc.VDC', 'vco.IN']], { CH1: 'vdc.VDC', CH2: 'vco.SINE' }),
    S('Steps 14–17: VDC = +2 V and adjust GAIN for 15 kHz (period 66 µs). Then VDC = −2 V: about 5 kHz if the VCO is linear (2.5 kHz/V).',
      'الخطوات 14–17: VDC = +2V ولف GAIN لحد 15kHz (الزمن الدوري 66µs). وبعدين VDC = −2V: حوالي 5kHz لو الـ VCO linear (2.5kHz/V).'),
    S('Part B, steps 18–21 (Figure 6): trigger CH1. TWIN PULSE WIDTH and DELAY fully anticlockwise. 8kHz DIGITAL → CLK, CH1 on Q1.',
      'Part B، الخطوات 18–21 (Figure 6): الـ Trigger على CH1. WIDTH و DELAY في TWIN PULSE للآخر عكس عقارب الساعة. 8kHz DIGITAL → CLK، و CH1 على Q1.', [['master.DIG8', 'tpg.CLK']], { CH1: 'tpg.Q1' }),
    S('Steps 22–24: 2 µs/div, set WIDTH for a 12 µs pulse, then back to 50 µs/div.', 'الخطوات 22–24: 2µs/div، واظبط WIDTH على نبضة 12µs، وبعدين رجّع 50µs/div.'),
    S('Step 25 (Figure 7): VCO SINE → COMPARATOR IN, GND → COMPARATOR REF, COMPARATOR OUT → TWIN PULSE CLK (in place of 8kHz DIGITAL), Q1 → BASEBAND LPF IN. CH1 on VDC, CH2 on BASEBAND LPF OUT.',
      'الخطوة 25 (Figure 7): VCO SINE → COMPARATOR IN، و GND → COMPARATOR REF، و COMPARATOR OUT → TWIN PULSE CLK (بدل 8kHz DIGITAL)، و Q1 → BASEBAND LPF IN. CH1 على VDC و CH2 على BASEBAND LPF OUT.',
      [['vco.SINE', 'util.CIN'], ['vdc.GND', 'util.REF'], ['util.COMP', 'tpg.CLK'], ['tpg.Q1', 'channel.BB_IN']], { CH1: 'vdc.VDC', CH2: 'channel.BB' }),
    S('Step 26: vary VDC. The small DC level out of the BASEBAND LPF follows it (CH2 coupling DC).', 'الخطوة 26: غيّر VDC. الـ DC الصغير الطالع من BASEBAND LPF بيمشي معاه (Coupling بتاع CH2 على DC).'),
    S('Part C, steps 27–35: look at VCO SINE with COMPARATOR OUT, then COMPARATOR OUT with Q1, then Q1 with BASEBAND LPF OUT (CH2 at 0.5 V/div), while varying VDC.',
      'Part C، الخطوات 27–35: اتفرج على VCO SINE مع COMPARATOR OUT، وبعدين COMPARATOR OUT مع Q1، وبعدين Q1 مع BASEBAND LPF OUT (CH2 على 0.5V/div)، وانت بتغيّر VDC.', null, { CH1: 'tpg.Q1', CH2: 'channel.BB' },
      Q('If the message is a sinewave instead of a DC voltage, what will come out of the BASEBAND LPF?', 'لو الرسالة sinewave بدل DC، إيه اللي هيطلع من BASEBAND LPF؟')),
    S('Part D, steps 36–41 (Figure 16): remove the VDC plug (leave GND). 2kHz SINE → VCO INPUT, CH1 on 2kHz SINE, CH2 on BASEBAND LPF OUT with AC coupling. The output is the message with some phase shift.',
      'Part D، الخطوات 36–41 (Figure 16): شيل فيشة VDC (سيب GND). 2kHz SINE → VCO INPUT، و CH1 على 2kHz SINE و CH2 على BASEBAND LPF OUT بـ AC coupling. المخرج هو الرسالة ومعاها شوية إزاحة طور.',
      [['master.SINE2', 'vco.IN']], { CH1: 'master.SINE2', CH2: 'channel.BB' }, Q('What does the FM signal tell you about the duty cycle of the ZCD output?', 'إشارة FM بتقولك إيه عن الـ duty cycle بتاع مخرج الـ ZCD؟')),
    S('Part E, steps 42–47 (Figure 18): TUNEABLE LPF gain to the middle, fc to the middle. CH1 on fc×100; at 1 µs/div adjust fc for 200 kHz (period 5 µs), which makes fc = 2 kHz. Then 5 ms/div.',
      'Part E، الخطوات 42–47 (Figure 18): GAIN في TUNEABLE LPF في النص و fc في النص. CH1 على fc×100، وعلى 1µs/div اظبط fc لحد 200kHz (الزمن الدوري 5µs)، كده fc = 2kHz. وبعدين 5ms/div.', null, { CH1: 'tlpf.FC100' }),
    S('Steps 48–54 (Figure 19): SPEECH → TUNEABLE LPF IN, TUNEABLE LPF OUT → VCO INPUT, BASEBAND LPF OUT → BUFFER IN. BUFFER gain fully anticlockwise, headphones in, raise the gain and talk.',
      'الخطوات 48–54 (Figure 19): SPEECH → TUNEABLE LPF IN، و TUNEABLE LPF OUT → VCO INPUT، و BASEBAND LPF OUT → BUFFER IN. GAIN في BUFFER للآخر عكس عقارب الساعة، وركّب السماعة، وعلّي الـ GAIN واتكلم.',
      [['speech.OUT', 'tlpf.IN'], ['tlpf.OUT', 'vco.IN'], ['channel.BB', 'buffer.IN']]),
  ] },
];
