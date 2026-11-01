// Logic tests with a small DOM model, not a browser or Samsung UI test.
const assert=require('assert'),fs=require('fs'),vm=require('vm');
require('../www/progress.js');
const source=fs.readFileSync(__dirname+'/../www/app.js','utf8').replace(/\}\)\(\);\s*$/,
 'window.navTest={state,setupNav,openNav,closeNav,rec};})();');
for(const width of [360,390,412]){
 const viewport={width,height:844},nodes=new Map(),keys=new Map();let stored=null,onChange;
 const doc={activeElement:null,addEventListener:(name,callback)=>keys.set(name,callback)};
 function node(id){
   if(!nodes.has(id)){
     const classes=new Set(),attrs=new Map();
     nodes.set(id,{value:'',textContent:'',
       classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
       setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),getAttribute:k=>attrs.get(k),
       hasAttribute:k=>attrs.has(k),focus(){doc.activeElement=this},getClientRects:()=>[{}],
       querySelectorAll:()=>[node('closeNav'),node('lastLesson')]
     });
   }
   return nodes.get(id);
 }
 doc.getElementById=node;doc.documentElement=node('html');doc.querySelector=selector=>selector==='.main'?node('main'):null;
 const media={get matches(){return viewport.width<=840||(viewport.width<=1024&&viewport.height<=500)},addEventListener:(_,callback)=>{onChange=callback}};
 const win={CODEMENTOR_LESSONS:[{id:'path01',track:'path'}],CodeMentorProgress,
   matchMedia:query=>{assert(query.includes('max-height:500px'));return media}};
 const box={window:win,document:doc,console,localStorage:{getItem:()=>stored,setItem:(_,v)=>{stored=v}}};
 vm.runInNewContext(source,box);const api=win.navTest;
 api.setupNav();assert(node('sidebar').hasAttribute('inert'));
 node('editor').value='print("черновик")';node('editor').focus();
 node('openNav').onclick();assert(node('sidebar').classList.contains('show'));
 assert.equal(node('openNav').getAttribute('aria-expanded'),'true');
 assert.equal(doc.activeElement,node('closeNav'));assert(node('main').hasAttribute('inert'));
 assert.equal(api.rec('path01').draft,'print("черновик")');
 let prevented=false;node('lastLesson').focus();keys.get('keydown')({key:'Tab',preventDefault(){prevented=true}});
 assert(prevented);assert.equal(doc.activeElement,node('closeNav'));
 node('backdrop').onclick();assert(!node('sidebar').classList.contains('show'));
 assert.equal(doc.activeElement,node('openNav'));assert(!node('main').hasAttribute('inert'));
 node('editor').focus();viewport.height=300;assert.equal(doc.activeElement,node('editor'));
 viewport.width=844;viewport.height=width;assert(media.matches);
 assert.equal(doc.activeElement,node('editor'));
 node('openNav').onclick();keys.get('keydown')({key:'Escape',preventDefault(){}});
 assert.equal(node('openNav').getAttribute('aria-expanded'),'false');
 viewport.width=1200;viewport.height=800;node('editor').focus();onChange();
 assert(!node('sidebar').hasAttribute('inert'));assert(!node('sidebar').hasAttribute('aria-hidden'));
 assert.equal(doc.activeElement,node('editor'));
 console.log(`PASS navigation DOM model ${width}px: focus, Escape, resize/rotation, draft preservation`);
}
