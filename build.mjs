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
const r = await esbuild.build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', write: false, target: 'chrome100', plugins: [setupsPlugin], loader: { '.md': 'text' }, define: { __APP_VERSION__: JSON.stringify(pkg.version) } });
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
