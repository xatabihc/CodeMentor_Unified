const assert=require('assert');
require('../www/progress.js');
const {merge}=globalThis.CodeMentorProgress;
const entry={id:'path01',draft:'print(1)',completed:1,attempts:3,hint_level:1,completed_at:null};
const payload=lessons=>({format:'codementor-progress',version:1,lessons});
const current={path01:{...entry,draft:'',completed:1,attempts:5}};
const combined=merge(current,payload([entry,{...entry,id:'cloud221'}]));
assert.equal(combined.path01.draft,'');
assert.equal(combined.path01.attempts,5);
assert.equal(combined.cloud221.completed,1);
assert.equal(merge({},payload([{...entry,id:'__proto__'}]))['__proto__'].draft,entry.draft);
assert.throws(()=>merge(current,payload([entry,entry])));
assert.throws(()=>merge(current,payload([entry,{...entry,id:'bad',attempts:-1}])));
assert.equal(current.path01.draft,'');
assert.throws(()=>merge({}, {...payload([]),version:2}));
assert.throws(()=>merge({}, payload([{...entry,completed_at:{}}])));
console.log('PASS progress v1 merge, empty drafts, unknown IDs, validation and atomic rejection');

const {snapshot}=globalThis.CodeMentorProgress;
assert.equal(snapshot(JSON.stringify({version:1,records:{path01:{...entry,draft:null}}})).records.path01.draft,null);
assert.throws(()=>snapshot('{broken'));
assert.throws(()=>snapshot(JSON.stringify({version:1,records:[]})));
assert.throws(()=>snapshot(JSON.stringify({version:2,records:{}})));
assert.throws(()=>snapshot(JSON.stringify({version:1,records:{path01:{...entry,attempts:-1}}})));
console.log('PASS stored snapshot validation and null drafts');

assert.throws(()=>snapshot(JSON.stringify({version:1,saved_at:'bad',records:{}})));

const special=merge({},payload([{...entry,id:'__proto__'}]));
assert(Object.hasOwn(special,'__proto__'));
assert.equal(Object.getPrototypeOf(special),null);
assert(Object.keys(special).includes('__proto__'));
