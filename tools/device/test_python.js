/* Trusted references in the actual WebView Worker, without UI progress mutations. */
const fs=require('fs'),assert=require('assert'),{execFileSync}=require('child_process'),{connect}=require('../cdp');
const refs=JSON.parse(fs.readFileSync(0,'utf8')),adb='/home/xatabihc/Android/Sdk/platform-tools/adb',run=(...a)=>execFileSync(adb,a,{encoding:'utf8',timeout:20000});
(async()=>{const pid=run('shell','pidof','com.codementor.offline').trim().split(' ')[0],port=run('forward','tcp:0','localabstract:webview_devtools_remote_'+pid).trim();
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json')).json(),c=await connect(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 try{const before=await c.evaluate('AndroidBridge.loadProgress()');const checked=await c.evaluate(`(async()=>{const refs=${JSON.stringify(refs)};let checked=0;for(const [id,codes] of Object.entries(refs)){const lesson=CODEMENTOR_LESSONS.find(l=>l.id===id);if(!lesson)throw Error('Missing '+id);for(const code of codes){await new Promise((resolve,reject)=>{const w=new Worker('worker.js'),timer=setTimeout(()=>{w.terminate();reject(Error('Timeout '+id))},2500);w.onmessage=e=>{clearTimeout(timer);w.terminate();e.data.ok?resolve():reject(Error(id+': '+JSON.stringify(e.data)))};w.onerror=()=>{clearTimeout(timer);w.terminate();reject(Error('Worker error '+id))};w.postMessage({id,code,cases:lesson.cases})});checked++}}return checked})()`);
 const after=await c.evaluate('AndroidBridge.loadProgress()');assert.deepEqual(JSON.parse(after).records,JSON.parse(before).records);assert.equal(checked,12);
 fs.writeFileSync('.test-tmp/samsung-python.json',JSON.stringify({trustedSolutions:checked,lessons:6,actualWebViewWorker:true,progressUnchanged:true},null,2));console.log('PASS Samsung actual Worker: 12 canonical/alternative solutions; progress unchanged');
 }finally{c.close();run('forward','--remove','tcp:'+port)}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
