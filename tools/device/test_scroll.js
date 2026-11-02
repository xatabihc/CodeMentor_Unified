/* Real ADB swipes + real Samsung IME. Never clears data or seeds completion. */
const {execFileSync}=require('child_process'),fs=require('fs'),assert=require('assert'),{connect,pause}=require('../cdp');
const adb='/home/xatabihc/Android/Sdk/platform-tools/adb';
const run=(...args)=>execFileSync(adb,args,{encoding:'utf8',timeout:20000});
(async()=>{
 run('shell','am','start','-n','com.codementor.offline/.MainActivity');await pause(800);
 const pid=run('shell','pidof','com.codementor.offline').trim().split(' ')[0];
 const port=run('forward','tcp:0','localabstract:webview_devtools_remote_'+pid).trim();
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json')).json();const c=await connect(targets.find(t=>t.type==='page').webSocketDebuggerUrl),ev=c.evaluate;
 const folder='.test-tmp/samsung-scroll';fs.mkdirSync(folder,{recursive:true});const results=[];
 try{
  await c.send('Page.enable');
  for(let i=0;i<100;i++){if(await ev("document.querySelectorAll('#courses button').length===3"))break;await pause(100)}
  assert(await ev("document.querySelectorAll('#courses button').length===3"),'WebView did not finish loading: '+await ev('location.href')); 
  const original=await ev('JSON.parse(AndroidBridge.loadProgress())'); // Kept private; never printed.
  const model=run('shell','getprop','ro.product.model').trim();
  const bounds=await ev('({w:innerWidth,h:innerHeight,dpr:devicePixelRatio})');
  const size=run('shell','wm','size').match(/Physical size: (\d+)x(\d+)/);assert(size,'Unknown screen size');const screenW=+size[1],screenH=+size[2];
  for(const [course,track,lesson] of [[0,'path','path01'],[0,'python','py01'],[0,'mooc',null],[0,'debug',null],[0,'projects',null],[0,'linux',null],[0,'sql',null],[0,'advanced',null],[1,'linear-algebra','la-foundation-02'],[2,'statistics','st-foundation-01'],[1,'linear-algebra','la-b2-05'],[1,'linear-algebra','la-b2-14'],[1,'linear-algebra','la-b2-19'],[1,'linear-algebra','la-b2-21']]){
   await ev(`document.querySelectorAll('#courses button')[${course}].click();document.querySelector('[data-track="${track}"]').click();${lesson?`document.querySelector('[data-lesson-id="${lesson}"]').click();`:''}if(${course}===2){document.querySelector('#mathPractice details').open=true;const bins=document.querySelector('#mathPractice input[type=range]');bins.value=20;bins.dispatchEvent(new Event('input'));}scrollTo(0,0)`);await pause(250);
   for(let i=0;i<18;i++){run('shell','input','swipe',String(Math.round(screenW*.9)),String(Math.round(screenH*.8)),String(Math.round(screenW*.9)),String(Math.round(screenH*.25)),'180');await pause(80);if(await ev("document.getElementById('exportQuick').getBoundingClientRect().bottom<=innerHeight"))break;}
   const reached=await ev("(()=>{const r=document.getElementById('exportQuick').getBoundingClientRect();return scrollY>0&&r.top>=0&&r.bottom<=innerHeight})()");if(!reached){const shot=await c.send('Page.captureScreenshot');fs.writeFileSync(folder+'/failure.png',Buffer.from(shot.data,'base64'));console.log(await ev('({height:innerHeight,width:innerWidth,y:scrollY,root:document.scrollingElement.scrollHeight,nav:document.documentElement.className})'));fs.writeFileSync(folder+'/native-failure.png',execFileSync(adb,['exec-out','screencap','-p']));}assert(reached,'Real swipes did not reach end of '+lesson);
   assert(await ev('document.documentElement.scrollWidth<=innerWidth+1'),'Page overflows');
   results.push({track,lesson,realSwipes:true,lastControlReachable:true});console.log('PASS real swipes: '+track+(lesson?' / '+lesson:''));
  }
  // Independent code scrolling on the real device; no synthetic lesson completions.
  await ev("document.querySelectorAll('#courses button')[0].click();document.querySelector('[data-track=python]').click();document.getElementById('editor').scrollIntoView({block:'center'})");
  const codeValue=await ev("document.getElementById('editor').value");
  try{
   await ev("document.getElementById('editor').value=Array.from({length:250},(_,i)=>'# строка '+i).join('\\n');document.getElementById('editor').scrollTop=0");
   const codeRect=await ev("document.getElementById('editor').getBoundingClientRect().toJSON()");
   const x=Math.round((codeRect.x+codeRect.width/2)*bounds.dpr),bottom=Math.round((codeRect.bottom-25+24)*bounds.dpr),top=Math.round((codeRect.top+25+24)*bounds.dpr);
   run('shell','input','swipe',String(x),String(bottom),String(x),String(top),'250');await pause(150);
   assert(await ev("document.getElementById('editor').scrollTop>0"),'Long editor did not scroll independently');
  }finally{await ev('document.getElementById("editor").value='+JSON.stringify(codeValue))}
  // Horizontal scrolling inside a temporarily widened display table does not alter the saved matrix.
  await ev("document.querySelectorAll('#courses button')[1].click();document.querySelector('[data-lesson-id=la-foundation-02]').click();const t=document.querySelector('.matrix-table');t.style.minWidth='1200px';t.scrollIntoView({block:'center'})");
  const matrixRect=await ev("document.querySelector('.matrix-scroll').getBoundingClientRect().toJSON()");
  const my=Math.round((matrixRect.top+matrixRect.height/2+24)*bounds.dpr);
  run('shell','input','swipe',String(Math.round(screenW*.8)),String(my),String(Math.round(screenW*.2)),String(my),'250');await pause(150);
  assert(await ev("document.querySelector('.matrix-scroll').scrollLeft>0"),'Matrix did not scroll horizontally');
  assert(await ev('document.documentElement.scrollWidth<=innerWidth+1'));
  // Focus through Android's actual touch input to request the real on-screen keyboard.
  await ev("document.querySelectorAll('#courses button')[0].click();document.querySelector('[data-lesson-id=path01]').click();document.getElementById('editor').scrollIntoView({block:'center'})");await pause(200);
  const rect=await ev("(()=>{const r=document.getElementById('editor').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+30}})()");
  // WebView fills the safe native container; map CSS coordinates to screen including top bar inset.
  const shot=await c.send('Page.captureScreenshot');fs.writeFileSync(folder+'/before-keyboard.png',Buffer.from(shot.data,'base64'));
  const dpr=bounds.dpr,topOffset=screenH-bounds.h*dpr; // Top+bottom system bars; use actual UI focus via DevTools then native tap.
  const nativeOffset=await ev('screen.height-innerHeight');
  run('shell','input','tap',String(Math.round(rect.x*dpr)),String(Math.round(rect.y*dpr+24*dpr)));await pause(500);
  let focused=await ev("document.activeElement.id==='editor'");
  if(!focused){await ev("document.getElementById('editor').focus()");run('shell','input','tap',String(Math.round(rect.x*dpr)),String(Math.round(rect.y*dpr+24*dpr)));await pause(500)}
  const ime=run('shell','dumpsys','input_method');assert(/mInputShown=true|isInputViewShown=true|mIsInputViewShown=true/.test(ime),'Real IME was not shown');
  assert(await ev("document.activeElement.id==='editor'"),'Editor lost focus');
  const viewport=await ev('({h:innerHeight,v:visualViewport.height,y:scrollY,rect:document.getElementById("editor").getBoundingClientRect().toJSON()})');
  assert(viewport.h<bounds.h,'Native viewport did not resize for IME');
  assert(viewport.rect.top<viewport.h&&viewport.rect.bottom>0,'Editor hidden behind IME');
  await ev("document.getElementById('runBtn').scrollIntoView({block:'center'})");await pause(150);
  assert(await ev("(()=>{const r=document.getElementById('runBtn').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()"),'Check button unreachable with IME');
  const keyboard=await c.send('Page.captureScreenshot');fs.writeFileSync(folder+'/keyboard.png',Buffer.from(keyboard.data,'base64'));
  run('shell','input','keyevent','4');await pause(300);
  await ev("document.getElementById('openNav').click()");await pause(250);
  for(let i=0;i<8;i++)run('shell','input','swipe',String(Math.round(screenW*.4)),String(Math.round(screenH*.75)),String(Math.round(screenW*.4)),String(Math.round(screenH*.25)),'150');
  assert(await ev("document.getElementById('sidebar').scrollTop>0"),'Menu not touch scrollable');
  await ev("document.getElementById('closeNav').click()");
  const saved=await ev('JSON.parse(AndroidBridge.loadProgress())');
  for(const [id,r] of Object.entries(original.records)){
   const now=saved.records[id];assert(now&&now.completed===r.completed&&now.attempts===r.attempts&&now.hint_level===r.hint_level,'Progress changed: '+id);
   if(r.draft!==null)assert.equal(now.draft,r.draft,'Draft changed: '+id);
  }
  const report={model,bounds,results,realKeyboard:{shown:true,resized:true,inputVisible:true,checkButtonReachable:true},menuRealSwipes:true,editorRealScroll:true,matrixRealHorizontalScroll:true,originalRecordsPreserved:Object.keys(original.records).length};
  fs.writeFileSync(folder+'/report.json',JSON.stringify(report,null,2));console.log('PASS Samsung '+model+': all sections and B2 panels, real swipes, editor/matrix scroll, real IME, menu and '+Object.keys(original.records).length+' prior records preserved');
 }finally{c.close();run('forward','--remove','tcp:'+port)}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
