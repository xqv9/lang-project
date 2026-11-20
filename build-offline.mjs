import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const dist = new URL('./dist/', import.meta.url);
const read = name => readFileSync(new URL(name, dist), 'utf8');
const assets = {};
for (const name of readdirSync(new URL('media/', dist))) {
  const type = name.endsWith('.jpg') ? 'image/jpeg' : 'video/webm';
  const file = readFileSync(new URL('media/' + name, dist));
  assets['media/' + name] = 'data:' + type + ';base64,' + file.toString('base64');
}

const app = read('app.js')
  .replace("name=>'media/'+name+'.jpg'", "name=>embedded['media/'+name+'.jpg']")
  .replace('src="media/station.webm"', 'src="\'+embedded[\'media/station.webm\']+\'"');
const font = readFileSync(new URL('fonts/Huninn-Regular.ttf', dist)).toString('base64');
const css = read('app.css').replace('fonts/Huninn-Regular.ttf', 'data:font/ttf;base64,' + font);
const html = read('index.html')
  .replace('<link rel="stylesheet" href="app.css">', () =>
    '<style>/*\n' + read('fonts/OFL.txt') + '\n*/\n' + css + '</style>')
  .replace(/<script defer src="(?:model|app)\.js"><\/script>/g, '')
  .replace('</body>', () => '<script>const embedded=' + JSON.stringify(assets) + ';<\/script>\n<script>' +
    read('model.js') + '<\/script>\n<script>' + app + '<\/script>\n</body>');
writeFileSync(new URL('../PawChoice_評審Demo.html', import.meta.url), html);
