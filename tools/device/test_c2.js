const {execFileSync}=require('child_process'),fs=require('fs'),assert=require('assert'),{connect,pause}=require('../cdp');
const adb='/home/xatabihc/Android/Sdk/platform-tools/adb',run=(...a)=>execFileSync(adb,a,{encoding:'utf8',timeout:20000});
(async()=>{
 run('shell','input','keyevent','KEYCODE_WAKEUP');run('shell','wm','dismiss-keyguard');run('shell','am','start','-n','com.codementor.offline/.MainActivity');await pause(500);
 const pid=run('shell','pidof','com.codementor.offline').trim().split(' ')[0],port=run('forward','tcp:0','localabstract:webview_devtools_remote_'+pid).trim();
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json')).json(),c=await connect(targets.find(t=>t.type==='page').webSocketDebuggerUrl),ev=c.evaluate;
 const folder='.test-tmp/samsung-c2';fs.mkdirSync(folder,{recursive:true});
 try{
  for(let i=0;i<100;i++){if(await ev("document.querySelectorAll('#courses button').length===3"))break;await pause(100)}
  assert(await ev("document.querySelectorAll('#courses button').length===3"),'WebView did not load');
  const original=await ev('JSON.parse(AndroidBridge.loadProgress())');
  await ev("document.querySelectorAll('#courses button')[2].click();document.querySelector('[data-lesson-id=st-c2-01]').click();document.querySelector('.answer-area input').scrollIntoView({block:'center'})");await pause(200);
  const old=await ev("document.querySelector('.answer-area input').value"),rect=await ev("(()=>{const r=document.querySelector('.answer-area input').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,dpr:devicePixelRatio}})()");
  try{
   run('shell','input','tap',String(Math.round(rect.x*rect.dpr)),String(Math.round((rect.y+24)*rect.dpr)));await pause(300);
   assert(await ev("document.activeElement===document.querySelector('.answer-area input')"),'Answer input not focused');
   await ev("document.querySelector('.answer-area input').select()");run('shell','input','text','42');await pause(200);
   assert.equal(await ev("document.querySelector('.answer-area input').value"),'42','Native input text missing');
   assert.equal(await ev("JSON.parse(localStorage.getItem('codementor-unified-v1')).records['st-c2-01:e1'].draft"),'42','Answer was not saved');
   await ev("Array.from(document.querySelectorAll('#mathPractice button')).find(b=>b.textContent==='Проверить ответ').scrollIntoView({block:'center'})");await pause(150);
   assert(await ev("(()=>{const b=Array.from(document.querySelectorAll('#mathPractice button')).find(b=>b.textContent==='Проверить ответ'),r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.top>=0&&r.bottom<=innerHeight&&(hit===b||b.contains(hit))})()"),'Answer check button obscured by IME/header');
  }finally{await ev(`{const input=document.querySelector('.answer-area input');input.value=${JSON.stringify(old)};input.dispatchEvent(new Event('input'))}`);run('shell','input','keyevent','4');await pause(600)}
  await ev("document.querySelectorAll('#mathPractice details').forEach(d=>d.open=true);document.querySelector('[aria-label=\"Среднее μ\"]').scrollIntoView({block:'center'})");await pause(150);
  const mu=await ev("document.querySelector('[aria-label=\"Среднее μ\"]').value"),before=await ev("document.querySelector('#mathPractice svg polyline').getAttribute('points')");
  const r=await ev("(()=>{const r=document.querySelector('[aria-label=\"Среднее μ\"]').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,dpr:devicePixelRatio}})()");
  try{
   const y=String(Math.round((r.y+r.h/2+24)*r.dpr));run('shell','input','swipe',String(Math.round((r.x+r.w*.3)*r.dpr)),y,String(Math.round((r.x+r.w*.8)*r.dpr)),y,'250');await pause(150);
   if(await ev("document.querySelector('#mathPractice svg polyline').getAttribute('points')")===before){run('shell','input','tap',String(Math.round((r.x+r.w*.85)*r.dpr)),y);await pause(200)}assert.notEqual(await ev("document.querySelector('#mathPractice svg polyline').getAttribute('points')"),before,'Normal curve did not respond to real gesture');
  }finally{await ev(`{const mu=document.querySelector('[aria-label="Среднее μ"]');mu.value=${JSON.stringify(mu)};mu.dispatchEvent(new Event('input'))}`)}
  assert.equal(await ev("document.querySelectorAll('#mathPractice svg').length"),2,'Normal/regression charts missing');
  await ev("document.getElementById('exportQuick').scrollIntoView({block:'end'})");assert(await ev('document.documentElement.scrollWidth<=innerWidth+1'));
  const after=await ev('JSON.parse(AndroidBridge.loadProgress())');for(const [id,r] of Object.entries(original.records)){const now=after.records[id];assert(now&&now.completed===r.completed&&now.attempts===r.attempts&&now.hint_level===r.hint_level,'Progress changed '+id);if(r.draft!==null)assert.equal(now.draft,r.draft,'Draft changed '+id)}
  fs.writeFileSync(folder+'/report.json',JSON.stringify({model:run('shell','getprop','ro.product.model').trim(),nativeAnswerInput:true,draftPersisted:true,originalInputRestored:true,keyboardButtonHitTest:true,normalCurveNativeGesture:true,charts:2,noHorizontalOverflow:true,priorRecordsPreserved:Object.keys(original.records).length},null,2));
  console.log('PASS Samsung C2: native answer input/restore, IME button hit-test, normal curve native gesture, 2 graphs, '+Object.keys(original.records).length+' records preserved');
 }finally{c.close();run('forward','--remove','tcp:'+port)}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
