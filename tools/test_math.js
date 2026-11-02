const assert=require('assert'),fs=require('fs');require('../www/learning.js');
const lessons=JSON.parse(fs.readFileSync('curriculum_source/platform.json'));
for(const l of lessons)for(const e of l.exercises){
 const check=a=>CodeMentorLearning.check(e,a).ok;
 assert(check(e.expected));assert(!check(null));assert(!check(''));
 const wrong=JSON.parse(JSON.stringify(e.expected));
 if(['numeric','statistics'].includes(e.type))assert(!check(wrong+1));
 else if(e.type==='vector'){wrong[0]+=1;assert(!check(wrong));assert(!check([...e.expected,0]));}
 else {wrong[0][0]+=1;assert(!check(wrong));assert(!check([...e.expected,[0]]));}
}
console.log('PASS 39 math exercises: correct, wrong, empty and dimension boundary answers');
