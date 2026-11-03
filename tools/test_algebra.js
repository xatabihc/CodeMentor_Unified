const assert=require('assert'),fs=require('fs'),{execFileSync}=require('child_process');
require('../www/algebra.js');require('../www/learning.js');const A=CodeMentorAlgebra,L=CodeMentorLearning;
const oracle=JSON.parse(process.argv.includes('--stdin')?fs.readFileSync(0,'utf8'):execFileSync('python3',['tools/algebra_oracle.py'],{encoding:'utf8'}));
const lessons=JSON.parse(fs.readFileSync('curriculum_source/platform.json')).filter(l=>l.id.startsWith('la-b2-'));
let count=0;
for(const l of lessons)for(const e of l.exercises){
 assert.deepEqual(e.expected,oracle[e.id].expected);let answer=e.expected;
 if(e.type==='row-reduction')answer={operations:A.reduction(e.initial).steps.map(s=>s.op)};
 assert(L.check(e,answer).ok,e.id+' correct answer rejected');assert(!L.check(e,null).ok,e.id+' null');assert(!L.check(e,'text').ok,e.id+' text');
 if(e.type==='row-reduction'){
  assert(!L.check(e,{operations:[{kind:'scale',target:0,factor:0}]}).ok);
  assert(!L.check(e,{operations:[{kind:'swap',target:9,source:0}]}).ok);
  if(e.goal==='echelon')assert(L.check(e,{operations:[...answer.operations,{kind:'scale',target:0,factor:2}]}).ok,'Alternative echelon rejected');
 }else if(e.type==='basis'){
  assert(L.check(e,e.expected.map(r=>r.map(v=>v*2))).ok,'Alternative basis rejected');
  assert(!L.check(e,e.expected.map(r=>r.map(()=>0))).ok);
 }else if(e.type==='eigenvector'){
  for(const scale of [-3,2,1e-100])assert(L.check(e,e.expected.map(v=>v*scale)).ok,'Scaled eigenvector rejected');
  assert(!L.check(e,e.expected.map(()=>0)).ok);assert(!L.check(e,[1e-100,2e-100]).ok,'Near-zero wrong direction accepted');
 }else if(typeof answer==='number')assert(!L.check(e,answer+1).ok);
 else {const wrong=JSON.parse(JSON.stringify(answer));if(e.type==='matrix')wrong[0][0]+=1;else wrong[0]+=1;assert(!L.check(e,wrong).ok,e.id+' wrong answer accepted');}
 count++;
}
assert.throws(()=>A.multiply([[1,2]],[[1,2]]));assert.throws(()=>A.det([[1,2]]));
assert.throws(()=>A.rowOperation([[1]],{kind:'scale',target:0,factor:0}));
assert.deepEqual(A.multiply([[1,2],[3,4]],[[2,0],[1,2]]),[[4,4],[10,8]]);
assert.equal(A.reduction([[0,0],[0,0]]).rank,0);assert(A.echelon([[1,2],[0,0]]));assert(!A.echelon([[0,0],[1,2]]));
console.log('PASS B2: '+count+' exercises, independent rational oracles, invalid answers, alternative bases/eigenvectors/row operations');
