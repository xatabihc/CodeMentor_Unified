/* Minimal Chrome DevTools client; uses Ubuntu's ws, no app dependency or CDN. */
const WebSocket=require('ws'),fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function connect(url){
 const ws=new WebSocket(url);await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});let id=0;const pending=new Map();
 ws.on('message',raw=>{const m=JSON.parse(raw);if(pending.has(m.id)){const {resolve,reject,timer}=pending.get(m.id);clearTimeout(timer);pending.delete(m.id);m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result)}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(Error('CDP timeout: '+method))},15000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result.value};
 return {send,evaluate,close:()=>ws.close()};
}
async function browser(){
 const root=path.resolve(__dirname,'..'),profile=fs.mkdtempSync(path.join(root,'.test-tmp/cdp-'));
 const server=http.createServer((req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;const file=path.resolve(root,'.'+(name==='/'?'/www/index.html':name));if(!file.startsWith(root+path.sep))throw Error('Path');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file))}catch(e){res.writeHead(404);res.end('Not found')}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const chrome=spawn(process.env.CHROME||'/usr/bin/google-chrome',['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 try{
  const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;i<100&&!fs.existsSync(portFile);i++)await pause(50);
  const port=fs.readFileSync(portFile,'utf8').split('\n')[0];const targets=await (await fetch('http://127.0.0.1:'+port+'/json')).json();
  const client=await connect(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
  await client.send('Page.enable');return {...client,base:'http://127.0.0.1:'+server.address().port+'/www/index.html',stop(){client.close();chrome.kill();server.close()}};
 }catch(e){chrome.kill();server.close();throw e;}
}
module.exports={connect,browser,pause};
