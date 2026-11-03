(function(root){
 'use strict';
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
 function view(a,title,row=-1,col=-1){const scroll=el('div');scroll.className='matrix-scroll';const table=el('table');table.className='matrix-table';table.append(el('caption',title));a.forEach((r,i)=>{const tr=el('tr');r.forEach((v,j)=>{const td=el('td',Number(v.toPrecision(7)).toLocaleString('ru-RU'));if(i===row||j===col)td.className='matrix-highlight';if((title.startsWith('Текущая')||title.startsWith('Демонстрация'))&&j===r.findIndex(x=>Math.abs(x)>1e-9)){td.classList.add('pivot-cell');td.title='Опорный элемент строки';}tr.append(td)});table.append(tr)});scroll.append(table);return scroll;}
 function demonstrate(host,exercise){
  const spec=exercise.operation;if(!spec)return;const details=el('details');details.open=true;details.className='algebra-demo';details.append(el('summary','Разбор операции · не засчитывается как решение'));const body=el('div');details.append(body);host.append(details);
  if(spec.kind==='multiply'){
   const {a,b}=spec;let cell=0;const count=a.length*b[0].length,button=el('button','Следующая ячейка'),text=el('p'),tables=el('div');button.type='button';button.className='btn subtle';
   function draw(){const i=Math.floor(cell/b[0].length),j=cell%b[0].length;
    tables.replaceChildren(view(a,'A: '+a.length+'×'+a[0].length,i),view(b,'B: '+b.length+'×'+b[0].length,-1,j));
    text.textContent=`Внутренние размеры совпадают: ${a[0].length} = ${b.length}. Результат ${a.length}×${b[0].length}. Ячейка (${i+1}, ${j+1}): `+a[i].map((v,k)=>`(${v}) × (${b[k][j]})`).join(' + ')+' = '+root.CodeMentorAlgebra.multiply(a,b)[i][j]+'.';}
   button.onclick=()=>{cell=(cell+1)%count;draw()};body.append(tables,text,button);draw();
  }else{
   body.append(view(spec.a,'Матрица A'));if(spec.b)body.append(view(spec.b,'Матрица B'));
   body.append(el('p',exercise.visualExplanation||'Сопоставь строки и столбцы с разобранным примером в теории. Ответ вводи самостоятельно.'));
  }
 }
 function rowTrainer(host,exercise,{value,onChange}){
  const initial=exercise.initial;let operations=Array.isArray(value?.operations)?value.operations:[],current;
  try{current=operations.reduce((a,op)=>root.CodeMentorAlgebra.rowOperation(a,op),initial)}catch(e){operations=[];current=initial.map(r=>r.slice())}
  const display=el('div'),controls=el('div'),message=el('p');controls.className='toolbar';
  const kind=el('select');kind.setAttribute('aria-label','Преобразование строк');for(const [v,t] of [['swap','Поменять строки'],['scale','Умножить строку'],['add','Прибавить кратную строку']]){const o=el('option',t);o.value=v;kind.append(o)}
  const target=el('select'),source=el('select');for(const [s,name] of [[target,'Изменяемая строка'],[source,'Исходная строка']]){s.setAttribute('aria-label',name);initial.forEach((_,i)=>{const o=el('option','R'+(i+1));o.value=i;s.append(o)})}source.value=initial.length>1?1:0;
  const factor=el('input');factor.type='text';factor.inputMode='decimal';factor.value='-1';factor.setAttribute('aria-label','Множитель строки');
  const apply=el('button','Применить'),undo=el('button','Отменить шаг');for(const b of [apply,undo]){b.type='button';b.className='btn subtle'}
  const draw=()=>{display.replaceChildren(view(current,'Текущая расширенная матрица'));message.textContent='Шагов: '+operations.length+'. Опорный элемент — первое ненулевое число в строке.';onChange({operations})};
  apply.onclick=()=>{try{if(operations.length>=100)throw Error('Максимум 100 шагов');const op={kind:kind.value,target:Number(target.value),source:Number(source.value),factor:factor.value.trim()?Number(factor.value.replace(',','.')):NaN};current=root.CodeMentorAlgebra.rowOperation(current,op);operations.push(op);draw()}catch(e){message.textContent=e.message}};
  undo.onclick=()=>{operations.pop();current=operations.reduce((a,op)=>root.CodeMentorAlgebra.rowOperation(a,op),initial);draw()};
  controls.append(kind,target,source,factor,apply,undo);host.append(display,controls,message);
  const demo=el('details');demo.append(el('summary','Покадровый разбор · без зачёта'));const frame=el('div'),next=el('button','Показать следующий шаг');next.type='button';next.className='btn subtle';const frames=root.CodeMentorAlgebra.reduction(initial).steps;let index=-1;
  frame.append(view(initial,'Исходная матрица'));next.onclick=()=>{if(index+1>=frames.length)return;const step=frames[++index],op=step.op;frame.replaceChildren(view(step.matrix,'Демонстрация, шаг '+(index+1),op.target));frame.append(el('p',op.kind==='swap'?`R${op.target+1} ↔ R${op.source+1}`:op.kind==='scale'?`R${op.target+1} = ${op.factor.toPrecision(5)} × R${op.target+1}`:`R${op.target+1} = R${op.target+1} + (${op.factor.toPrecision(5)}) × R${op.source+1}`))};demo.append(frame,next);host.append(demo);display.append(view(current,'Текущая расширенная матрица'));
 }
 root.CodeMentorAlgebraUI={view,demonstrate,rowTrainer};
})(window);
