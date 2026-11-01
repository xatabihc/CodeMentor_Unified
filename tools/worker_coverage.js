// Report coverage honestly; unsupported references are not release successes.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const references=JSON.parse(fs.readFileSync(0,'utf8'));
const box={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/../www/lessons.js','utf8'),box);
const worker=fs.readFileSync(__dirname+'/../www/worker.js','utf8');
const passed=[],unsupported=[];
for(const lesson of box.window.CODEMENTOR_LESSONS.filter(l=>l.cases?.length)){
  let reply;
  const context=vm.createContext({postMessage:data=>{reply=data},submission:{id:lesson.id,code:references[lesson.id],cases:lesson.cases}});
  try{
    vm.runInContext(worker,context);
    vm.runInContext('onmessage({data:submission})',context,{timeout:500});
    if(lesson.checking?.mode==='python-subset')assert(reply?.ok&&!lesson.cases.some(c=>c.files||c.expected_files),lesson.id+' advertised but unsupported');
    if(reply?.ok&&!lesson.cases.some(c=>c.files||c.expected_files))passed.push(lesson.id);
    else unsupported.push(lesson.id);
  }catch(e){if(e.code==='ERR_ASSERTION'||lesson.checking?.mode==='python-subset')throw e;unsupported.push(lesson.id)}
}
console.log(JSON.stringify({passed:passed.length,unsupported:unsupported.length,unsupported_ids:unsupported},null,2));
