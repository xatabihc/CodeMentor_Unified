const assert=require('assert'),fs=require('fs'),{browser,pause}=require('./cdp');
(async()=>{const statsMode=process.argv.includes('--statistics'),label=statsMode?'C2':'B2',c=await browser(),ev=c.evaluate;try{
 await c.send('Page.navigate',{url:c.base});for(let i=0;i<100;i++){if(await ev("!!document.querySelector('#courses button')"))break;await pause(30)}
 await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`if(!sessionStorage.getItem('b2-seeded')){localStorage.setItem('b2-test-seed','pending');sessionStorage.setItem('b2-seeded','1')}`});
 // Seed after the old document's visibility autosave, before the new app restores.
 const data=await ev("(()=>{const records={};for(const l of [...CODEMENTOR_LESSONS,...CODEMENTOR_MATH_LESSONS])records[l.id]={draft:null,completed:1,attempts:0,hint_level:0,completed_at:null};return {version:1,records,track:'linear-algebra',course:'linear-algebra',saved_at:Date.now()+10000}})()");
 if(statsMode){data.track='statistics';data.course='statistics';}
 await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`if(localStorage.getItem('b2-test-seed')==='pending'){localStorage.setItem('codementor-unified-v1',${JSON.stringify(JSON.stringify(data))});localStorage.removeItem('b2-test-seed')}`});
 await Promise.all([c.waitEvent('Page.loadEventFired'),c.send('Page.reload')]);
 const ids=await ev(`CODEMENTOR_MATH_LESSONS.filter(l=>l.id.startsWith('${statsMode?'st-c2-':'la-b2-'}')).map(l=>l.id)`);
 for(const [width,height] of [[320,640],[360,800],[390,844],[412,915],[768,1024]]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height,mobile:true,deviceScaleFactor:1});
  for(const id of ids){
   // Clear only this isolated test profile's exercise progress to repeat every viewport.
   await ev(`{const s=JSON.parse(localStorage.getItem('codementor-unified-v1'));for(const e of CODEMENTOR_MATH_LESSONS.find(l=>l.id==='${id}').exercises)delete s.records[e.id];localStorage.setItem('codementor-unified-v1',JSON.stringify(s))}`);
   await Promise.all([c.waitEvent('Page.loadEventFired'),c.send('Page.reload')]);if(!await ev(`!!document.querySelector('[data-lesson-id="${id}"]')`))throw Error(id+' missing '+JSON.stringify(await ev("({title:document.title,course:document.querySelector('#courses .active')?.textContent,section:document.getElementById('sectionName')?.textContent,buttons:document.querySelectorAll('#lessonList button').length,stored:JSON.parse(localStorage.getItem('codementor-unified-v1'))?.track})")));await ev(`document.querySelector('[data-lesson-id="${id}"]').click()`);
   for(let index=0;index<3;index++){
    const e=await ev(`CODEMENTOR_MATH_LESSONS.find(l=>l.id==='${id}').exercises[${index}]`);
    if(e.type==='row-reduction'){
     await ev(`{const steps=CodeMentorAlgebra.reduction(${JSON.stringify(e.initial)}).steps;for(const {op} of steps){document.querySelector('[aria-label="Преобразование строк"]').value=op.kind;document.querySelector('[aria-label="Изменяемая строка"]').value=op.target;document.querySelector('[aria-label="Исходная строка"]').value=op.source??0;document.querySelector('[aria-label="Множитель строки"]').value=op.factor??1;Array.from(document.querySelectorAll('#mathPractice button')).find(b=>b.textContent==='Применить').click()}}`);
    }else if(['matrix','basis'].includes(e.type)){
     await ev(`{const a=${JSON.stringify(e.expected)},selects=document.querySelectorAll('.matrix-size select');selects[0].value=a.length;selects[0].dispatchEvent(new Event('change'));selects[1].value=a[0].length;selects[1].dispatchEvent(new Event('change'));const fields=document.querySelectorAll('.answer-area .matrix-table input');a.flat().forEach((v,i)=>{fields[i].value=v;fields[i].dispatchEvent(new Event('input'))})}`);
    }else{
     await ev(`{const values=${JSON.stringify(Array.isArray(e.expected)?e.expected:[e.expected])},fields=document.querySelectorAll('.answer-area input');values.forEach((v,i)=>{fields[i].value=v;fields[i].dispatchEvent(new Event('input'))})}`);
    }
    await ev("Array.from(document.querySelectorAll('#mathPractice button')).find(b=>b.textContent==='Проверить ответ').click()");
    assert(await ev(`JSON.parse(localStorage.getItem('codementor-unified-v1')).records['${e.id}']?.completed===1`),`${width}/${e.id}: controls did not submit valid answer`);
   }
   assert(await ev('document.documentElement.scrollWidth<=innerWidth+1'),`${width}/${id}: page overflow`);
   await ev("document.getElementById('exportQuick').scrollIntoView({block:'end'})");assert(await ev("document.getElementById('exportQuick').getBoundingClientRect().bottom<=innerHeight+1"));
  }
  if(statsMode){await ev("document.querySelectorAll('#mathPractice details').forEach(d=>d.open=true)");assert(await ev('document.documentElement.scrollWidth<=innerWidth+1'));}
  console.log('PASS '+label+' browser '+width+'×'+height+': '+(statsMode?45:63)+' exercises through actual controls');
 }
 if(!statsMode){
 // Every multiplication cell is navigable, including (2,4) in 2×3 times 3×4.
 await ev("document.querySelector('[data-lesson-id=la-b2-05]').click()");
 // Mount the third exercise via the same persisted exercise selection.
 await ev("{const s=JSON.parse(localStorage.getItem('codementor-unified-v1'));delete s.records['la-b2-05:e3'];localStorage.setItem('codementor-unified-v1',JSON.stringify(s))}");await Promise.all([c.waitEvent('Page.loadEventFired'),c.send('Page.reload')]);await ev("document.querySelector('[data-lesson-id=la-b2-05]').click();for(let i=0;i<7;i++)Array.from(document.querySelectorAll('#mathPractice button')).find(b=>b.textContent==='Следующая ячейка').click()");
 assert(await ev("document.querySelector('.algebra-demo').textContent.includes('(2, 4)')"));
 console.log('PASS B2 multiplication walkthrough reaches all 8 cells');
 }else{
  const before=await ev("document.querySelector('#mathPractice svg polyline').getAttribute('points')");
  await ev("{const mu=document.querySelector('[aria-label=\"Среднее μ\"]');mu.value=3;mu.dispatchEvent(new Event('input'))}");
  assert.notEqual(await ev("document.querySelector('#mathPractice svg polyline').getAttribute('points')"),before,'Normal curve did not change');
  await ev("{const input=document.querySelector('[aria-label=\"Пары x y, одна пара в строке\"]');input.value='1 3\\n2 5\\n3 7';input.dispatchEvent(new Event('input'))}");
  assert.equal(await ev("document.querySelectorAll('#mathPractice svg').length"),2);
  console.log('PASS C2 normal curve parameters and regression graph');
 }
 }finally{c.stop()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
