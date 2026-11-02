const assert=require('assert'),fs=require('fs'),{browser,pause}=require('./cdp');const refs=JSON.parse(fs.readFileSync(0,'utf8'));
(async()=>{const c=await browser(),ev=c.evaluate;try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,mobile:true,deviceScaleFactor:1});
 await c.send('Page.navigate',{url:c.base});for(let i=0;i<100;i++){if(await ev("!!document.querySelector('#courses button')"))break;await pause(30)}
 await ev("document.querySelector('[data-track=python-data]').click();document.querySelector('[data-lesson-id=py-data-02]').click();document.getElementById('runBtn').click()");
 assert(await ev("document.querySelector('#result .result-title').textContent.includes('Сначала предыдущий урок')"));
 assert.equal(await ev("JSON.parse(localStorage.getItem('codementor-unified-v1')).records['py-data-02']?.attempts||0"),0);
 for(const [id,solutions] of Object.entries(refs)){
  await ev(`document.querySelector('[data-lesson-id="${id}"]').click()`);
  for(const code of solutions){
   await ev(`document.getElementById('editor').value=${JSON.stringify(code)};document.getElementById('editor').dispatchEvent(new Event('input'));document.getElementById('runBtn').click()`);
   for(let i=0;i<100;i++){if(await ev("!document.getElementById('runBtn').disabled"))break;await pause(20)}
   assert(await ev("document.querySelector('#result .result-title').textContent.startsWith('Правильно')"),id+' behavior failed in actual Worker');
  }
  assert(await ev(`JSON.parse(localStorage.getItem('codementor-unified-v1')).records['${id}'].completed===1`));
  assert(await ev('document.documentElement.scrollWidth<=innerWidth+1'));
 }
 console.log('PASS D1 actual browser Worker: 6 lessons, 12 canonical/alternative solutions, progression and saved completion');
 }finally{c.stop()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
