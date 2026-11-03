const assert=require('assert'),fs=require('fs'),vm=require('vm');let count=0,focus;
const handlers={},vhandlers={};const field={isConnected:true,matches:()=>true,getBoundingClientRect:()=>({top:700,bottom:750}),scrollIntoView:()=>{count++}};
const root={innerHeight:800,visualViewport:{height:800,offsetTop:0,addEventListener:(n,f)=>vhandlers[n]=f},addEventListener:(n,f)=>handlers[n]=f,requestAnimationFrame:f=>f()};
vm.runInNewContext(fs.readFileSync('www/viewport.js','utf8'),{window:root,document:{activeElement:field,addEventListener:(n,f)=>focus=f}});
root.visualViewport.height=350;vhandlers.resize();assert.equal(count,1);
root.visualViewport.height=800;vhandlers.resize();assert.equal(count,1,'Keyboard hide must not pull page to old focused field');
focus({target:field});assert.equal(count,1,'Visible field needs no scrolling');
field.getBoundingClientRect=()=>({top:900,bottom:950});focus({target:field});assert.equal(count,2);
console.log('PASS viewport shrinking reveals input; keyboard hide preserves page position');
