import * as esbuild from 'esbuild';
import fs from 'fs';
// the ready-made experiment setups are bundled into the app so they load with one click
const setupsPlugin = { name: 'setups', setup(b) {
  b.onResolve({ filter: /^virtual:setups$/ }, () => ({ path: 'setups', namespace: 'setups' }));
  b.onLoad({ filter: /.*/, namespace: 'setups' }, () => {
    const out = {};
    for (const dir of fs.readdirSync('setups')) for (const f of fs.readdirSync(`setups/${dir}`)) if (f.endsWith('.ett.json')) out[`${dir}/${f.slice(0, -9)}`] = JSON.parse(fs.readFileSync(`setups/${dir}/${f}`, 'utf8'));
    return { contents: `export default ${JSON.stringify(out)};`, loader: 'js', watchFiles: [] };
  });
} };
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const r = await esbuild.build({ entryPoints: ['src/main.js'], bundle: true, minify: process.env.NOMIN ? false : true, format: 'iife', write: false, target: 'chrome100', plugins: [setupsPlugin], loader: { '.md': 'text' }, define: { __APP_VERSION__: JSON.stringify(pkg.version) } });
const js = r.outputFiles[0].text;
// embed fonts so the app looks the same offline
const font = (fam, file, w) => `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${fs.readFileSync(file).toString('base64')}) format('woff2');}`;
const B = 'node_modules/@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-', A = 'node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-';
const fonts = [400, 500, 600, 700].map(w => font('Barlow SC', `${B}${w}-normal.woff2`, w)).join('') + [400, 600].map(w => font('Plex Arabic', `${A}${w}-normal.woff2`, w)).join('');
let html = fs.readFileSync('src/index.html', 'utf8');
html = html.replace('/*FONTS*/', () => fonts);
html = html.replace('<script type="module" src="./main.js"></script>', () => `<script>${js.replace(/<\/script/g, '<\\/script')}</script>`);
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
fs.writeFileSync('electron/index.html', html); // the desktop app loads this copy
console.log('dist/index.html', (html.length / 1024).toFixed(0), 'KB');
// the web version (GitHub Pages, phones): same page plus what makes it installable and work offline
const web = html.replace('<head>', () => `<head>
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#2a3b40">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="ETT-101">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" type="image/png" href="icon-192.png">`).replace('</body>', () => `<script>if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));</script>\n</body>`);
fs.rmSync('dist/web', { recursive: true, force: true }); fs.mkdirSync('dist/web', { recursive: true });
fs.writeFileSync('dist/web/index.html', web);
for (const f of fs.readdirSync('web')) if (f !== 'sw.js') fs.copyFileSync(`web/${f}`, `dist/web/${f}`);
fs.writeFileSync('dist/web/sw.js', fs.readFileSync('web/sw.js', 'utf8').replace('__VERSION__', pkg.version));
console.log('dist/web/ (web version)', fs.readdirSync('dist/web').length, 'files');
