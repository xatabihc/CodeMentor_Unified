/* Educational Python-subset worker. Not a full CPython environment.
 * Runs outside the UI thread and is terminated by its parent after 1.8s.
 * No native Android bridge or special system privileges are exposed.
 */
'use strict';
const banned = /\b(?:import|from|eval|exec|open|globals|locals|compile|__import__|globalThis|self|window|document|fetch|XMLHttpRequest|postMessage|importScripts|Function|constructor|prototype|navigator|location|process|require|WebSocket|Worker)\b|__\w+__|\bclass\b|\bwith\b|\btry\b|\bexcept\b|\blambda\b|\basync\b|\bawait\b/;
function expr(s) {
  if (banned.test(s)) throw Error('В этом режиме используется учебный поднабор Python. Системные операции и сложные конструкции недоступны.');
  return s.replace(/\bTrue\b/g,'true').replace(/\bFalse\b/g,'false').replace(/\bNone\b/g,'null')
    .replace(/\band\b/g,'&&').replace(/\bor\b/g,'||').replace(/\bnot\s+/g,'!')
    .replace(/\binput\s*\(/g,'__input(').replace(/\bprint\s*\(/g,'__print(')
    .replace(/\bint\s*\(/g,'__int(').replace(/\bfloat\s*\(/g,'__float(')
    .replace(/\blen\s*\(/g,'__len(').replace(/\brange\s*\(/g,'__range(')
    .replace(/\bmax\s*\(/g,'__max(').replace(/\bmin\s*\(/g,'__min(')
    .replace(/\bstr\s*\(/g,'__str(').replace(/\bsum\s*\(/g,'__sum(')
    .replace(/\.lower\(\)/g,'.toLowerCase()').replace(/\.upper\(\)/g,'.toUpperCase()');
}
function compile(code){
 if(code.length>12000)throw Error('Код слишком длинный. Максимум 12 000 символов.');
 if(banned.test(code))throw Error('Обнаружена неподдерживаемая или потенциально опасная конструкция.');
 const rows=code.replace(/\r/g,'').replace(/\t/g,'    ').split('\n');
 let result=['"use strict";'];let blocks=[];let previousBlock=false;let operations=0;
 for(let raw of rows){
  const text=raw.trim();if(!text||text.startsWith('#'))continue;
  if(++operations>600)throw Error('Слишком много строк кода.');
  const level=(raw.match(/^ */)||[''])[0].length;
  if(level%4!==0)throw Error('Отступы должны быть кратны четырём пробелам.');
  if(previousBlock && level<=blocks[blocks.length-1])throw Error('После двоеточия требуется блок с отступом.');
  while(blocks.length && level<=blocks[blocks.length-1]) {result.push('}');blocks.pop();}
  if (level>0 && !blocks.some(x=>x===level-4) && !(previousBlock&&blocks.length)){
    // A nested line must be covered by the immediately enclosing block.
    if(!blocks.length)throw Error('Неожиданный отступ.');
  }
  previousBlock=false;
  let m, js;
  if((m=text.match(/^if\s+(.+):$/)))js=`if (${expr(m[1])}) {`;
  else if((m=text.match(/^elif\s+(.+):$/)))js=`else if (${expr(m[1])}) {`;
  else if(text==='else:')js='else {';
  else if((m=text.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+):$/)))js=`for (var ${m[1]} of ${expr(m[2])}) {`;
  else if((m=text.match(/^while\s+(.+):$/)))js=`while (${expr(m[1])}) {`;
  else if((m=text.match(/^def\s+([A-Za-z_]\w*)\(([^)]*)\):$/))){
    if(!/^[\w,\s]*$/.test(m[2])) throw Error('Параметры функции записаны неверно.');
    js=`function ${m[1]}(${m[2]}) {`;
  }
  else if(text==='pass')js=';';
  else if((m=text.match(/^return\s+(.+)$/)))js=`return ${expr(m[1])};`;
  else if((m=text.match(/^([A-Za-z_]\w*)\s*(\+=|-=|\*=|%=|=)\s*(.+)$/)))js=m[2]==='='?`var ${m[1]} = ${expr(m[3])};`:`${m[1]} ${m[2]} ${expr(m[3])};`;
  else if(!text.endsWith(':'))js=expr(text)+';';
  else throw Error('Проверь двоеточия и структуру инструкции: '+text.slice(0,70));
  if (!/^else(?:\s|\s*\{)/.test(js)) result.push('if(++__ticks > 25000)throw Error("Превышен лимит шагов программы.");');
  result.push(js);
  if(js.endsWith('{')){blocks.push(level);previousBlock=true;}
 }
 if(previousBlock)throw Error('После двоеточия нужен блок с отступом.');
 while(blocks.length){result.push('}');blocks.pop()}
 return result.join('\n');
}
function run(code,input){
 let output=[],inputs=[...input],__ticks=0;
 const __input=()=>inputs.length?String(inputs.shift()):'';
 const __int=v=>{const n=parseInt(v,10);if(!Number.isFinite(n))throw Error('Ожидалось целое число.');return n};
 const __float=v=>{const n=Number(v);if(!Number.isFinite(n))throw Error('Ожидалось число.');return n};
 const __len=v=>v.length;
 const __range=(a,b,step=1)=>{if(b===undefined){b=a;a=0}if(!Number.isInteger(a)||!Number.isInteger(b)||step===0||Math.abs(b-a)>20000)throw Error('Некорректный диапазон range().');let out=[];for(let i=a;step>0?i<b:i>b;i+=step){if(out.length>=10000)throw Error('Слишком длинный цикл.');out.push(i)}return out};
 const __str=v=>String(v);const __max=(...a)=>Math.max(...(a.length===1&&Array.isArray(a[0])?a[0]:a));const __min=(...a)=>Math.min(...(a.length===1&&Array.isArray(a[0])?a[0]:a));const __sum=a=>a.reduce((x,y)=>x+y,0);
 const __print=(...v)=>{if(output.join('\n').length>15000)throw Error('Слишком большой вывод.');output.push(v.map(x=>x===true?'True':x===false?'False':x===null?'None':String(x)).join(' '))};
 const translated=compile(code);
 try{
  new Function('__input','__int','__float','__len','__range','__str','__max','__min','__sum','__print','__ticks',translated)(
    __input,__int,__float,__len,__range,__str,__max,__min,__sum,__print,__ticks);
 }catch(e){throw Error(String(e.message||e).slice(0,400))}
 return output.join('\n').trimEnd();
}
onmessage=event=>{
 const {id,code,cases}=event.data;
 try{
  for(let i=0;i<cases.length;i++){
   const t=cases[i];const actual=run(code,Array.isArray(t.stdin)?t.stdin:[]),expected=String(t.stdout??'').trimEnd();
   if(actual!==expected){postMessage({id,ok:false,index:i+1,expected,actual});return}
  }
  postMessage({id,ok:true,count:cases.length});
 }catch(e){postMessage({id,ok:false,error:String(e.message||e).slice(0,450)})}
};
