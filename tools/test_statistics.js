const assert=require('assert');require('../www/statistics.js');const describe=CodeMentorStatistics.describe;
const d=describe([2,4,4,4,5,5,7,9],4);
assert.equal(d.mean,5);assert.equal(d.median,4.5);assert.equal(d.populationVariance,4);assert.equal(d.sampleVariance,32/7);assert.equal(d.populationStd,2);
assert.equal(d.histogram.reduce((s,b)=>s+b.count,0),8);
assert.equal(describe([-3,-1,1,3]).median,0);
assert.equal(describe([1]).sampleVariance,null);assert.equal(describe([1]).sampleStd,null);
assert.equal(describe([3,3,3]).histogram.length,1);assert.equal(describe([3,3,3]).histogram[0].count,3);
for(const data of [[],[NaN],[Infinity],['1'],Array(1001).fill(0)])assert.throws(()=>describe(data));
assert.throws(()=>describe([1],0));assert.throws(()=>describe([1],21));assert.throws(()=>describe([1],1.5));
for(let n=1;n<=30;n++){const data=Array.from({length:n},(_,i)=>i-12);for(let k=1;k<=20;k++)assert.equal(describe(data,k).histogram.reduce((s,b)=>s+b.count,0),n);}
console.log('PASS statistical calculator: population/sample formula, negative/equal/single data, histogram boundaries and invalid input');
