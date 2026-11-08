// UI strings. English is the default; Arabic switches the whole interface to right-to-left.
const STR = {
  en: {
    appName: 'Telecoms-Trainer 101', appSub: 'simulator',
    guidance: 'Guidance', modeHint: 'Guidance shows the info buttons, socket names with live readings, and knob values. Turn it off to practise like the real lab exam.',
    library: 'Load experiment', libHint: 'Ready-made experiments from the lab books, with the page of each one. One click wires the kit and sets the scope.',
    reference: 'Reference', refHint: 'The model reference: every module’s equation and numbers, and where each number comes from.',
    libTitle: 'Ready-made experiments', libTab_t1: 'Term 1', libTab_t2: 'Term 2', libTab_x: 'Extra', libSearch: 'Search', libLoad: 'Load', libExp: 'Exp', libPart: 'Part',
    libSheet: 'Step-by-step sheet', libReplace: 'Loading an experiment replaces the leads and settings on the kit now. Continue?',
    libBookNote: 'Page numbers are the numbers printed on the page. In the PDF file the page is 2 higher (cover and contents come first).',
    libEmonaNote: 'Experiments from the Emona manuals that are not in the course books. The page is the one printed on the page (experiment-page); “PDF” is the page in the PDF file.',
    libAdapted: 'Adapted: the DATEx uses the NI ELVIS function generator; here the VCO takes its place.', libNone: 'No experiment matches your search.',
    refTitle: 'Model reference', refIntro: 'What the simulator is built on: each module’s equation and values, where every number comes from, what still needs measuring on the real kit, and the checks against the lab books.',
    experiments: 'Lab sheets', viewKit: 'Kit', viewBoth: 'Both', viewScope: 'Scope', fullscreen: 'Full screen', exitFullscreen: 'Exit full screen',
    leads: 'Lead colour', settings: 'Settings',
    language: 'Language', sound: 'Headphone sound', on: 'On', off: 'Off',
    saveSetup: 'Save setup…', openSetup: 'Open setup…', clearLeads: 'Remove all leads', help: 'How to use', scopeHelp: 'Oscilloscope help', zoomHint: 'Ctrl + mouse wheel zooms at the cursor. Drag the empty bench to move around. Keys 1, 2 and 3 switch views.',
    confirmClear: 'Remove every lead and probe from the kit?', badFile: 'This file is not a saved setup.', savedImage: 'Scope picture saved', savedSetup: 'Setup saved',
    guideTitle: 'Lab sheet', chooseExp: 'Choose an experiment', back: 'All experiments', prev: 'Previous', next: 'Next', showWiring: 'Show the wiring', step: 'Step', of: 'of', watch: 'Watch the video',
    videoSoon: 'Video coming soon', close: 'Close', spec: 'Specifications', use: 'Use',
    input: 'Input', output: 'Output', ground: 'Ground', analog: 'analog (round)', digital: 'digital (square)', notConnected: 'Nothing connected', shorted: 'Two outputs are connected together',
    leadTip: 'Double-click to remove it, right-click to change its colour', removeLead: 'Remove lead',
    hpOff: 'Headphones unplugged. Click the headphone socket on the BUFFER to plug them in.', hpOn: 'Headphones plugged in. Sound plays through the computer speakers.', hpMuted: 'Headphones plugged in, sound is off in Settings.',
    hpUnplug: 'Click to unplug the headphones',
    colors: { red: 'Red', black: 'Black', yellow: 'Yellow', blue: 'Blue', green: 'Green' },
  },
  ar: {
    appName: 'Telecoms-Trainer 101', appSub: 'محاكي',
    guidance: 'الإرشادات', modeHint: 'الإرشادات بتظهر زرار i وأسماء المقابس وقراءتها اللحظية وقيم المقابض. اقفلها علشان تتدرب زي امتحان المعمل.',
    library: 'تحميل تجربة', libHint: 'تجارب جاهزة من كتب المعمل، ومعاها رقم الصفحة. ضغطة واحدة بتوصّل الكيت وتظبط الأوسيلوسكوب.',
    reference: 'المرجع', refHint: 'مرجع الموديل: معادلة وأرقام كل بلوك، ومصدر كل رقم.',
    libTitle: 'تجارب جاهزة', libTab_t1: 'الترم الأول', libTab_t2: 'الترم التاني', libTab_x: 'إضافية', libSearch: 'بحث', libLoad: 'تحميل', libExp: 'تجربة', libPart: 'Part',
    libSheet: 'ورقة التجربة خطوة بخطوة', libReplace: 'تحميل التجربة هيشيل التوصيلات والإعدادات اللي على الكيت دلوقتي. تكمّل؟',
    libBookNote: 'رقم الصفحة هو الرقم المكتوب على الصفحة نفسها. في ملف الـ PDF الصفحة بتزيد 2 (عشان الغلاف والفهرس في الأول).',
    libEmonaNote: 'تجارب من كتب Emona مش موجودة في كتب المادة. الصفحة هي المكتوبة على الصفحة (رقم التجربة-رقم الصفحة)، و“PDF” هي رقم الصفحة في ملف الـ PDF.',
    libAdapted: 'معدّلة: كتاب الـ DATEx بيستخدم مولّد إشارات NI ELVIS، وهنا الـ VCO بيعمل الدور ده.', libNone: 'مفيش تجربة بالاسم ده.',
    refTitle: 'مرجع الموديل', refIntro: 'الحاجات اللي المحاكي مبني عليها: معادلة وقيم كل بلوك، ومصدر كل رقم، والحاجات اللي لسه محتاجة تتقاس على الكيت الحقيقي، والاختبارات قصاد كتب المعمل. المرجع مكتوب بالإنجليزي عشان المصطلحات تفضل زي الكتب.',
    experiments: 'أوراق التجارب', viewKit: 'الكيت', viewBoth: 'الاتنين', viewScope: 'الأوسيلوسكوب', fullscreen: 'ملء الشاشة', exitFullscreen: 'خروج من ملء الشاشة',
    leads: 'لون السلك', settings: 'الإعدادات',
    language: 'اللغة', sound: 'صوت السماعة', on: 'شغال', off: 'مقفول',
    saveSetup: 'حفظ التوصيلات…', openSetup: 'فتح توصيلات…', clearLeads: 'فك كل الأسلاك', help: 'طريقة الاستخدام', scopeHelp: 'مساعدة الأوسيلوسكوب', zoomHint: 'Ctrl مع عجلة الماوس للتكبير عند المؤشر. اسحب في المساحة الفاضية علشان تتحرك. المفاتيح 1 و 2 و 3 بتبدّل العرض.',
    confirmClear: 'فك كل الأسلاك والـ probes من الكيت؟', badFile: 'الملف ده مش ملف توصيلات محفوظ.', savedImage: 'اتحفظت صورة الشاشة', savedSetup: 'اتحفظت التوصيلات',
    guideTitle: 'ورقة التجربة', chooseExp: 'اختار تجربة', back: 'كل التجارب', prev: 'السابق', next: 'التالي', showWiring: 'إظهار التوصيلة', step: 'خطوة', of: 'من', watch: 'شاهد الفيديو',
    videoSoon: 'الفيديو قريباً', close: 'إغلاق', spec: 'المواصفات', use: 'الاستخدام',
    input: 'مدخل', output: 'مخرج', ground: 'أرضي', analog: 'analog (دائري)', digital: 'digital (مربع)', notConnected: 'مش متوصل بحاجة', shorted: 'فيه مخرجين متوصلين ببعض',
    leadTip: 'دبل كليك للفك، وكليك يمين لتغيير اللون', removeLead: 'فك السلك',
    hpOff: 'السماعة مش متركبة. دوس على فتحة السماعة في BUFFER علشان تركّبها.', hpOn: 'السماعة متركبة، والصوت طالع من سماعات الجهاز.', hpMuted: 'السماعة متركبة، والصوت مقفول من الإعدادات.',
    hpUnplug: 'دوس علشان تفك السماعة',
    colors: { red: 'أحمر', black: 'أسود', yellow: 'أصفر', blue: 'أزرق', green: 'أخضر' },
  },
};
let lang = 'en';
try { const v = localStorage.getItem('ett.lang'); if (v === 'ar' || v === 'en') lang = v; } catch (e) { }
export const getLang = () => lang;
export function setLang(l) { lang = l; try { localStorage.setItem('ett.lang', l); } catch (e) { } document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'; }
export const t = k => STR[lang][k] ?? STR.en[k] ?? k;
export const tr = o => (o && typeof o === 'object') ? (o[lang] ?? o.en) : o;
