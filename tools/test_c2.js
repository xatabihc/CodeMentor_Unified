const assert=require('assert'),fs=require('fs');require('../www/statistics.js');require('../www/statistics-advanced.js');require('../www/learning.js');
const S=CodeMentorStatisticsAdvanced,D=CodeMentorStatistics,L=CodeMentorLearning;
const lessons=JSON.parse(fs.readFileSync('curriculum_source/platform.json')).filter(l=>l.id.startsWith('st-c2-'));
let count=0;
for(const l of lessons)for(const e of l.exercises){const a=e.args;let actual;
 switch(e.method){
  case 'pvariance':actual=D.describe(a.data).populationVariance;break;
  case 'variance':actual=D.describe(a.data).sampleVariance;break;
  case 'pstdev':actual=D.describe(a.data).populationStd;break;
  case 'quantiles':actual=a.ps.map(p=>S.quantile(a.data,p));break;
  case 'ratio':actual=a.favorable/a.total;break;
  case 'bayes':actual=S.bayes(a.prior,a.likelihood,a.alternative);break;
  case 'bernoulliVariance':actual=a.p*(1-a.p);break;
  case 'binomial':actual=S.binomial(a.n,a.k,a.p);break;
  case 'zscore':actual=(a.x-a.mu)/a.sigma;break;
  case 'normalInterval':actual=S.normalCdf(a.b)-S.normalCdf(a.a);break;
  case 'confidence':actual=S.confidence(a.mean,a.sigma,a.n);break;
  case 'ztest':actual=S.zTest(a.mean,a.nullMean,a.sigma,a.n).p;break;
  case 'correlation':actual=S.regression(a.x,a.y).r;break;
  case 'regression':{const r=S.regression(a.x,a.y);actual=[r.intercept,r.slope];break;}
  default:throw Error(e.method);
 }
 const arr=x=>Array.isArray(x)?x:[x];
 arr(actual).forEach((v,i)=>assert(Math.abs(v-arr(e.expected)[i])<1e-6,e.id+' independent standard-library reference mismatch'));
 assert(L.check(e,actual).ok,e.id);assert(!L.check(e,null).ok);assert(!L.check(e,'').ok);
 const wrong=Array.isArray(actual)?actual.map(v=>v+1):actual+1;assert(!L.check(e,wrong).ok);
 count++;
}
assert.equal(S.quantile([0,10],.25),2.5);assert.equal(S.quantile([-1e308,1e308],.5),0);
assert.throws(()=>S.quantile([],0));assert.throws(()=>S.quantile([1],2));assert.throws(()=>S.bayes(0,1,0));
assert.equal(S.binomial(0,0,.5),1);assert.equal(S.binomial(3,0,0),1);assert.equal(S.binomial(3,3,1),1);assert.throws(()=>S.binomial(2,3,.5));
assert(Math.abs(S.normalPdf(0)-1/Math.sqrt(2*Math.PI))<1e-15);assert.throws(()=>S.normalPdf(0,0,0));
assert(Math.abs(S.normalCdf(1)-.8413447460685429)<1e-7);assert(Math.abs(S.normalCdf(-1)+S.normalCdf(1)-1)<1e-12);
assert.throws(()=>S.confidence(0,1,0));assert.throws(()=>S.regression([1,1],[2,3]));assert.equal(S.regression([1,2],[3,3]).r,null);
console.log('PASS C2: '+count+' exercises vs Python standard-library references, wrong answers, boundaries, model restrictions');
