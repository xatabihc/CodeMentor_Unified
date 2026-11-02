(function(root){
 'use strict';
 function values(a){if(!Array.isArray(a)||!a.length||a.length>1000||!a.every(Number.isFinite))throw Error('Нужны 1–1000 конечных чисел');return [...a].sort((x,y)=>x-y)}
 function quantile(a,p){a=values(a);if(!Number.isFinite(p)||p<0||p>1)throw Error('Процентиль должен быть от 0 до 1');const h=(a.length-1)*p,i=Math.floor(h);return a[i]*(1-(h-i))+a[Math.min(i+1,a.length-1)]*(h-i)}
 function probability(p){if(!Number.isFinite(p)||p<0||p>1)throw Error('Вероятность должна быть между 0 и 1');return p}
 function bayes(prior,likelihood,alternative){[prior,likelihood,alternative].forEach(probability);const evidence=prior*likelihood+(1-prior)*alternative;if(evidence===0)throw Error('Условие имеет нулевую вероятность');return prior*likelihood/evidence}
 function binomial(n,k,p){probability(p);if(!Number.isInteger(n)||n<0||n>100||!Number.isInteger(k)||k<0||k>n)throw Error('Требуется 0 ≤ k ≤ n ≤ 100');let choose=1;for(let i=1;i<=k;i++)choose*=((n-i+1)/i);return choose*p**k*(1-p)**(n-k)}
 function normalPdf(x,mu=0,sigma=1){if(![x,mu,sigma].every(Number.isFinite)||sigma<=0)throw Error('Нужны конечные параметры, σ > 0');return Math.exp(-0.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI))}
 function normalCdf(x){if(!Number.isFinite(x))throw Error('Нужно конечное z');const t=1/(1+0.2316419*Math.abs(x)),d=Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);const tail=d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>=0?1-tail:tail}
 function confidence(mean,sigma,n){if(!Number.isFinite(mean)||!Number.isFinite(sigma)||sigma<=0||!Number.isInteger(n)||n<1)throw Error('Нужны среднее, σ > 0 и целое n ≥ 1');const margin=1.96*sigma/Math.sqrt(n);return [mean-margin,mean+margin]}
 function zTest(mean,nullMean,sigma,n){confidence(mean,sigma,n);if(!Number.isFinite(nullMean))throw Error('Нужно конечное μ₀');const z=(mean-nullMean)/(sigma/Math.sqrt(n));return {z,p:2*(1-normalCdf(Math.abs(z)))}}
 function regression(x,y){values(x);values(y);if(x.length!==y.length||x.length<2)throw Error('Нужны пары одинаковой длины, не меньше двух');const n=x.length,mx=x.reduce((s,v)=>s+v/n,0),my=y.reduce((s,v)=>s+v/n,0);let xx=0,xy=0,yy=0;for(let i=0;i<n;i++){xx+=(x[i]-mx)**2;xy+=(x[i]-mx)*(y[i]-my);yy+=(y[i]-my)**2}if(xx===0||![xx,xy,yy].every(Number.isFinite))throw Error('Значения x должны различаться; числа не должны быть чрезмерными');return {slope:xy/xx,intercept:my-xy/xx*mx,r:yy===0?null:Math.max(-1,Math.min(1,xy/Math.sqrt(xx)/Math.sqrt(yy)))}}
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
 function plot(host,points,line,title,xmin,xmax,ymin,ymax){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 600 260');svg.setAttribute('role','img');svg.setAttribute('aria-label',title);svg.style.width='100%';svg.style.height='auto';svg.style.display='block';
  function shape(tag,attrs){const n=document.createElementNS(svg.namespaceURI,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);svg.append(n);return n}
  const X=x=>45+(x-xmin)/(xmax-xmin)*530,Y=y=>225-(y-ymin)/(ymax-ymin)*195;
  shape('path',{d:'M45 25 V225 H580',stroke:'#536580',fill:'none'});
  if(line)shape('polyline',{points:line.map(([x,y])=>X(x)+','+Y(y)).join(' '),stroke:'#4563e7','stroke-width':3,fill:'none'});
  for(const [x,y] of points)shape('circle',{cx:X(x),cy:Y(y),r:4,fill:'#168768'});
  for(const [x,y,text] of [[45,250,xmin.toPrecision(3)],[520,250,xmax.toPrecision(3)],[0,30,ymax.toPrecision(3)]])shape('text',{x,y,fill:'currentColor','font-size':12}).textContent=text;
  host.replaceChildren(svg);
 }
 function mount(host,{rec,setRec}){
  const normal=el('details');normal.append(el('summary','Нормальное распределение · изменяй μ и σ'));const graph=el('div'),out=el('p');
  const mu=el('input'),sigma=el('input');let stored={mu:0,sigma:1};try{stored=JSON.parse(rec('statistics:normal').draft)||stored}catch(e){}
  for(const [input,label,min,max,step,v] of [[mu,'Среднее μ',-5,5,.1,stored.mu],[sigma,'Отклонение σ',.5,4,.1,stored.sigma]]){input.type='range';input.min=min;input.max=max;input.step=step;input.value=v;input.setAttribute('aria-label',label);const l=el('label',label);l.append(input);normal.append(l)}
  function drawNormal(persist=false){const m=Number(mu.value),s=Number(sigma.value);out.textContent=`μ = ${m}; σ = ${s}. Площадь под всей плотностью равна 1. Высота кривой не является вероятностью точки. Вероятность μ−σ ≤ X ≤ μ+σ ≈ 0,6827.`;plot(graph,[],Array.from({length:201},(_,i)=>{const x=-10+i/10;return [x,normalPdf(x,m,s)]}),'Плотность нормального распределения на фиксированной оси x от −10 до 10',-10,10,0,.85);if(persist)setRec('statistics:normal',{draft:JSON.stringify({mu:m,sigma:s})})}
  mu.oninput=sigma.oninput=()=>drawNormal(true);normal.append(out,graph);host.append(normal);drawNormal();
  const lab=el('details');lab.append(el('summary','Корреляция и регрессия · парные наблюдения'));const input=el('textarea');input.rows=5;input.setAttribute('aria-label','Пары x y, одна пара в строке');input.value=rec('statistics:regression').draft??'1 2\n2 4\n3 5\n4 8';const label=el('label','Одна пара x y в строке. Десятичная запятая допустима.');label.append(input);const text=el('p'),chart=el('div');text.setAttribute('aria-live','polite');
  function drawRegression(persist=false){if(persist)setRec('statistics:regression',{draft:input.value});try{const pairs=input.value.trim().split('\n').map(r=>r.trim().split(/\s+/).map(v=>Number(v.replace(',','.'))));if(pairs.some(r=>r.length!==2))throw Error('В каждой строке нужно два числа');const x=pairs.map(r=>r[0]),y=pairs.map(r=>r[1]),r=regression(x,y),xmin=Math.min(...x),xmax=Math.max(...x),line=[[xmin,r.intercept+r.slope*xmin],[xmax,r.intercept+r.slope*xmax]],all=y.concat(line.map(r=>r[1])),lo=Math.min(...all),hi=Math.max(...all);text.textContent=`ŷ = ${r.intercept.toPrecision(5)} + (${r.slope.toPrecision(5)})x. Корреляция Пирсона: ${r.r===null?'не определена при постоянном y':r.r.toPrecision(5)}. Корреляция не доказывает причинность.`;plot(chart,pairs,line,'Наблюдения и прямая наименьших квадратов',xmin,xmax,lo-1,hi+1)}catch(e){text.textContent=e.message;chart.replaceChildren()}}
  input.oninput=()=>drawRegression(true);lab.append(label,text,chart);host.append(lab);drawRegression();
 }
 root.CodeMentorStatisticsAdvanced={quantile,bayes,binomial,normalPdf,normalCdf,confidence,zTest,regression,mount};
})(typeof window==='undefined'?globalThis:window);
