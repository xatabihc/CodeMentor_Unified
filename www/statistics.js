/* Descriptive statistics and equal-width histogram, entirely local. */
(function(root){
 'use strict';
 function describe(values,bins=5){
   if(!Array.isArray(values)||!values.length||values.length>1000||!values.every(Number.isFinite))throw Error('Введи от 1 до 1000 конечных чисел.');
   if(!Number.isInteger(bins)||bins<1||bins>20)throw Error('Число интервалов: от 1 до 20.');
   const sorted=[...values].sort((a,b)=>a-b),n=values.length,mean=values.reduce((s,v)=>s+v/n,0);
   const median=n%2?sorted[(n-1)/2]:sorted[n/2-1]/2+sorted[n/2]/2;
   const ss=values.reduce((s,v)=>s+(v-mean)**2,0),populationVariance=ss/n,sampleVariance=n>1?ss/(n-1):null;
   if(!Number.isFinite(mean)||!Number.isFinite(ss))throw Error('Числа слишком велики для устойчивого расчёта.');
   const min=sorted[0],max=sorted[n-1],width=max===min?1:(max-min)/bins;
   const histogram=Array.from({length:max===min?1:bins},(_,i)=>({from:min+i*width,to:min+(i+1)*width,count:0}));
   for(const value of values)histogram[Math.min(histogram.length-1,Math.floor((value-min)/width))].count++;
   return {n,mean,median,min,max,range:max-min,populationVariance,sampleVariance,populationStd:Math.sqrt(populationVariance),sampleStd:sampleVariance===null?null:Math.sqrt(sampleVariance),histogram};
 }
 function mount(host,{rec,setRec}){
   const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
   const box=el('details'),title=el('summary','Лаборатория данных · калькулятор и гистограмма');box.append(title);
   const label=el('label','Числа через пробел или точку с запятой. Десятичная запятая допустима.');
   const input=el('textarea');input.setAttribute('aria-label','Набор данных');input.rows=3;input.value=rec('statistics:lab').draft??'2 4 4 6 8';label.append(input);
   const bins=el('input');bins.type='range';bins.min=1;bins.max=20;bins.value=5;bins.setAttribute('aria-label','Количество интервалов гистограммы');
   const binLabel=el('label','Число интервалов: ');const binCount=el('span','5');binLabel.append(binCount,bins);
   const output=el('p');output.setAttribute('aria-live','polite');const graph=el('div');graph.className='histogram';
   function calculate(){
     setRec('statistics:lab',{draft:input.value});binCount.textContent=bins.value;
     try{
       const raw=input.value.trim();if(!raw)throw Error('Введите хотя бы одно число.');
       const values=raw.split(/[\s;]+/).map(s=>Number(s.replace(',','.'))),data=describe(values,Number(bins.value));
       const f=n=>n===null?'не определено при n = 1':Number(n.toPrecision(7)).toLocaleString('ru-RU');
       output.textContent=`Наблюдений: ${data.n}. Среднее: ${f(data.mean)}. Медиана: ${f(data.median)}. Размах: ${f(data.range)}. Генеральная дисперсия (делитель n): ${f(data.populationVariance)}. Выборочная дисперсия (n − 1): ${f(data.sampleVariance)}. Генеральное стандартное отклонение: ${f(data.populationStd)}. Выборочное: ${f(data.sampleStd)}.`;
       graph.replaceChildren();const largest=Math.max(...data.histogram.map(b=>b.count));
       data.histogram.forEach((b,i)=>{const row=el('div');row.className='histogram-row';const text=el('span',`[${f(b.from)}; ${f(b.to)}${i===data.histogram.length-1?']':')'}: ${b.count}`),bar=el('div');bar.className='histogram-bar';bar.style.width=(b.count/largest*100)+'%';row.append(text,bar);graph.append(row)});
     }catch(e){output.textContent=e.message;graph.replaceChildren();}
   }
   input.addEventListener('input',calculate);bins.addEventListener('input',calculate);
   box.append(label,binLabel,output,graph,el('p','Интервалы одинаковой ширины; правая граница включена только в последний интервал. Для одинаковых чисел показан один интервал ширины 1. Это учебный калькулятор; вывод округлён до 7 значащих цифр.'));
   host.append(box);calculate();root.CodeMentorStatisticsAdvanced?.mount(host,{rec,setRec});
 }
 root.CodeMentorStatistics={describe,mount};
})(typeof window==='undefined'?globalThis:window);
