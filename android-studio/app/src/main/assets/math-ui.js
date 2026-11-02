/* Accessible local numerical practice. Answers are stored in the existing v1 records. */
(function(root){
 'use strict';
 function mount(host,lesson,{rec,setRec,onComplete,notify,allowed}){
   host.replaceChildren();host.hidden=false;
   let index=lesson.exercises.findIndex(e=>!rec(e.id).completed);if(index<0)index=0;
   const exercise=lesson.exercises[index];
   const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
   const heading=el('h3',`Упражнение ${index+1} из ${lesson.exercises.length}`),task=el('p',exercise.task);
   const status=el('p',allowed?'Режим «Я решаю сам». Числа вводи без округления. Допуск: 10⁻⁸ + 10⁻⁸ × |верное значение|. Пустая ячейка не равна нулю.':'Сначала выполни три упражнения предыдущего урока. Теорию можно читать свободно.');
   status.setAttribute('aria-live','polite');host.append(heading,task,status);
   let answer=null;try{answer=JSON.parse(rec(exercise.id).draft??'null')}catch(e){}
   const area=el('div');host.append(area);
   const persist=()=>setRec(exercise.id,{draft:JSON.stringify(answer)});
   const number=value=>{if(!String(value).trim())return null;const n=Number(String(value).replace(',','.'));return Number.isFinite(n)?n:null};
   function input(value,label,update){const n=el('input');n.type='text';n.inputMode='decimal';n.value=value??'';n.setAttribute('aria-label',label);n.addEventListener('input',()=>{update(number(n.value));persist()});return n;}
   if(exercise.type==='matrix'){
     if(!Array.isArray(answer)||!answer.length||answer.length>8||!Array.isArray(answer[0])||!answer[0].length||answer[0].length>8||!answer.every(row=>Array.isArray(row)&&row.length===answer[0].length))answer=[[null]];
     const controls=el('div');controls.className='matrix-size';
     const rows=el('select'),cols=el('select');
     for(const [control,label,count] of [[rows,'Строки',answer.length],[cols,'Столбцы',answer[0].length]]){
       const wrap=el('label',label+' ');for(let i=1;i<=8;i++){const option=el('option',i);option.value=i;control.append(option)}control.value=count;wrap.append(control);controls.append(wrap);
     }
     const scroll=el('div');scroll.className='matrix-scroll';area.append(controls,el('p','Редактор от 1×1 до 8×8. Большая матрица прокручивается отдельно. Изменение размера сохраняет пересекающиеся ячейки.'),scroll);
     function grid(){
       scroll.replaceChildren();const table=el('table');table.className='matrix-table';const caption=el('caption',`${answer.length} строк × ${answer[0].length} столбцов`);table.append(caption);
       const cells=[];
       answer.forEach((row,i)=>{const tr=el('tr');row.forEach((value,j)=>{const td=el('td'),field=input(value,`Строка ${i+1}, столбец ${j+1}`,n=>{answer[i][j]=n});
         field.addEventListener('focus',()=>{for(const c of cells)c.td.classList.toggle('matrix-highlight',c.i===i||c.j===j)});
         cells.push({td,i,j});td.append(field);tr.append(td)});table.append(tr)});scroll.append(table);
     }
     function resize(){const old=answer;answer=Array.from({length:Number(rows.value)},(_,i)=>Array.from({length:Number(cols.value)},(_,j)=>old[i]?.[j]??null));persist();grid()}
     rows.onchange=resize;cols.onchange=resize;grid();
   }else if(exercise.type==='vector'){
     if(!Array.isArray(answer)||answer.length!==exercise.expected.length)answer=exercise.expected.map(()=>null);
     answer.forEach((value,i)=>{const label=el('label',i===0?'Строки: ':'Столбцы: ');label.append(input(value,`Компонента ${i+1}`,n=>{answer[i]=n}));area.append(label)});
   }else{if(typeof answer!=='number')answer=null;area.append(input(answer,'Числовой ответ',n=>{answer=n}));}
   const actions=el('div');actions.className='toolbar';const check=el('button','Проверить ответ');check.type='button';check.className='btn primary';check.disabled=!allowed;
   check.onclick=()=>{
     if(!allowed)return;
     const old=rec(exercise.id);setRec(exercise.id,{draft:JSON.stringify(answer),attempts:old.attempts+1});
     const outcome=root.CodeMentorLearning.check(exercise,answer);
     if(!outcome.ok){notify(false,outcome.message+' '+lesson.learning.errors);return;}
     setRec(exercise.id,{completed:1,completed_at:old.completed_at||new Date().toISOString()});
     if(lesson.exercises.every(e=>rec(e.id).completed)){onComplete();return;}
     notify(true,'Ответ верный. Перейди к следующему небольшому упражнению.');mount(host,lesson,{rec,setRec,onComplete,notify,allowed});if(lesson.track==='statistics')root.CodeMentorStatistics.mount(host,{rec,setRec});
   };
   const simpler=el('button','Не понял'),step=el('button','Показать следующий шаг');
   for(const b of [simpler,step]){b.type='button';b.className='btn subtle';}
   simpler.onclick=()=>{status.textContent=lesson.simpler};
   let nextStep=0;const steps=[lesson.learning.walkthrough,lesson.learning.errors,'Теперь попробуй самостоятельно. Проверь количество строк и столбцов перед числами.'];
   step.onclick=()=>{status.textContent=steps[Math.min(nextStep++,steps.length-1)]};
   actions.append(check,simpler,step);host.append(actions);
 }
 root.CodeMentorMathUI={mount};
})(typeof window==='undefined'?globalThis:window);
