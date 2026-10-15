const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('file://'+__dirname+'/promo.html');await p.waitForTimeout(800);
const fps=30,dur=45;require('fs').mkdirSync(__dirname+'/frames',{recursive:true});
for(let i=0;i<fps*dur;i++){await p.evaluate(t=>render(t),i/fps);await p.screenshot({path:`${__dirname}/frames/f${String(i).padStart(5,'0')}.jpg`,type:'jpeg',quality:92});}
await b.close();})();
