/* Actual layout, wheel and touch tests through CDP; not an Android IME test. */
const assert=require('assert'),fs=require('fs'),{execFileSync}=require('child_process'),{browser,pause}=require('./cdp');
(async()=>{
 const c=await browser(),results=[];const ev=c.evaluate;
 try{
  const baseline=process.argv.includes('--baseline')?execFileSync('git',['show','58e4449:www/style.css'],{encoding:'utf8'}):null;
  for(const [width,height] of [[320,640],[360,800],[390,844],[412,915],[768,1024]]){
   await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await c.send('Emulation.setTouchEmulationEnabled',{enabled:true});
   await c.send('Page.navigate',{url:c.base});
   for(let i=0;i<100;i++){if(await ev("!!document.querySelector('#courses button')"))break;await pause(30)}
   if(baseline)await ev(`document.querySelector('link[rel=stylesheet]').disabled=true;{const s=document.createElement('style');s.textContent=${JSON.stringify(baseline)};document.head.append(s)}`);
   await ev(`{const key='codementor-unified-v1',data=JSON.parse(localStorage.getItem(key)||'null')||{version:1,records:{}};for(const l of [...CODEMENTOR_LESSONS,...CODEMENTOR_MATH_LESSONS])data.records[l.id]={draft:null,completed:1,attempts:1,hint_level:0,completed_at:null};data.track='path';data.course='python';localStorage.setItem(key,JSON.stringify(data))}`);
   await c.send('Page.reload');await pause(200);
   if(baseline)await ev(`document.querySelector('link[rel=stylesheet]').disabled=true;{const s=document.createElement('style');s.textContent=${JSON.stringify(baseline)};document.head.append(s)}`);
   async function reachable(selector){
    const rect=await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {top:r.top,bottom:r.bottom,visible:r.top>=0&&r.bottom<=innerHeight,hit:hit===e||e.contains(hit)}})()`);
    assert(rect.visible&&rect.hit,`${width}: unreachable ${selector} ${JSON.stringify(rect)}`);
   }
   async function bottom(){for(let i=0;i<6;i++){await c.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:8,y:height-40,deltaX:0,deltaY:30000});await pause(150);if(await ev("document.getElementById('exportQuick').getBoundingClientRect().bottom<=innerHeight"))break;}await reachable('#exportQuick');}
   // All legacy types, math grid and statistics lab use the same document scroller.
   for(const track of ['path','python','mooc','debug','projects','linux','sql','advanced','python-data','linear-algebra','statistics']){
    await ev(`document.querySelectorAll('#courses button')[${track==='linear-algebra'?1:track==='statistics'?2:0}].click()`);
    await ev(`document.querySelector('[data-track="${track}"]').click()`);
    if(track==='linear-algebra')await ev(`document.querySelector('[data-lesson-id="la-foundation-02"]').click()`);
    if(track==='statistics')await ev(`document.querySelector('#mathPractice details').open=true`);
    try{await bottom()}catch(e){throw Error(track+': '+e.message+' '+JSON.stringify(await ev('({y:scrollY,h:innerHeight,root:document.scrollingElement.scrollHeight,element:document.elementFromPoint(8,innerHeight-40)?.outerHTML.slice(0,100)})')))};assert(await ev('document.documentElement.scrollWidth<=innerWidth+1'),`${width}/${track}: horizontal page overflow`);
    // A real touch gesture must also move the document, not get trapped in panels.
    await ev('scrollTo(0,0)');await pause(80);
    await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:8,y:height-80}]});
    for(let step=1;step<=12;step++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:8,y:height-80-step*25}]});await pause(16)}
    await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(80);
    assert(await ev('scrollY>0'),`${width}/${track}: touch did not scroll page`);
   }
   await ev("document.querySelectorAll('#courses button')[0].click();document.querySelector('[data-track=python]').click();document.getElementById('openNav').click()");
   await pause(250);
   // Single menu scroller must expose the final lesson and footer.
   await ev("document.getElementById('sidebar').scrollTop=100000");await reachable('#lessonList button:last-child');
   await ev("document.getElementById('closeNav').click()");assert(!await ev("document.documentElement.classList.contains('nav-open')"));
   await bottom();
   await ev("document.getElementById('settingsBtn').click();const d=document.getElementById('settingsDialog');const p=document.createElement('p');p.textContent='Длинные настройки '.repeat(400);d.querySelector('.modal').insertBefore(p,document.getElementById('storageStatus'));d.scrollTop=100000");await reachable('#storageStatus');
   await ev("document.getElementById('settingsDialog').scrollTop=0");await reachable('#closeSettings');await ev("document.getElementById('closeSettings').click()");
   // Code keeps its own scroll and caret across a viewport shrink (keyboard geometry).
   await ev("document.getElementById('editor').value=Array.from({length:300},(_,i)=>'# строка '+i).join('\\n');document.getElementById('editor').dispatchEvent(new Event('input'));document.getElementById('editor').scrollIntoView({block:'center'});document.getElementById('editor').focus()");
   await c.send('Emulation.setDeviceMetricsOverride',{width,height:300,deviceScaleFactor:1,mobile:true});await pause(80);
   assert(await ev("document.activeElement.id==='editor'"));
   await ev("document.getElementById('editor').scrollTop=100000");assert(await ev("document.getElementById('editor').scrollTop>0"));
   await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
   await ev("document.querySelectorAll('#courses button')[1].click();document.querySelector('[data-lesson-id=la-foundation-02]').click();const s=document.querySelectorAll('#mathPractice select');for(const v of s){v.value=8;v.dispatchEvent(new Event('change'))}document.querySelector('.matrix-scroll').scrollLeft=100000");
   assert(await ev("document.querySelector('.matrix-scroll').scrollLeft>0"));assert(await ev('document.documentElement.scrollWidth<=innerWidth+1'));
   // Lesson switches start at the top, without clearing Python drafts.
   await ev("document.querySelectorAll('#courses button')[0].click();document.querySelector('[data-track=python]').click()");assert.equal(await ev('scrollY'),0);
   assert(await ev("JSON.parse(localStorage.getItem('codementor-unified-v1')).records.py01.draft.includes('строка 299')"));
   results.push({width,height,tracks:11,wheel:true,touch:true,menu:true,dialog:true,keyboardGeometry:true,codeScroll:true,matrixScroll:true,progress:true});console.log('PASS scroll '+width+'×'+height);
  }
  fs.writeFileSync('.test-tmp/scroll-results.json',JSON.stringify(results,null,2));
 }finally{c.stop()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
