// UI strings. English is the default; Arabic switches the whole interface to right-to-left.
const STR = {
  en: {
    appName: 'Telecoms-Trainer 101', appSub: 'simulator', beta: 'Beta', betaHint: 'Preliminary version: may not match the real kit 100%. Free, for students only.', about: 'About this simulator',
    guidance: 'Guidance', modeHint: 'Guidance shows the info buttons, socket names with live readings, and knob values. Turn it off to practise like the real lab exam.',
    library: 'Load experiment', libHint: 'Ready-made experiments from the lab books, with the page of each one. One click wires the kit and sets the scope.',
    reference: 'Reference', refHint: 'The model reference: every module’s equation and numbers, and where each number comes from.',
    libTitle: 'Ready-made experiments', libTab_t1: 'Term 1', libTab_t2: 'Term 2', libTab_x: 'Extra', libSearch: 'Search', libLoad: 'Load', libExp: 'Exp', libPart: 'Part',
    libSheet: 'Step-by-step sheet', libReplace: 'Loading an experiment replaces the leads and settings on the kit now. Continue?',
    libBookNote: 'Page numbers are the numbers printed on the page. In the PDF file the page is 2 higher (cover and contents come first).',
    libEmonaNote: 'Experiments from the Emona manuals that are not in the course books. The page is the one printed on the page (experiment-page); “PDF” is the page in the PDF file.',
    libAdapted: 'Adapted: the DATEx uses the NI ELVIS function generator; here the VCO takes its place.', libNone: 'No experiment matches your search.',
    refTitle: 'Model reference', refIntro: 'What the simulator is built on: each module’s equation and values, where every number comes from, what still needs measuring on the real kit, and the checks against the lab books.',
    bug: 'Report or suggest', bugHint: 'Report a problem or suggest a new feature: it goes to the developer on WhatsApp.', bugTitle: 'Report a bug', ideaTitle: 'Suggest a feature', bugKindBug: 'Problem', bugKindIdea: 'Suggestion',
    ideaWhat: 'What would you like added or improved?', ideaWhy: 'How would it help you? (optional)', ideaEmpty: 'Write your suggestion first.', ideaOpened: 'WhatsApp opened with your suggestion',
    bugWhat: 'What went wrong?', bugSteps: 'What were you doing just before it? (optional)', bugAttach: 'Include the app version, the device and the current wiring (helps find the problem)',
    bugSend: 'Send on WhatsApp', bugNote: 'WhatsApp opens with your report written out; press Send there. You can attach a screenshot in WhatsApp.', bugEmpty: 'Write what went wrong first.', bugOpened: 'WhatsApp opened with your report', bugBlocked: 'WhatsApp didn’t open here (this window blocks new windows). Open the link, or copy the report and send it on WhatsApp to', bugOpenLink: 'Open WhatsApp', bugCopy: 'Copy report', bugCopied: 'Report copied',
    experiments: 'Lab sheets', viewKit: 'Kit', viewBoth: 'Both', viewScope: 'Scope', recentre: 'Centre the view (brings the kit back after zooming or dragging away)',
    leads: 'Lead colour', settings: 'Settings',
    language: 'Language', sound: 'Headphone sound', on: 'On', off: 'Off',
    saveSetup: 'Save setup…', openSetup: 'Open setup…', clearLeads: 'Remove all leads', help: 'How to use', scopeHelp: 'Oscilloscope help', zoomHint: 'Ctrl + mouse wheel zooms at the cursor. Drag the empty bench to move around; the centre button brings everything back. Keys 1, 2 and 3 switch views, F is full screen.',
    confirmClear: 'Remove every lead and probe from the kit?', badFile: 'This file is not a saved setup.', savedImage: 'Scope picture saved', savedSetup: 'Setup saved',
    guideTitle: 'Lab sheet', chooseExp: 'Choose an experiment', back: 'All experiments', prev: 'Previous', next: 'Next', showWiring: 'Show the wiring', step: 'Step', of: 'of', watch: 'Watch the video',
    videoSoon: 'Video coming soon', close: 'Close', spec: 'Specifications', use: 'Use',
    connections: 'Connections', bookSteps: 'The numbers are the step numbers in the book.',
    input: 'Input', output: 'Output', ground: 'Ground', analog: 'analog (round)', digital: 'digital (square)', notConnected: 'Nothing connected', shorted: 'Two outputs are connected together',
    leadTip: 'Drag to move it out of the way, click to highlight, double-click to remove, right-click for colour', removeLead: 'Remove lead',
    probeTip: 'Drag to move it out of the way, click to highlight, double-click to remove', removeProbe: 'Remove probe', resetShape: 'Reset shape',
    hpOff: 'Headphones unplugged. Click the headphone socket on the BUFFER to plug them in.', hpOn: 'Headphones plugged in. Sound plays through the computer speakers.', hpMuted: 'Headphones plugged in, sound is off in Settings.',
    hpUnplug: 'Click to unplug the headphones',
    colors: { red: 'Red', black: 'Black', yellow: 'Yellow', blue: 'Blue', green: 'Green' },
  },
  ar: {
    appName: 'Telecoms-Trainer 101', appSub: 'محاكي', beta: 'نسخة أولية', betaHint: 'نسخة أولية: قد لا تطابق الجهاز الحقيقي بنسبة 100%. مجانية ومخصّصة للطلاب فقط.', about: 'عن البرنامج',
    guidance: 'الإرشادات', modeHint: 'تُظهر الإرشادات أزرار المعلومات (i) وأسماء المقابس مع قراءاتها اللحظية وقيم المقابض. أوقفها لتتدرّب كما في امتحان المعمل.',
    library: 'تحميل تجربة', libHint: 'تجارب جاهزة من كتب المعمل مع رقم صفحة كل تجربة. بنقرة واحدة تُوصَّل الأسلاك ويُضبط راسم الإشارة.',
    reference: 'المرجع', refHint: 'مرجع النموذج: معادلة كل وحدة وقيمها، ومصدر كل رقم.',
    libTitle: 'تجارب جاهزة', libTab_t1: 'الترم الأول', libTab_t2: 'الترم الثاني', libTab_x: 'إضافية', libSearch: 'بحث', libLoad: 'تحميل', libExp: 'التجربة', libPart: 'الجزء',
    libSheet: 'ورقة التجربة خطوة بخطوة', libReplace: 'تحميل التجربة يزيل الأسلاك والإعدادات الموجودة الآن على الجهاز. هل تريد المتابعة؟',
    libBookNote: 'رقم الصفحة هو الرقم المطبوع على الصفحة نفسها. في ملف PDF يزيد رقم الصفحة بمقدار 2 (لأن الغلاف والفهرس يأتيان أولاً).',
    libEmonaNote: 'تجارب من كتب Emona غير موجودة في كتب المقرر. الصفحة هي المطبوعة على الصفحة (رقم التجربة-رقم الصفحة)، و“PDF” هو رقم الصفحة في ملف PDF.',
    libAdapted: 'مُعدَّلة: يستخدم كتاب DATEx مولّد الدوال في NI ELVIS، وهنا يقوم VCO بهذا الدور.', libNone: 'لا توجد تجربة تطابق البحث.',
    refTitle: 'مرجع النموذج', refIntro: 'ما بُني عليه المحاكي: معادلة كل وحدة وقيمها، ومصدر كل رقم، وما زال يحتاج إلى قياس على الجهاز الحقيقي، والاختبارات المقارنة بكتب المعمل. المرجع مكتوب بالإنجليزية لتبقى المصطلحات كما في الكتب.',
    bug: 'مشكلة أو اقتراح', bugHint: 'أبلِغ عن مشكلة أو اقترح ميزة جديدة: تصل الرسالة إلى المطوّر عبر واتساب.', bugTitle: 'الإبلاغ عن مشكلة', ideaTitle: 'اقتراح ميزة', bugKindBug: 'مشكلة', bugKindIdea: 'اقتراح',
    ideaWhat: 'ما الذي تريد إضافته أو تحسينه؟', ideaWhy: 'كيف سيساعدك ذلك؟ (اختياري)', ideaEmpty: 'اكتب اقتراحك أولاً.', ideaOpened: 'فُتح واتساب ومعه اقتراحك',
    bugWhat: 'ما المشكلة؟', bugSteps: 'ماذا كنت تفعل قبل حدوثها؟ (اختياري)', bugAttach: 'أرفق رقم النسخة ونوع الجهاز والتوصيلات الحالية (يساعد ذلك في إيجاد المشكلة)',
    bugSend: 'أرسل عبر واتساب', bugNote: 'سيفتح واتساب والرسالة مكتوبة، فاضغط إرسال هناك. ويمكنك إرفاق صورة للشاشة في واتساب.', bugEmpty: 'اكتب المشكلة أولاً.', bugOpened: 'فُتح واتساب ومعه البلاغ', bugBlocked: 'لم يُفتح واتساب هنا (هذه النافذة تمنع فتح نوافذ جديدة). افتح الرابط، أو انسخ البلاغ وأرسله عبر واتساب إلى الرقم', bugOpenLink: 'افتح واتساب', bugCopy: 'انسخ البلاغ', bugCopied: 'نُسخ البلاغ',
    experiments: 'أوراق التجارب', viewKit: 'الجهاز', viewBoth: 'كلاهما', viewScope: 'راسم الإشارة', recentre: 'توسيط العرض (يعيد الجهاز إلى منتصف الشاشة بعد التكبير أو السحب بعيداً)',
    leads: 'لون السلك', settings: 'الإعدادات',
    language: 'اللغة', sound: 'صوت السماعة', on: 'تشغيل', off: 'إيقاف',
    saveSetup: 'حفظ التوصيلات…', openSetup: 'فتح توصيلات…', clearLeads: 'إزالة كل الأسلاك', help: 'طريقة الاستخدام', scopeHelp: 'مساعدة راسم الإشارة', zoomHint: 'Ctrl مع عجلة الفأرة للتكبير عند المؤشر. اسحب في المساحة الفارغة للتحرّك، وزر التوسيط يعيد كل شيء إلى مكانه. المفاتيح 1 و 2 و 3 تبدّل طريقة العرض، والمفتاح F لملء الشاشة.',
    confirmClear: 'هل تريد إزالة كل الأسلاك والمجسّات (probes) من الجهاز؟', badFile: 'هذا الملف ليس ملف توصيلات محفوظاً.', savedImage: 'حُفظت صورة الشاشة', savedSetup: 'حُفظت التوصيلات',
    guideTitle: 'ورقة التجربة', chooseExp: 'اختر تجربة', back: 'كل التجارب', prev: 'السابق', next: 'التالي', showWiring: 'إظهار التوصيل', step: 'الخطوة', of: 'من', watch: 'شاهد الفيديو',
    videoSoon: 'الفيديو قريباً', close: 'إغلاق', spec: 'المواصفات', use: 'الاستخدام',
    connections: 'التوصيلات', bookSteps: 'الأرقام هي أرقام الخطوات في الكتاب.',
    input: 'مدخل', output: 'مخرج', ground: 'أرضي', analog: 'تماثلي (دائري)', digital: 'رقمي (مربع)', notConnected: 'غير موصول بشيء', shorted: 'يوجد مخرجان موصولان معاً',
    leadTip: 'اسحبه لإبعاده عن الطريق، وانقر لتمييزه، وانقر مرتين لإزالته، وانقر بالزر الأيمن لتغيير لونه', removeLead: 'إزالة السلك',
    probeTip: 'اسحبه لإبعاده عن الطريق، وانقر لتمييزه، وانقر مرتين لإزالته', removeProbe: 'إزالة المجسّ', resetShape: 'إعادة الشكل الأصلي',
    hpOff: 'السماعة غير موصولة. انقر على مقبس السماعة في BUFFER لتوصيلها.', hpOn: 'السماعة موصولة، والصوت يخرج من سماعات الجهاز.', hpMuted: 'السماعة موصولة، والصوت مُوقَف من الإعدادات.',
    hpUnplug: 'انقر لفصل السماعة',
    colors: { red: 'أحمر', black: 'أسود', yellow: 'أصفر', blue: 'أزرق', green: 'أخضر' },
  },
};
let lang = 'en';
try { const v = localStorage.getItem('ett.lang'); if (v === 'ar' || v === 'en') lang = v; } catch (e) { }
export const getLang = () => lang;
export function setLang(l) { lang = l; try { localStorage.setItem('ett.lang', l); } catch (e) { } document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'; }
export const t = k => STR[lang][k] ?? STR.en[k] ?? k;
export const tr = o => (o && typeof o === 'object') ? (o[lang] ?? o.en) : o;

// Arabic text with Latin words in it (module names, units, values): each Latin run goes in an LTR <bdi>, so it keeps its
// own order and doesn't scramble the sentence around it. English is returned as it is.
const RUN = /(?:[+±−-](?=\d))?[A-Za-z0-9µ](?:[A-Za-z0-9µ°±×%&+.\/:'=()\-–−]|\s(?=[A-Za-z0-9µ°±×%&+=()\/\-–−]))*/g;
function balance(r) {
  let s = r;
  for (;;) {
    const o = (s.match(/\(/g) || []).length, c = (s.match(/\)/g) || []).length;
    if (/[\s.:]$/.test(s)) s = s.slice(0, -1);
    else if ((c > o && s.endsWith(')')) || (o > c && s.endsWith('('))) s = s.slice(0, -1);
    else return s;
  }
}
export function bidi(text) {
  if (lang !== 'ar' || typeof text !== 'string') return text;
  return text.replace(RUN, r => { const k = balance(r); return `<bdi dir="ltr">${k}</bdi>${r.slice(k.length)}`; });
}
export const trb = o => bidi(tr(o));
