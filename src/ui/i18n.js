// UI strings. English is the default; Arabic switches the whole interface to right-to-left.
const STR = {
  en: {
    appName: 'Telecoms-Trainer 101', appSub: 'simulator',
    guidance: 'Guidance', modeHint: 'Guidance shows the info buttons, socket names with live readings, and knob values. Turn it off to practise like the real lab exam.',
    experiments: 'Experiments', viewKit: 'Kit', viewBoth: 'Both', viewScope: 'Scope', fullscreen: 'Full screen', exitFullscreen: 'Exit full screen',
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
    experiments: 'التجارب', viewKit: 'الكيت', viewBoth: 'الاتنين', viewScope: 'الأوسيلوسكوب', fullscreen: 'ملء الشاشة', exitFullscreen: 'خروج من ملء الشاشة',
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
