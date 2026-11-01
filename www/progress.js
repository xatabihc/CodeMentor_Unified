/* Version 1 portable progress. Unknown lesson IDs survive round trips. */
(function(root){
 'use strict';
 function records(items){
   if(!Array.isArray(items)||items.length>1000)throw Error('Некорректный список уроков');
   const result=Object.create(null);
   for(const r of items){
     if(!r||typeof r.id!=='string'||!r.id.length||r.id.length>100||Object.hasOwn(result,r.id))throw Error('Некорректный или повторный урок');
     if(typeof r.draft!=='string'||r.draft.length>12000)throw Error('Некорректный черновик');
     if(![0,1,true,false].includes(r.completed)||!Number.isInteger(r.attempts)||r.attempts<0||r.attempts>10000000||!Number.isInteger(r.hint_level)||r.hint_level<0||r.hint_level>2)throw Error('Некорректный прогресс');
     if(r.completed_at!=null&&(typeof r.completed_at!=='string'||r.completed_at.length>100))throw Error('Некорректная дата');
     result[r.id]={draft:r.draft,completed:r.completed?1:0,attempts:r.attempts,hint_level:r.hint_level,completed_at:r.completed_at||null};
   }
   return result;
 }
 function merge(current,data){
   if(!data||data.format!=='codementor-progress'||data.version!==1)throw Error('Неверный формат файла CodeMentor');
   const incoming=records(data.lessons),staged=Object.assign(Object.create(null),current);
   for(const [id,r] of Object.entries(incoming)){
     const old=Object.hasOwn(staged,id)?staged[id]:{};
     staged[id]={draft:old.draft??r.draft,completed:old.completed||r.completed?1:0,attempts:Math.max(old.attempts||0,r.attempts),hint_level:Math.max(old.hint_level||0,r.hint_level),completed_at:old.completed_at||r.completed_at||null};
   }
   return staged;
 }
 function snapshot(raw){
   const data=JSON.parse(raw);
   if(!data||data.version!==1||!data.records||typeof data.records!=='object'||Array.isArray(data.records))throw Error('Некорректное хранилище прогресса');
   if(data.saved_at!==undefined&&(!Number.isSafeInteger(data.saved_at)||data.saved_at<0))throw Error('Некорректная версия сохранения');
   const items=Object.entries(data.records).map(([id,r])=>({...r,id,draft:r?.draft===null?'':r?.draft}));
   const validated=records(items);
   for(const id of Object.keys(validated))if(data.records[id].draft===null)validated[id].draft=null;
   return {...data,records:validated};
 }
 root.CodeMentorProgress={merge,records,snapshot};
})(typeof window==='undefined'?globalThis:window);
