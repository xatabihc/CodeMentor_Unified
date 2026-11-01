/* Text edits only; no code is executed by this helper. Offsets follow textarea. */
(function(root){
 'use strict';
 function edit(value,start,end,key,python=true){
   let insert,cursor;
   if(key==='Tab'){insert='    ';cursor=start+4;}
   else if(key==='Enter'&&python){
     const before=value.slice(0,start).split('\n').pop();
     const indent=(before.match(/^ */)||[''])[0]+(before.trimEnd().endsWith(':')?'    ':'');
     insert='\n'+indent;cursor=start+insert.length;
   }else if(python&&Object.hasOwn({'(':')','[':']','{':'}'},key)){
     insert=key+value.slice(start,end)+{'(':')','[':']','{':'}'}[key];
     return {value:value.slice(0,start)+insert+value.slice(end),start:start+1,end:end+1};
   }else if(python&&[')',']','}'].includes(key)&&start===end&&value[start]===key){
     return {value,start:start+1,end:start+1};
   }else return null;
   return {value:value.slice(0,start)+insert+value.slice(end),start:cursor,end:cursor};
 }
 root.CodeMentorEditor={edit};
})(typeof window==='undefined'?globalThis:window);
