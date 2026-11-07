import * as esbuild from 'esbuild';
import fs from 'fs';
const r = await esbuild.build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', write: false, target: 'chrome100' });
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
