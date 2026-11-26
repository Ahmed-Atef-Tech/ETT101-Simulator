// Stamp the app icon and version info into the Windows exe (pure JS, no Wine needed)
const ResEdit = require('resedit');
const fs = require('fs'), path = require('path');
// Electron (MIT) and Chromium ask that their licence texts travel with every copy. electron-builder leaves them next to
// the Windows exe but not inside the Mac app, so they are taken from the Electron download (same cache electron-builder
// uses) and put where they are missing: next to the exe, or in the Mac app's Resources folder.
async function licences(ctx) {
  const dest = ctx.electronPlatformName === 'darwin' ? path.join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.app`, 'Contents', 'Resources') : ctx.appOutDir;
  const want = [['LICENSE', 'LICENSE.electron.txt'], ['LICENSES.chromium.html', 'LICENSES.chromium.html']].filter(([, to]) => !fs.existsSync(path.join(dest, to)));
  if (!want.length) return;
  const { downloadArtifact } = require('@electron/get'), yauzl = require('yauzl'), { Arch } = require('builder-util');
  const zip = await downloadArtifact({ version: require('electron/package.json').version, platform: ctx.electronPlatformName, arch: Arch[ctx.arch], artifactName: 'electron' });
  await new Promise((ok, fail) => yauzl.open(zip, { lazyEntries: true }, (e, z) => {
    if (e) return fail(e); let left = want.length;
    z.on('entry', en => { const w = want.find(([from]) => from === en.fileName); if (!w) return z.readEntry();
      z.openReadStream(en, (e2, rs) => { if (e2) return fail(e2); const out = fs.createWriteStream(path.join(dest, w[1])); rs.pipe(out); out.on('finish', () => { if (--left === 0) { z.close(); ok(); } else z.readEntry(); }); }); });
    z.on('end', () => left ? fail(new Error('licence files not found in ' + zip)) : ok()); z.readEntry(); }));
  console.log('  • added', want.map(w => w[1]).join(' and '), 'to', path.relative(ctx.appOutDir, dest) || '.');
}
exports.default = async function (ctx) {
  await licences(ctx);
  if (ctx.electronPlatformName !== 'win32') return;
  const exe = path.join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.exe`);
  const data = fs.readFileSync(exe);
  const pe = ResEdit.NtExecutable.from(data, { ignoreCert: true });
  const res = ResEdit.NtExecutableResource.from(pe);
  const ico = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(__dirname, '../electron/icon.ico')));
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const gid = groups.length ? groups[0].id : 1, lang = groups.length ? groups[0].lang : 1033;
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, gid, lang, ico.icons.map(i => i.data));
  const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0];
  const v = ctx.packager.appInfo.version.split('.').map(Number);
  vi.setFileVersion(v[0], v[1], v[2], 0); vi.setProductVersion(v[0], v[1], v[2], 0);
  const L = { lang: 1033, codepage: 1200 };
  vi.setStringValues(L, { ProductName: 'Telecoms-Trainer 101 Simulator', FileDescription: 'Telecoms-Trainer 101 Simulator', CompanyName: 'Ahmed Atef', OriginalFilename: path.basename(exe), InternalName: 'ETT101Sim', LegalCopyright: '' });
  vi.outputToResourceEntries(res.entries);
  res.outputResource(pe);
  fs.writeFileSync(exe, Buffer.from(pe.generate()));
  console.log('  • stamped icon + version info into', path.basename(exe));
};
