// Electron shell for the Telecoms-Trainer 101 simulator (Windows 10/11 and macOS)
const { app, BrowserWindow, shell, session, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const REPO = 'Ahmed-Atef-Tech/ETT101-Simulator';
const IS_MAC = process.platform === 'darwin';
let win = null;

function loadLinks() {
  // help-links.json next to the .exe lets the instructor add YouTube links without rebuilding
  const dirs = [process.env.PORTABLE_EXECUTABLE_DIR, path.dirname(process.execPath)].filter(Boolean);
  const candidates = [...dirs.map(d => path.join(d, 'help-links.json')), path.join(__dirname, 'help-links.json')];
  for (const p of candidates) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { } }
  return {};
}

function create() {
  // macOS needs an app menu for Cmd+Q / copy-paste; Windows gets none
  Menu.setApplicationMenu(IS_MAC ? Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }]) : null);
  const title = `Telecoms-Trainer 101 Simulator  v${app.getVersion()}`;
  win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 1100, minHeight: 650, show: false, backgroundColor: '#1d2229',
    title, icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' },
  });
  win.on('page-title-updated', e => e.preventDefault());
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(perm === 'media' || perm === 'audioCapture'));
  session.defaultSession.setPermissionCheckHandler((wc, perm) => perm === 'media' || perm === 'audioCapture');
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.type === 'keyDown' && input.key === 'F12' && input.control && input.shift) win.webContents.openDevTools({ mode: 'detach' });
  });
  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
}

// ---- automatic updates from GitHub Releases ----
// Windows: the new version downloads in the background and installs when the app closes (or on "Restart now").
// macOS: Apple only allows self-install for apps signed with a paid Apple Developer ID, so we tell the user and open the download page.
function setupUpdates() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try { ({ autoUpdater } = require('electron-updater')); } catch (e) { return; }
  autoUpdater.autoDownload = !IS_MAC;
  autoUpdater.autoInstallOnAppQuit = !IS_MAC;
  const told = new Set();
  const ask = (opts) => dialog.showMessageBox(win && !win.isDestroyed() ? win : undefined, { type: 'info', defaultId: 0, cancelId: 1, noLink: true, ...opts });

  autoUpdater.on('update-available', async info => {
    if (!IS_MAC || told.has('a' + info.version)) return;
    told.add('a' + info.version);
    const r = await ask({
      title: 'تحديث جديد / Update available',
      message: `فيه نسخة جديدة: ${info.version}\nA new version is available: ${info.version}`,
      detail: `النسخة اللي عندك: ${app.getVersion()}\nدوس "تنزيل" وهتفتح صفحة التحميل. نزّل ملف الـ dmg واسحب البرنامج لـ Applications مكان القديم.`,
      buttons: ['تنزيل / Download', 'لاحقاً / Later'],
    });
    if (r.response === 0) shell.openExternal('https://ahmed-atef-tech.github.io/ETT101-Simulator/'); // the download page; it always links the latest release
  });

  autoUpdater.on('update-downloaded', async info => {
    if (told.has('d' + info.version)) return;
    told.add('d' + info.version);
    const r = await ask({
      title: 'التحديث جاهز / Update ready',
      message: `النسخة ${info.version} اتنزّلت وجاهزة.\nVersion ${info.version} has been downloaded.`,
      detail: 'لو اخترت "لاحقاً"، هتتركب لوحدها أول ما تقفل البرنامج.\nIf you choose Later, it installs automatically when you close the app.',
      buttons: ['إعادة التشغيل الآن / Restart now', 'لاحقاً / Later'],
    });
    if (r.response === 0) setImmediate(() => autoUpdater.quitAndInstall(true, true));
  });

  autoUpdater.on('error', e => console.log('[update]', e && e.message)); // offline or no release yet: stay quiet
  const check = () => autoUpdater.checkForUpdates().catch(() => { });
  setTimeout(check, 4000);               // shortly after start
  setInterval(check, 60 * 60 * 1000);    // and every hour while it stays open
}

ipcMain.handle('ett:open', (e, url) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); });
ipcMain.on('ett:links', e => { e.returnValue = loadLinks(); });
ipcMain.on('ett:version', e => { e.returnValue = app.getVersion(); });
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => { create(); setupUpdates(); });
  app.on('window-all-closed', () => app.quit());
}
