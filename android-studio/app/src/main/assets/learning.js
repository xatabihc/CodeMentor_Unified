/* Shared curriculum model. Legacy IDs and progress records are never rewritten. */
(function(root){
 'use strict';
 const courses=[{id:'python',title:'Python'},{id:'linear-algebra',title:'Линейная алгебра'},{id:'statistics',title:'Статистика'}];
 const levels=['С нуля','Начальный','Базовый','Средний','Продвинутый','Высокий'];
 function courseForTrack(track){return track==='linear-algebra'||track==='statistics'?track:'python';}
 function catalog(lessons){
   const ids=new Set();
   for(const l of lessons){if(!l.id||ids.has(l.id))throw Error('Повторный ID урока');ids.add(l.id);}
   return courses.map(course=>({...course,levels:levels.map((title,index)=>{
     const selected=lessons.filter(l=>courseForTrack(l.track)===course.id&&(l.curriculumLevel??(l.track==='path'?0:l.track==='advanced'?4:2))===index);
     const modules=new Map();
     for(const lesson of selected){const id=lesson.track+':'+(lesson.module||'Практика');if(!modules.has(id))modules.set(id,{id,title:lesson.module||lesson.track,lessons:[]});
       modules.get(id).lessons.push({...lesson,exercises:lesson.exercises||[{id:lesson.id,checker:lesson.checking?.mode||'unavailable',prerequisites:lesson.prerequisites||[]}]});}
     return {id:course.id+':level:'+index,title,modules:[...modules.values()]};
   })}));
 }
 function result(ok,message){return {ok,message};}
 function numeric(actual,expected,{absolute=1e-8,relative=1e-8}={}){
   if(!Number.isFinite(actual)||!Number.isFinite(expected)||!Number.isFinite(absolute)||!Number.isFinite(relative)||absolute<0||relative<0)return false;
   return Math.abs(actual-expected)<=absolute+relative*Math.abs(expected);
 }
 function check(exercise,answer){
   const expected=exercise.expected,options=exercise.tolerance;
   if(exercise.type==='numeric'||exercise.type==='statistics')return result(numeric(answer,expected,options),'Проверь вычисления и указанное округление.');
   if(exercise.type==='choice')return result(answer===expected,'Выбери один вариант.');
   if(exercise.type==='vector'||exercise.type==='matrix'){
     const a=exercise.type==='vector'?[answer]:answer,e=exercise.type==='vector'?[expected]:expected;
     const ok=Array.isArray(a)&&Array.isArray(e)&&e.length>0&&a.length===e.length&&e.every((row,i)=>Array.isArray(row)&&row.length>0&&Array.isArray(a[i])&&a[i].length===row.length&&row.every((v,j)=>numeric(a[i][j],v,options)));
     return result(ok,'Проверь размер и значения каждой ячейки.');
   }
   return {ok:false,supported:false,message:'Этот тип проверки пока не реализован.'};
 }
 function attempt(exerciseId,answer,outcome,at=new Date().toISOString()){
   if(typeof exerciseId!=='string'||!exerciseId||typeof outcome.ok!=='boolean')throw Error('Некорректная попытка');
   return {exerciseId,answer,at,result:{ok:outcome.ok,message:String(outcome.message||'')}};
 }
 root.CodeMentorLearning={courses,levels,courseForTrack,catalog,numeric,check,attempt};
})(typeof window==='undefined'?globalThis:window);
