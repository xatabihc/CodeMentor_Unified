const assert=require('assert'),fs=require('fs'),vm=require('vm');const refs=JSON.parse(fs.readFileSync(0,'utf8')),box={window:{}};
vm.runInNewContext(fs.readFileSync('www/lessons.js','utf8'),box);const worker=fs.readFileSync('www/worker.js','utf8');let count=0;
for(const l of box.window.CODEMENTOR_LESSONS.filter(l=>l.track==='python-data')){
 assert(l.checking.mode==='python-subset');assert(!('solution' in l));assert(!('alternative_solutions' in l));
 for(const code of [...refs[l.id],l.starter,'print(0)']){
  let reply;const context=vm.createContext({postMessage:r=>reply=r,submission:{id:l.id,code,cases:l.cases}});vm.runInContext(worker,context);vm.runInContext('onmessage({data:submission})',context,{timeout:500});
  const correct=refs[l.id].includes(code);assert.equal(reply.ok,correct,l.id+' '+code);count++;
 }
}
console.log('PASS D1 worker: '+count+' canonical/alternative/starter/wrong solutions, all behavioral checks');
