const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',value:'',style:{},replaceChildren(){},append(){},appendChild(){}});return elements.get(id)};
let local=null,native=null,exported=null,backup=null;require('../www/progress.js');
const box={console:{...console,warn:()=>{}},window:{scrollTo:()=>{},CodeMentorProgress:globalThis.CodeMentorProgress,AndroidBridge:{loadProgress:()=>native,saveProgress:data=>{native=data;return true},saveJson:(_,data)=>{exported=JSON.parse(data)}}},
 document:{getElementById:element,addEventListener:()=>{},querySelector:()=>null,createElement:()=>({style:{},append(){},appendChild(){}})},
 localStorage:{getItem:key=>key.endsWith('.backup')?backup:local,setItem:(key,data)=>{if(key.endsWith('.backup'))backup=data;else local=data}},Blob:class{},setTimeout:()=>{}};
box.window.CODEMENTOR_LESSONS=[{id:'path01',track:'path',starter:'print(1)'},{id:'py01',track:'python',starter:'print(2)'}];
let code=fs.readFileSync(__dirname+'/../www/app.js','utf8');
code=code.replace(/\}\)\(\);\s*$/, 'window.test={restore,save,rec,setRec,saveDraft,downloadJSON,pickStart,check,explainError,render,state};})();');
vm.runInNewContext(code,box);
const api=box.window.test;
local=JSON.stringify({version:1,records:{path01:{draft:'',completed:1,attempts:2,hint_level:0},cloud221:{draft:'x',completed:0,attempts:1,hint_level:0}},track:'path'});
api.restore();
assert.equal(api.rec('path01').draft,'');
api.save();
assert.equal(JSON.parse(native).records.path01.completed,1);
assert.equal(element('saveStatus').textContent,'Сохранено');
local=null;api.state.records={};api.restore();
assert.equal(api.rec('path01').attempts,2);
api.downloadJSON();
assert.equal(exported.format,'codementor-progress');assert.equal(exported.version,1);
assert(exported.lessons.some(r=>r.id==='cloud221'));
box.window.AndroidBridge.saveProgress=()=>false;
api.save();assert(element('saveStatus').textContent.startsWith('Ошибка записи'));
api.state.track='python';api.pickStart();assert.equal(api.state.lesson,'py01');
console.log('PASS LocalStorage migration, private storage restore, export unknown IDs, write failure reporting');

// Partial native failure must not hide the newer browser copy at restart.
api.state.lesson='path01';api.setRec('path01',{draft:'latest after failed native commit'});
api.state.records={};api.restore();assert.equal(api.rec('path01').draft,'latest after failed native commit');
const preserved=native;
native='{broken';local=preserved;
api.state.records={};api.restore();assert.equal(api.rec('path01').completed,1);
assert(element('saveStatus').textContent.includes('восстановлен'));
native='{broken';local='{broken';backup=null;
api.restore();api.setRec('path01',{draft:'recovered work'});
assert.equal(native,'{broken');assert.equal(local,'{broken');
assert(element('saveStatus').textContent.includes('приостановлена'));
box.window.CODEMENTOR_LESSONS[0].checking={mode:'unavailable',reason:'No runner'};
api.state.lesson='path01';
// DOM stubs for the unavailable-check result.
element('result').replaceChildren=()=>{};element('result').append=()=>{};
box.document.createElement=()=>({});
const attempts=api.rec('path01').attempts;
api.check();assert.equal(api.rec('path01').attempts,attempts);
console.log('PASS corrupt primary fallback, overwrite protection and unavailable check gate');

assert(api.explainError('total is not defined').includes('Переменная «total»'));
assert(api.explainError('Unexpected token').includes('скобки'));

box.document.createElement=()=>({style:{},append(){},appendChild(){}});
api.state.track='path';api.state.lesson='path01';api.render();
assert.equal(element('runBtn').disabled,true);
assert.equal(element('checkStatus').textContent,'No runner');
assert.equal(element('runBtn').textContent,'Автопроверка недоступна');
console.log('PASS unavailable lesson render (DOM simulation, not Android UI)');
