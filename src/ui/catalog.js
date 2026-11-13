// Ready-made experiment setups, grouped by book, with the page where each part starts.
// Term books: "page" is the number printed on the page; the PDF page is page + 2 (cover and contents come first).
// Emona manuals: "label" is the printed page (experiment-page), "pdf" the page in the PDF file.
// Pages were located from the books' own text (Part headings and Figure captions).

export const BOOKS = {
  t1: { en: 'Electrical Testing (6) lab manual, ELC414 (Term 1)', ar: 'كتاب معمل Electrical Testing (6)، ELC414 (الترم الأول)', pdfOff: 2 },
  t2: { en: 'Electrical Testing (7) lab manual, ELC424 (Term 2)', ar: 'كتاب معمل Electrical Testing (7)، ELC424 (الترم التاني)', pdfOff: 2 },
  smp: { en: 'Emona 101 Trainer SAMPLE Lab Manual (Vol. 1 & 2)', ar: 'Emona 101 Trainer SAMPLE Lab Manual (الجزء 1 و 2)' },
  dx: { en: 'Emona DATEx Lab Manual, Vol. 1', ar: 'Emona DATEx Lab Manual، الجزء 1' },
};

// entry: [setup file, part, where (figure / steps), page or {label, pdf}, English name, Arabic name]
const E = (f, part, where, pg, en, ar) => ({ f, part, where, pg, en, ar });

export const GROUPS = [
  // ------------------------------------------------ Term 1
  { tab: 't1', book: 't1', n: 1, en: 'AM Modulation', ar: 'AM Modulation', pages: '1–14', guide: 'exp1', items: [
    E('Term1/01-Exp1-AM-Modulation', 'A', 'Figs. 3–5', 5, 'AM signal from a simple message (1 V DC + 1 Vp-p)', 'توليد إشارة AM برسالة بسيطة (1V DC + 1Vp-p)')] },
  { tab: 't1', book: 't1', n: 2, en: 'DSBSC Modulation', ar: 'DSBSC Modulation', pages: '15–25', guide: 'exp2', items: [
    E('Term1/02-Exp2-DSBSC-Modulation', 'A', 'Fig. 4', 19, 'DSBSC signal from a simple message', 'توليد إشارة DSBSC برسالة بسيطة')] },
  { tab: 't1', book: 't1', n: 3, en: 'AM Demodulation', ar: 'AM Demodulation', pages: '26–37', guide: 'exp3', items: [
    E('Term1/03-Exp3-AM-Demodulation', 'B', 'Fig. 4', 31, 'Recovering the message with an envelope detector', 'استرجاع الرسالة بالـ envelope detector')] },
  { tab: 't1', book: 't1', n: 4, en: 'DSBSC Demodulation', ar: 'DSBSC Demodulation', pages: '38–50', guide: 'exp4', items: [
    E('Term1/04-Exp4-DSBSC-Demodulation', 'B', 'Fig. 4', 44, 'Recovering the message with a product detector', 'استرجاع الرسالة بالـ product detector'),
    E('Term1/04-Exp4-PartC-Buffer', 'C', 'Fig. 7', 46, "The message's amplitude and the recovered message (BUFFER)", 'تأثير سعة الرسالة على الناتج (BUFFER)'),
    E('Term1/04-Exp4-VCO-Carrier', '', 'Steps 33–38', 48, 'VCO as the local carrier in the receiver', 'الـ VCO كحامل محلي في المستقبل')] },
  { tab: 't1', book: 't1', n: 5, en: 'SSBSC Modulation and Demodulation', ar: 'SSBSC Modulation & Demodulation', pages: '51–63', guide: 'exp5', items: [
    E('Term1/05-Exp5-SSB-Modulation', 'A', 'Fig. 3', 55, 'SSB signal by the phasing method', 'توليد SSB بطريقة الـ phasing'),
    E('Term1/05-Exp5-SSB-Demodulation', 'B', 'Fig. 9', 62, 'Recovering the message with a product detector', 'استرجاع الرسالة بالـ product detector')] },
  { tab: 't1', book: 't1', n: 6, en: 'FM Modulation', ar: 'FM Modulation', pages: '64–72', guide: 'exp6', items: [
    E('Term1/06-Exp6-FM-Modulation', 'A', 'Fig. 2', 67, 'Frequency modulating a squarewave', 'تضمين FM برسالة مربعة'),
    E('Term1/06-Exp6-PartC-Sine-Message', 'C', 'Fig. 6', 71, 'FM with a sinewave message', 'FM برسالة sine')] },
  { tab: 't1', book: 't1', n: 7, en: 'FM Demodulation', ar: 'FM Demodulation', pages: '73–90', guide: 'exp7', items: [
    E('Term1/07-Exp7-FM-Demodulation', 'B', 'Fig. 6', 79, 'The zero-crossing detector', 'الـ zero-crossing detector'),
    E('Term1/07-Exp7-PartD-Sine-Message', 'D', 'Fig. 16', 87, 'Transmitting and recovering a sinewave', 'إرسال واسترجاع sine بالـ FM')] },

  // ------------------------------------------------ Term 2 (the book numbers them 1–13; the Emona number is printed in each page header)
  { tab: 't2', book: 't2', n: 1, emona: 'Vol.1 Exp 11', guide: 's11', en: 'Sampling and Reconstruction', ar: 'Sampling and Reconstruction', pages: '1–15', items: [
    E('Term2/01-Exp11-A-Natural-Sampling', 'A', 'Fig. 2', 4, 'Natural sampling', 'الـ natural sampling'),
    E('Term2/01-Exp11-A-Sample-and-Hold', 'A', 'Fig. 4', 7, 'Sample-and-hold', 'الـ sample-and-hold'),
    E('Term2/01-Exp11-C-Reconstruction', 'C', 'Fig. 7', 10, 'Reconstructing the message', 'إعادة بناء الرسالة بالـ LPF'),
    E('Term2/01-Exp11-D-Aliasing', 'D', 'Fig. 9', 13, 'Aliasing', 'الـ aliasing')] },
  { tab: 't2', book: 't2', n: 2, emona: 'Vol.1 Exp 12', guide: 's12', en: 'PCM Encoding', ar: 'PCM Encoding', pages: '16–29', items: [
    E('Term2/02-Exp12-A-PCM-0V', 'A', 'Fig. 5', 22, 'PCM code of 0 V', 'كود الـ PCM لـ 0 فولت'),
    E('Term2/02-Exp12-B-PCM-Variable-DC', 'B', 'Fig. 7', 24, 'Encoding a variable DC voltage', 'تشفير جهد DC متغيّر'),
    E('Term2/02-Exp12-D-PCM-Sinewave', 'D', 'Fig. 9', 29, 'Encoding a sinewave', 'تشفير موجة sine')] },
  { tab: 't2', book: 't2', n: 3, emona: 'Vol.1 Exp 13', guide: 's13', en: 'PCM Decoding', ar: 'PCM Decoding', pages: '30–42', items: [
    E('Term2/03-Exp13-B-PCM-Decoding', 'B', 'Fig. 5', 36, 'Decoding the PCM data', 'فك تشفير بيانات الـ PCM'),
    E('Term2/03-Exp13-D-Recovering-Message', 'D', 'Fig. 10', 40, 'Recovering the message', 'استرجاع الرسالة')] },
  { tab: 't2', book: 't2', n: 4, emona: 'Vol.1 Exp 15', guide: 's15', en: 'Amplitude Shift Keying (ASK)', ar: 'Amplitude Shift Keying (ASK)', pages: '43–56', items: [
    E('Term2/04-Exp15-A-ASK-Generation', 'A', 'Fig. 2', 46, 'Generating ASK', 'توليد ASK'),
    E('Term2/04-Exp15-A-ASK-100kHz-Carrier', 'A', 'Fig. 4', 49, 'ASK on a 100 kHz carrier (VCO)', 'ASK على حامل 100kHz من الـ VCO'),
    E('Term2/04-Exp15-B-ASK-Envelope-Detection', 'B', 'Fig. 6', 51, 'Demodulating with an envelope detector', 'فك التضمين بالـ envelope detector'),
    E('Term2/04-Exp15-C-ASK-Comparator', 'C', 'Fig. 8', 53, 'Restoring the data with a comparator', 'استرجاع الداتا بالـ comparator')] },
  { tab: 't2', book: 't2', n: 5, emona: 'Vol.1 Exp 16', guide: 's16', en: 'Frequency Shift Keying (FSK)', ar: 'Frequency Shift Keying (FSK)', pages: '57–67', items: [
    E('Term2/05-Exp16-A-FSK-Generation', 'A', 'Fig. 2', 60, 'Generating FSK', 'توليد FSK'),
    E('Term2/05-Exp16-B-FSK-Filtering', 'B', 'Fig. 4', 63, 'Picking out one tone with a filter', 'فصل نغمة واحدة بالفلتر'),
    E('Term2/05-Exp16-C-FSK-Envelope-and-Comparator', 'B', 'Figs. 6–8', 64, 'Envelope detector, then comparator', 'envelope detector وبعده comparator')] },
  { tab: 't2', book: 't2', n: 6, emona: 'Vol.1 Exp 17', guide: 's17', en: 'Binary Phase Shift Keying (BPSK)', ar: 'Binary Phase Shift Keying (BPSK)', pages: '68–75', items: [
    E('Term2/06-Exp17-A-BPSK-Generation', 'A', 'Fig. 2', 71, 'Generating BPSK', 'توليد BPSK'),
    E('Term2/06-Exp17-B-BPSK-Product-Detector', 'B', 'Fig. 4', 73, 'Demodulating with a product detector', 'فك التضمين بالـ product detector'),
    E('Term2/06-Exp17-C-BPSK-Comparator', 'C', 'Fig. 6', 75, 'Restoring the data with a comparator', 'استرجاع الداتا بالـ comparator')] },
  { tab: 't2', book: 't2', n: 7, emona: 'Vol.1 Exp 18', guide: 's18', en: 'Quadrature Phase Shift Keying (QPSK)', ar: 'Quadrature Phase Shift Keying (QPSK)', pages: '76–91', items: [
    E('Term2/07-Exp18-A-QPSK-Serial-to-Parallel', 'A', 'Fig. 3', 80, 'Splitting the data into X1 and X2', 'تقسيم الداتا لـ X1 و X2'),
    E('Term2/07-Exp18-A-QPSK-Generation', 'A', 'Figs. 5–9', 82, 'Generating QPSK', 'توليد QPSK'),
    E('Term2/07-Exp18-B-QPSK-Recover-X1', 'B', 'Fig. 11', 88, 'Recovering X1 by phase discrimination', 'استرجاع X1 بالـ phase discrimination'),
    E('Term2/07-Exp18-B-QPSK-Comparator', 'B', 'Fig. 13', 90, 'Restoring X1 with a comparator', 'استرجاع X1 بالـ comparator'),
    E('Term2/07-Exp18-B-QPSK-Recover-X2', 'B', 'Steps 46–47', 91, 'Recovering X2', 'استرجاع X2')] },
  { tab: 't2', book: 't2', n: 8, emona: 'Vol.1 Exp 19', guide: 's19', en: 'DSSS Modulation and Demodulation', ar: 'DSSS Modulation & Demodulation', pages: '92–105', items: [
    E('Term2/08-Exp19-A-DSSS-Generation', 'A', 'Fig. 1', 95, 'Generating a DSSS signal', 'توليد إشارة DSSS'),
    E('Term2/08-Exp19-C-DSSS-Demodulation', 'C', 'Fig. 4', 98, 'Despreading with the right code', 'فك الـ spreading بالكود الصح'),
    E('Term2/08-Exp19-C-DSSS-Wrong-Code', 'C', 'Fig. 7', 100, 'Despreading with the wrong code', 'فك الـ spreading بكود غلط'),
    E('Term2/08-Exp19-D-DSSS-Jamming', 'D', 'Fig. 8', 101, 'Jamming signal in the channel', 'إشارة تشويش (jamming) في القناة'),
    E('Term2/08-Exp19-D-DSSS-Swept-Jamming', 'D', 'Fig. 10', 103, 'Swept jamming signal', 'تشويش متغيّر التردد'),
    E('Term2/08-Exp19-D-DSSS-Noise', 'D', 'Fig. 11', 104, 'Noise in the channel', 'وشوشة في القناة')] },
  { tab: 't2', book: 't2', n: 9, emona: 'Vol.2 Exp 6', guide: 'v2e6', en: 'Pulse Width Modulation and Demodulation', ar: 'PWM Modulation & Demodulation', pages: '106–131', items: [
    E('Term2/09-Exp6-Vol2-A-PWM-Sawtooth', 'A', 'Fig. 4', 110, 'Generating the sawtooth', 'توليد موجة الـ sawtooth'),
    E('Term2/09-Exp6-Vol2-B-PWM-DC-Input', 'B', 'Figs. 6–8', 112, 'PWM of a DC voltage', 'PWM لجهد DC'),
    E('Term2/09-Exp6-Vol2-C-PWM-Sine-Message', 'C', 'Fig. 10', 117, 'PWM of a sinewave message', 'PWM لرسالة sine'),
    E('Term2/09-Exp6-Vol2-D-PWM-Demodulation', 'D', 'Fig. 14', 122, 'Recovering the message', 'استرجاع الرسالة'),
    E('Term2/09-Exp6-Vol2-E-PWM-Nyquist', 'E', '', 126, 'Breaking the Nyquist rate', 'لما ما نلتزمش بـ Nyquist')] },
  { tab: 't2', book: 't2', n: 10, emona: 'Vol.2 Exp 8', guide: 'v2e8', en: 'Carrier Acquisition Using the PLL', ar: 'Carrier Acquisition (PLL)', pages: '132–142', items: [
    E('Term2/10-Exp8-Vol2-A-PLL-AM-Signal', 'A', 'Fig. 5', 137, 'A 100 % modulated AM signal', 'إشارة AM متضمّنة 100%'),
    E('Term2/10-Exp8-Vol2-B-PLL-Lock', 'B', 'Fig. 8', 141, 'The PLL locks to the carrier', 'الـ PLL بيقفل على الحامل')] },
  { tab: 't2', book: 't2', n: 11, emona: 'Vol.2 Exp 9', guide: 'v2e9', en: 'Signal-to-Noise Ratio', ar: 'Signal-to-Noise Ratio', pages: '143–154', items: [
    E('Term2/11-Exp9-Vol2-A-Noisy-Data', 'A', 'Fig. 1', 146, 'Adding noise to data', 'إضافة وشوشة للداتا'),
    E('Term2/11-Exp9-Vol2-B-Band-Limited', 'B', 'Fig. 3', 149, 'Band-limiting the noisy signal', 'تحديد عرض نطاق الإشارة المشوّشة')] },
  { tab: 't2', book: 't2', n: 12, emona: 'Vol.2 Exp 16', guide: 'v2e16', en: 'Delta Modulation and Demodulation', ar: 'Delta Modulation & Demodulation', pages: '155–182', items: [
    E('Term2/12-Exp16-Vol2-A-Delta-Modulator', 'A', 'Figs. 3–7', 160, 'Setting up the delta modulator', 'تجهيز الـ delta modulator'),
    E('Term2/12-Exp16-Vol2-B-Delta-Signal', '', 'Fig. 9', 166, 'The delta signal (larger step size)', 'إشارة الـ delta (step أكبر)'),
    E('Term2/12-Exp16-Vol2-C-Delta-Demodulation', 'C', 'Fig. 14', 172, 'Delta demodulation', 'فك الـ delta'),
    E('Term2/12-Exp16-Vol2-D-Delta-SNDR', 'D', 'Fig. 20', 180, 'Signal-to-noise-and-distortion', 'نسبة الإشارة للوشوشة والتشوّه (SNDR)')] },
  { tab: 't2', book: 't2', n: 13, emona: 'Vol.2 Exp 17', guide: 'v2e17', en: 'Delta-Sigma Modulation and Demodulation', ar: 'Delta-Sigma Modulation & Demodulation', pages: '183–196', items: [
    E('Term2/13-Exp17-Vol2-A-Delta-Sigma-Modulator', 'A', 'Figs. 3–7', 186, 'Setting up the delta-sigma modulator', 'تجهيز الـ delta-sigma modulator'),
    E('Term2/13-Exp17-Vol2-A-Delta-Sigma-Signal', 'A', 'Step 18', 192, 'The delta-sigma pulse train', 'نبضات الـ delta-sigma'),
    E('Term2/13-Exp17-Vol2-B-Delta-Sigma-Demodulation', 'B', 'Fig. 11', 193, 'Delta-sigma demodulation', 'فك الـ delta-sigma')] },

  // ------------------------------------------------ Extra (not in the course books)
  { tab: 'x', book: 'smp', emona: 'Vol.1 Exp 3', guide: 'x3', en: 'Using the trainer to model equations', ar: 'نمذجة المعادلات بالكيت', items: [
    E('Extra/Vol1-Exp3-A-Adder-Model', 'A', 'Fig. 2', { label: '3-4', pdf: 16 }, 'The ADDER models y = −(x + x)', 'الـ ADDER بيمثّل y = −(x + x)'),
    E('Extra/Vol1-Exp3-B-Phase-Cancellation', 'B', 'Fig. 4', { label: '3-8', pdf: 20 }, 'Cancelling a signal with its 180° copy', 'إلغاء إشارة بنسخة مزاحة 180°')] },
  { tab: 'x', book: 'dx', emona: 'Vol.2 Exp 18 · DATEx Exp 7', guide: 'x18', adapted: true, en: 'AM and DSBSC in the frequency domain', ar: 'AM و DSBSC في الـ frequency domain', items: [
    E('Extra/Vol2-Exp18-A-AM-Spectrum', 'A–C', '', { label: '7-5', pdf: 127 }, 'AM spectrum on the FFT', 'طيف الـ AM على الـ FFT'),
    E('Extra/Vol2-Exp18-D-DSBSC-Spectrum', 'D–E', 'Fig. 7', { label: '7-16', pdf: 138 }, 'DSBSC spectrum on the FFT', 'طيف الـ DSBSC على الـ FFT')] },
  { tab: 'x', book: 'dx', emona: 'Vol.1 Exp 14 · DATEx Exp 16', guide: 'x14', adapted: true, en: 'Bandwidth limiting and restoring digital signals', ar: 'تحديد عرض النطاق واسترجاع الإشارات الديجيتال', items: [
    E('Extra/Vol1-Exp14-A-PCM-Through-Narrow-Channel', 'A', '', { label: '16-4', pdf: 288 }, 'PCM through a narrow channel', 'PCM خلال قناة ضيقة'),
    E('Extra/Vol1-Exp14-B-Bandwidth-Limited-Data', 'B', 'Fig. 7', { label: '16-10', pdf: 294 }, 'Band-limited digital data', 'داتا ديجيتال محدودة النطاق'),
    E('Extra/Vol1-Exp14-B-Higher-Bit-Rate', 'B', 'Steps 41–46', { label: '16-12', pdf: 296 }, 'A higher bit rate through the same channel', 'سرعة بيانات أعلى في نفس القناة'),
    E('Extra/Vol1-Exp14-C-Restoring-Data', 'C', '', { label: '16-14', pdf: 298 }, 'Restoring the data with a comparator', 'استرجاع الداتا بالـ comparator')] },
  { tab: 'x', book: 'dx', emona: 'Vol.1 Exp 20 · DATEx Exp 22', guide: 'x20', adapted: true, en: 'Undersampling in software defined radio', ar: 'الـ undersampling في الـ SDR', items: [
    E('Extra/Vol1-Exp20-B-Undersampling', 'B', '', { pdf: 397 }, 'Down-conversion by undersampling', 'تنزيل التردد بالـ undersampling'),
    E('Extra/Vol1-Exp20-C-Unsynchronised-Clock', 'C', 'Fig. 6', { pdf: 402 }, 'An unsynchronised sample clock', 'clock مش متزامن')] },
];
