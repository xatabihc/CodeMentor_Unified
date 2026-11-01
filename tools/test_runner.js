const fs=require('fs'),vm=require('vm'),assert=require('assert');
const references=JSON.parse(fs.readFileSync(0,'utf8'));
const box={window:{}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../www/lessons.js','utf8'),box);
const lessons=box.window.CODEMENTOR_LESSONS;
assert.equal(lessons.length,new Set(lessons.map(l=>l.id)).size);
assert.deepEqual(lessons.map(l=>l.id).sort(),Object.keys(references).sort());
let replies=[];
const sandbox={postMessage:d=>replies.push(d),console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname+'/../www/worker.js','utf8'),sandbox);
let checked=0;
for(const l of lessons.filter(x=>x.track==='path')){
  replies=[];
  sandbox.onmessage({data:{id:l.id,code:references[l.id],cases:l.cases}});
  assert(replies[0].ok,l.id+' '+JSON.stringify(replies[0]));checked++;
  replies=[];
  sandbox.onmessage({data:{id:l.id,code:l.starter,cases:l.cases}});
  assert(!replies[0].ok,l.id+' starter passed');
}
console.log(`PASS ${checked} reference solutions and ${checked} incomplete starters; unique catalog IDs`);
