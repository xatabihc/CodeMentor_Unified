/* Small dense matrices, bounded finite arithmetic; no evaluation of user expressions. */
(function(root){
 'use strict';const EPS=1e-9;
 function matrix(a){if(!Array.isArray(a)||!a.length||a.length>8||!Array.isArray(a[0])||!a[0].length||a[0].length>9||!a.every(r=>Array.isArray(r)&&r.length===a[0].length&&r.every(Number.isFinite)))throw Error('Нужна прямоугольная матрица конечных чисел');return a.map(r=>r.slice())}
 function transpose(a){a=matrix(a);return a[0].map((_,j)=>a.map(r=>r[j]))}
 function combine(a,b,sign=1){a=matrix(a);b=matrix(b);if(a.length!==b.length||a[0].length!==b[0].length)throw Error('Размеры должны совпадать');return a.map((r,i)=>r.map((v,j)=>v+sign*b[i][j]))}
 function multiply(a,b){a=matrix(a);b=matrix(b);if(a[0].length!==b.length)throw Error('Столбцов A должно быть столько же, сколько строк B');return a.map(r=>b[0].map((_,j)=>r.reduce((s,v,k)=>s+v*b[k][j],0)))}
 function det(a){a=matrix(a);if(a.length!==a[0].length||a.length>3)throw Error('Определитель поддерживает квадратные матрицы до 3×3');if(a.length===1)return a[0][0];return a[0].reduce((s,v,j)=>s+(j%2?-1:1)*v*det(a.slice(1).map(r=>r.filter((_,k)=>k!==j))),0)}
 function rowOperation(a,op){a=matrix(a);const {kind,target,source,factor}=op;if(!Number.isInteger(target)||target<0||target>=a.length)throw Error('Некорректная строка');
  if(kind==='swap'||kind==='add'){if(!Number.isInteger(source)||source<0||source>=a.length||source===target)throw Error('Выбери две разные строки')}
  if(kind==='scale'||kind==='add'){if(!Number.isFinite(factor)||Math.abs(factor)>1e6||(kind==='scale'&&Math.abs(factor)<EPS))throw Error('Недопустимый множитель')}
  if(kind==='swap')[a[target],a[source]]=[a[source],a[target]];
  else if(kind==='scale')a[target]=a[target].map(v=>v*factor);
  else if(kind==='add')a[target]=a[target].map((v,j)=>v+factor*a[source][j]);else throw Error('Неизвестная операция');
  if(!a.every(r=>r.every(v=>Number.isFinite(v)&&Math.abs(v)<1e12)))throw Error('Слишком большие значения');return a;
 }
 function reduction(a){a=matrix(a);const steps=[];let row=0;
  function apply(op){a=rowOperation(a,op);steps.push({op,matrix:a.map(r=>r.slice())})}
  for(let col=0;col<a[0].length&&row<a.length;col++){
   let pivot=row;for(let i=row+1;i<a.length;i++)if(Math.abs(a[i][col])>Math.abs(a[pivot][col]))pivot=i;
   if(Math.abs(a[pivot][col])<EPS)continue;
   if(pivot!==row)apply({kind:'swap',target:row,source:pivot});
   if(Math.abs(a[row][col]-1)>EPS)apply({kind:'scale',target:row,factor:1/a[row][col]});
   for(let i=0;i<a.length;i++)if(i!==row&&Math.abs(a[i][col])>EPS)apply({kind:'add',target:i,source:row,factor:-a[i][col]});row++;
  }
  return {matrix:a,steps,rank:row};
 }
 function echelon(a){a=matrix(a);let last=-1,zero=false;for(const r of a){const pivot=r.findIndex(v=>Math.abs(v)>EPS);if(pivot<0){zero=true;continue}if(zero||pivot<=last)return false;last=pivot;}return true}
 function eigenvector(a,lambda,v){try{
  a=matrix(a);if(!Number.isFinite(lambda)||a.length!==a[0].length||!Array.isArray(v)||v.length!==a.length||!v.every(Number.isFinite))return false;
  const norm=Math.max(...v.map(Math.abs));if(norm===0)return false;v=v.map(x=>x/norm);
  return a.every((r,i)=>Math.abs(r.reduce((s,x,j)=>s+x*v[j],0)-lambda*v[i])<1e-8*(1+r.reduce((s,x)=>s+Math.abs(x),0)+Math.abs(lambda)));
 }catch(e){return false}}

 root.CodeMentorAlgebra={matrix,transpose,combine,multiply,det,rowOperation,reduction,echelon,eigenvector};
})(typeof window==='undefined'?globalThis:window);
