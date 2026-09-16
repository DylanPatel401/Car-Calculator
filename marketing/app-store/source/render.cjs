// Reproducible, editable artwork. Captured app pixels are embedded unchanged.
const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require('../tools/node_modules/@resvg/resvg-js');
const { PNG } = require('../tools/node_modules/pngjs');
const root = path.resolve(__dirname, '..');
const data = p => {
  const bytes=fs.readFileSync(path.join(root,p));
  const mime=bytes[0]===0xff&&bytes[1]===0xd8?'image/jpeg':'image/png';
  return `data:${mime};base64,${bytes.toString('base64')}`;
};
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const copy = [
  { id:'01', slug:'full-picture', title:['Your next car.','The full picture.'], sub:['See the monthly cost, cash left over,','and the savings you keep.'] },
  { id:'02', slug:'ownership-cost', title:['More than','monthly payments.'], sub:['Fuel. Insurance. Maintenance.','Understand where every dollar goes.'] },
  { id:'03', slug:'safety-cushion', title:['Keep your safety','cushion in view.'], sub:['Set your reserve target.','See what remains after the purchase.'], dark:true },
  { id:'04', slug:'compare-options', title:['Compare the cars.','See the trade-offs.'], sub:['Put your options side by side.','The decision stays yours.'] },
  { id:'05', slug:'what-if', title:['A little “what if”.','A lot more clarity.'], sub:['Try a new price, rate, or loan term.','Keep your original option intact.'] },
  { id:'06', slug:'purchase-timing', title:['Buy now.','Or plan for later.'], sub:['Explore what waiting changes—','from your payment to your cash.'], dark:true },
];
function render(svg, file, width) {
  const result = new Resvg(svg, {font:{loadSystemFonts:true,defaultFontFamily:'Segoe UI'}, ...(width?{fitTo:{mode:'width',value:width}}:{})}).render();
  const png = PNG.sync.read(result.asPng());
  fs.writeFileSync(file, PNG.sync.write(png,{colorType:2,inputColorType:6}));
}
function board(c, device) {
  const pad=device==='ipad', W=pad?2064:1320,H=pad?2752:2868;
  const ink=c.dark?'#F6F5F0':'#14291F',muted=c.dark?'#B9D3C4':'#60736A',accent=c.dark?'#80DCAD':'#146C50';
  const x=pad?140:100, font=pad?132:108, line=pad?142:122;
  const sw=pad?1464:904, sh=sw*(pad?1376/1032:956/440), sx=(W-sw)/2, sy=pad?705:800;
  const screen=data(`captures/${device}-${c.id}.png`);
  const lines=(values,y,size,color,weight=400,step=size*1.35)=>values.map((s,i)=>`<text x="${x}" y="${y+i*step}" font-size="${size}" font-weight="${weight}" fill="${color}">${escape(s)}</text>`).join('');
  const bg=c.dark?`<rect width="${W}" height="${H}" fill="#123B2C"/><path d="M-300 ${H}C500 ${H-600},${W+400} ${H-200},${W+200} ${H-1450}" fill="none" stroke="#1B503B" stroke-width="260"/><path d="M-300 ${H+210}C500 ${H-390},${W+500} ${H+10},${W+320} ${H-1250}" fill="none" stroke="#296449" stroke-width="70"/>`:`<rect width="${W}" height="${H}" fill="#F6F5F0"/><image href="${data('source/background.png')}" width="${W}" height="${H}" preserveAspectRatio="none"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><clipPath id="screen"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${pad?32:58}"/></clipPath><filter id="shadow" x="-40%" y="-20%" width="180%" height="160%"><feDropShadow dx="0" dy="28" stdDeviation="38" flood-color="#092C1E" flood-opacity=".22"/></filter></defs>${bg}<g font-family="Segoe UI"><rect x="${x}" y="116" width="38" height="7" rx="3" fill="${accent}"/><text x="${x+60}" y="132" font-size="28" font-weight="600" letter-spacing="4" fill="${accent}">CAR CALCULATOR</text><text x="${W-x}" y="132" text-anchor="end" font-size="24" fill="${muted}">${c.id} / 06</text>${lines(c.title,pad?315:315,font,ink,700,line)}${lines(c.sub,pad?580:590,pad?40:37,muted,400,pad?56:52)}<rect x="${sx-16}" y="${sy-16}" width="${sw+32}" height="${sh+32}" rx="${pad?46:72}" fill="#233B30" filter="url(#shadow)"/><rect x="${sx-7}" y="${sy-7}" width="${sw+14}" height="${sh+14}" rx="${pad?38:65}" fill="#F6F5F0"/><image href="${screen}" x="${sx}" y="${sy}" width="${sw}" height="${sh}" preserveAspectRatio="none" clip-path="url(#screen)"/><text x="${W/2}" y="${H-38}" text-anchor="middle" font-size="21" letter-spacing="2" fill="${muted}">YOUR NUMBERS. YOUR NEXT MOVE.</text></g></svg>`;
}
const outputs=[];
for(const device of ['iphone','ipad']) {
  fs.mkdirSync(path.join(root,device),{recursive:true});
  for(const c of copy.filter(c=>device==='iphone'||['01','04','06'].includes(c.id))) {
    const svg=board(c,device), base=`${device}/${c.id}-${c.slug}`;
    fs.writeFileSync(path.join(root,base+'.svg'),svg);
    render(svg,path.join(root,base+'.png'));
    outputs.push({device,file:base+'.png',...c});
  }
}
const phones=outputs.filter(o=>o.device==='iphone');
const sheet=`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1460"><rect width="1800" height="1460" fill="#E5E9E1"/><g font-family="Segoe UI" fill="#14291F"><text x="48" y="65" font-size="32" font-weight="700">Car Calculator / App Store artwork</text><text x="48" y="106" font-size="21">Web-preview captures • Six phone compositions • Three matching iPad compositions</text>${phones.map((o,i)=>`<image href="${data(o.file)}" x="${48+(i%3)*582}" y="${145+Math.floor(i/3)*645}" width="270" height="586"/><text x="${340+(i%3)*582}" y="${215+Math.floor(i/3)*645}" font-size="26" font-weight="700">${o.id}</text>${o.title.map((s,j)=>`<text x="${340+(i%3)*582}" y="${263+j*29+Math.floor(i/3)*645}" font-size="20">${escape(s)}</text>`).join('')}`).join('')}</g></svg>`;
render(sheet,path.join(root,'preview.png'));
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({captureType:'Actual app web preview; native iOS capture pending',outputs},null,2));
console.log(`Rendered ${outputs.length} RGB PNGs and preview.png`);
