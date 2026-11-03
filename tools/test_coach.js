/* Unit tests for useful, specific explanations; run without Android or internet. */
'use strict';
const assert=require('node:assert/strict');
require('../www/coach.js');
const coach=globalThis.CodeMentorCoach;
const required=['goal','why','steps','prediction','mistake','try'];
const ids=Object.keys(coach.guides);
assert(ids.length>=25,'all beginner foundation modules should have worked explanations');
for(const id of ids){
  const guide=coach.guideFor(id);
  assert(required.every(key=>guide[key]),id+' missing pedagogical section');
  assert(guide.steps.length>=3,id+' missing ordered walkthrough');
  assert(guide.why.length>=45,id+' needs a useful real-world explanation');
  assert(guide.mistake.length>=20,id+' must describe a specific beginner error');
}
assert(!coach.guideFor('missing-id'));
const lesson={id:'path02',cases:[{stdin:[],stdout:'Кот\nПёс'}],hints:['Сверь число команд print()']};
const wrong=coach.mismatch(lesson,{index:1,expected:'Кот\nПёс',actual:'Кот'});
assert(wrong.includes('строка 2')&&wrong.includes('Число строк')&&wrong.includes('Сверь число'));
const spacing=coach.mismatch(lesson,{index:1,expected:'Кот',actual:'Кот '});
assert(spacing.includes('пробелами'),spacing);
const input=coach.mismatch({cases:[{stdin:['7','3']}],hints:['Посмотри на вычисление']},
  {index:1,expected:'10',actual:'73'});
assert(input.includes('ввод: 7, 3')&&input.includes('10')&&input.includes('73'));
const undefinedVar=coach.runtime('age is not defined',{hints:['Проверь переменную']});
assert(undefinedVar.includes('присваивание')&&undefinedVar.includes('age'));
assert(coach.runtime('После двоеточия требуется блок с отступом.',{}).includes('четыре пробела'));
assert(coach.runtime('Превышен лимит шагов программы.',{}).includes('Цикл'));
const matrix={type:'matrix',expected:[[1,2],[3,4]]};
const cell=coach.math(matrix,[[1,2],[3,9]],{learning:{errors:'Проверь сложение'}},{ok:false});
assert(cell.includes('строка 2, столбец 2')&&!cell.includes('верно: 4'));
const dimensions=coach.math(matrix,[[1,2,3]],{}, {ok:false});
assert(dimensions.includes('Размер'));
const blank=coach.math({type:'numeric',expected:3},null,{}, {ok:false});
assert(blank.includes('не все ячейки'));
const numeric=coach.math({type:'numeric',expected:3},5,{learning:{walkthrough:'Сначала посчитай все числа'}},{ok:false});
assert(numeric.includes('Сначала посчитай'));
console.log('PASS CodeMentor teaching guides:',ids.length,'and contextual Python/mathematics error explanations');
