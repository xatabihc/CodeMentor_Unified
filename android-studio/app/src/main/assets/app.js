(() => {
 'use strict';
 const lessons=[...(window.CODEMENTOR_LESSONS||[]),...(window.CODEMENTOR_MATH_LESSONS||[])];
 const byId=new Map(lessons.map(l=>[l.id,l]));
 const tracks=[['path','🌱','С нуля'],['python','🐍','Python'],['mooc','🎓','MOOC 2026'],['debug','🔧','Исправление ошибок'],['projects','🧩','Мини-проекты'],['linux','⌨','Linux'],['sql','🗃','SQLite'],['advanced','📦','Классы и файлы'],['linear-algebra','▦','Первые матрицы']];
 const $=x=>document.getElementById(x);
 let state={records:{},track:'path',lesson:'path01'};
 let activeCourse='python';
 function renderCourses(){
   const engine=window.CodeMentorLearning;if(!engine)return;
   const host=$('courses');host.replaceChildren();
   for(const course of engine.catalog(lessons)){
     const b=document.createElement('button');b.className='track'+(activeCourse===course.id?' active':'');
     const ids=course.levels.flatMap(x=>x.modules.flatMap(m=>m.lessons.map(l=>l.id)));
     b.textContent=course.title+' · '+ids.filter(id=>rec(id).completed).length+'/'+ids.length;
     b.onclick=()=>{saveDraft();activeCourse=course.id;state.track=course.id==='python'?'path':course.id;pickStart();save();render();closeNav();};host.appendChild(b);
   }
   const ready=lessons.some(l=>engine.courseForTrack(l.track)===activeCourse);
   $('courseStatus').textContent=ready?(activeCourse==='python'?'Все прежние разделы Python и практики сохранены.':'Уровень «С нуля» · модуль «Первые матрицы»'):'Курс готовится. Учебные модули пока не опубликованы.';
   document.querySelector('.panels')?.toggleAttribute('hidden',!ready);
   if(!ready){$('lessonTitle').textContent=engine.catalog(lessons).find(c=>c.id===activeCourse).title;$('lessonIntro').textContent='Начнём с нулевого уровня. Прогресс других направлений сохраняется.';}
 }
 const storageKey='codementor-unified-v1';let deferredInstall=null,checking=false,recoveryRequired=false,lastSavedAt=0;
 function restore(){
   const bridge=window.AndroidBridge;
   const sources=[()=>bridge?.loadProgress?.(),()=>localStorage.getItem(storageKey),()=>bridge?.loadProgressBackup?.(),()=>localStorage.getItem(storageKey+'.backup')];
   let failed=false;const candidates=[];
   recoveryRequired=false;
   for(const [index,read] of sources.entries()){
     try{
       const raw=read();if(!raw)continue;
       candidates.push({data:window.CodeMentorProgress.snapshot(raw),index});
     }catch(e){failed=true;console.warn('Не удалось прочитать копию прогресса:',e);}
   }
   // A native commit may fail after the browser copy succeeds. Keep the newer copy.
   candidates.sort((a,b)=>(b.data.saved_at||0)-(a.data.saved_at||0)||a.index-b.index);
   if(candidates.length){
     const selected=candidates[0],x=selected.data;
     if(window.CodeMentorLearning?.courses.some(c=>c.id===x.course))activeCourse=x.course;
     state.records=x.records;lastSavedAt=x.saved_at||0;
     if(tracks.some(t=>t[0]===x.track))state.track=x.track;
     if(selected.index>0&&failed)$('saveStatus').textContent='Прогресс восстановлен из локальной копии — экспортируй JSON';
     return;
   }
   if(failed){recoveryRequired=true;$('saveStatus').textContent='Данные повреждены. Запись приостановлена: импортируй резервный JSON.';}
 }
 function save(){
   if(recoveryRequired){$('saveStatus').textContent='Запись приостановлена: импортируй резервный JSON или экспортируй текущую работу.';return false;}
   lastSavedAt=Math.max(Date.now(),lastSavedAt+1);
   const data=JSON.stringify({version:1,records:state.records,track:state.track,course:activeCourse,saved_at:lastSavedAt});
   let stored=false;
   try{
     const previous=localStorage.getItem(storageKey);
     if(previous&&previous!==data){try{window.CodeMentorProgress.snapshot(previous);localStorage.setItem(storageKey+'.backup',previous);}catch(e){}}
     localStorage.setItem(storageKey,data);stored=true;
   }catch(e){}
   if(window.AndroidBridge?.saveProgress){
     try{stored=window.AndroidBridge.saveProgress(data);}catch(e){stored=false;}
   }
   $('saveStatus').textContent=stored?'Сохранено':'Ошибка записи — экспортируй данные!';
   return stored;
 }
 function rec(id){return (Object.hasOwn(state.records,id)?state.records[id]:null)||{draft:null,completed:0,attempts:0,hint_level:0,completed_at:null}}
 function setRec(id,patch){state.records[id]={...rec(id),...patch};save();}
 function inTrack(){return lessons.filter(l=>l.track===state.track&&(!window.CodeMentorLearning||window.CodeMentorLearning.courseForTrack(l.track)===activeCourse))}
 function unlocked(l){if(l.prerequisites)return l.prerequisites.every(id=>!!rec(id).completed);if(l.track!=='path')return true;const sequence=lessons.filter(x=>x.track==='path'),index=sequence.findIndex(x=>x.id===l.id);return index<=0||!!rec(sequence[index-1].id).completed}
 function pickStart(){let seq=inTrack();if(!seq.length)return;let next=seq.find(l=>!rec(l.id).completed)||seq[seq.length-1];state.lesson=next.id;}
 function esc(t){return String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 function renderTracks(){renderCourses();const host=$('tracks');host.replaceChildren();for(const [key,icon,title] of tracks.filter(t=>!window.CodeMentorLearning||window.CodeMentorLearning.courseForTrack(t[0])===activeCourse)){const a=lessons.filter(x=>x.track===key);const done=a.filter(x=>rec(x.id).completed).length;const b=document.createElement('button');b.className='track'+(state.track===key?' active':'');b.innerHTML=`<span class="trackicon">${icon}</span><span>${title}</span><span class="track-count">${done}/${a.length}</span>`;b.onclick=()=>{saveDraft();state.track=key;state.lesson=key==='path'?(a.find(x=>!rec(x.id).completed)||a[0]).id:a[0].id;save();render();closeNav();};host.appendChild(b)}}
 function renderList(){const list=$('lessonList');list.replaceChildren();const items=inTrack();$('sectionName').textContent=tracks.find(t=>t[0]===state.track)?.[2]||'Уроки';$('sectionCount').textContent=items.filter(x=>rec(x.id).completed).length+'/'+items.length;for(let i=0;i<items.length;i++){const l=items[i],locked=!unlocked(l),done=!!rec(l.id).completed;const b=document.createElement('button');b.disabled=locked&&activeCourse==='python';b.className=`lesson-link${state.lesson===l.id?' active':''}${done?' done':''}${locked?' locked':''}`;b.innerHTML=`<span class="lesson-icon">${done?'✓':locked?'🔒':i+1}</span><span class="lesson-name"><strong>${esc(l.title)}</strong><small>${esc(l.level||l.module||'Практика')}</small></span>`;b.onclick=()=>{saveDraft();state.lesson=l.id;render();closeNav()};list.appendChild(b)}}
 function saveDraft(){const current=byId.get(state.lesson);if(current&&!current.exercises&&$('editor')){const v=$('editor').value;if(v!==rec(current.id).draft)setRec(current.id,{draft:v})}}
 function result(kind,title,msg){const h=$('result');h.className='result'+(kind?' '+kind:'');h.replaceChildren();const heading=document.createElement('div');heading.className='result-title';heading.textContent=title;const p=document.createElement('p');p.textContent=msg;h.append(heading,p)}
 function render(){renderTracks();renderList();if(!inTrack().length){$('prevBtn').disabled=true;$('nextBtn').disabled=true;$('progressLabel').textContent='Модули готовятся';$('progressFill').style.width='0%';return;}let l=byId.get(state.lesson)||inTrack()[0];if(!l)return;state.lesson=l.id;let a=inTrack(),idx=a.findIndex(x=>x.id===l.id);let trackTitle=tracks.find(t=>t[0]===state.track)?.[2]||'Python';$('crumb').textContent=trackTitle;$('eyebrow').textContent=(l.module||trackTitle).toUpperCase()+(l.level?' · '+l.level.toUpperCase():'');$('lessonTitle').textContent=l.title;$('lessonIntro').textContent=l.intro||'';$('theoryHeading').textContent=l.title;$('theoryLines').replaceChildren();for(let s of l.theory||[]){const li=document.createElement('li');li.textContent=s;$('theoryLines').appendChild(li)}$('exampleCode').textContent=l.example||'—';$('taskText').textContent=l.task||'';$('fileLabel').textContent=l.track==='linux'?'terminal.sh':l.track==='sql'?'query.sql':'main.py';$('editor').value=rec(l.id).draft??l.starter??'';$('hintBtn').disabled=!(l.hints||[]).length;const hints=$('hints');hints.hidden=true;hints.textContent='';const learning=$('learningDetails');learning.replaceChildren();
 if(l.learning){
   for(const [key,title] of [['walkthrough','Разбор примера'],['first','Первый шаг · самопроверка'],['medium','Практика посложнее · самопроверка'],['independent','Самостоятельная практика'],['errors','Частые ошибки'],['review','Вспоминаем пройденное'],['checkpoint','Контроль перед переходом']]){
     const heading=document.createElement('h3');heading.textContent=title;
     const text=document.createElement('p');text.textContent=Array.isArray(l.learning[key])?l.learning[key].join('\n'):l.learning[key]||'';
     learning.append(heading,text);
   }
 }
 const source=$('sourceLink');source.replaceChildren();if(l.source_url){const a=document.createElement('a');a.href=l.source_url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='↗ Оригинальный курс';a.style.cssText='display:inline-block;margin-top:18px;font-size:12px;color:#4c6bd1';source.appendChild(a)}
 const done=a.filter(x=>rec(x.id).completed).length;$('progressFill').style.width=(done/a.length*100)+'%';$('progressLabel').textContent=`${done} из ${a.length}`;$('prevBtn').disabled=idx<=0;$('nextBtn').disabled=idx>=a.length-1||(state.track==='path'&&!rec(l.id).completed);
 $('nextBtn').textContent=idx===a.length-1?'Конец раздела':'Дальше →';const unavailable=!['python-subset','text'].includes(l.checking?.mode);$('runBtn').disabled=unavailable;$('runBtn').textContent=unavailable?'Автопроверка недоступна':'▶ Проверить';$('checkStatus').textContent=l.checking?.reason||'Проверка для этого урока ещё не подтверждена.';
 if(unavailable)result('','Самостоятельная практика',l.checking?.reason||'Автоматическая проверка для этого урока ещё не подтверждена.');else if(rec(l.id).completed)result('success','Урок пройден','Решение уже было засчитано. Можешь повторить урок или перейти дальше.');else result('','Готов к практике','Допиши код и нажми «Проверить». Сначала попробуй самостоятельно.');
 const isMath=!!l.exercises;
 $('mathPractice').hidden=!isMath;
 for(const selector of ['.editor-head','#editor','#runBtn','#resetBtn'])document.querySelector(selector)?.toggleAttribute('hidden',isMath);
 if(isMath){
   $('checkStatus').textContent='Локальная проверка числового ответа, размера и значений матрицы.';
   $('nextBtn').disabled=idx>=a.length-1||!rec(l.id).completed;
   window.CodeMentorMathUI.mount($('mathPractice'),l,{rec,setRec,allowed:unlocked(l),notify:(ok,msg)=>result(ok?'success':'error',ok?'Правильно':'Попробуй ещё раз',msg),onComplete:()=>{finish(l,true,'Все три упражнения выполнены.');render();}});
   if(!rec(l.id).completed)result('','Математическая практика','Реши три небольших упражнения по порядку.');
 }
 const current=document.querySelector('.lesson-link.active');current?.scrollIntoView({block:'nearest'});
 window.scrollTo(0,0);
 }
 function mobileNav(){return window.matchMedia('(max-width:840px), (max-width:1024px) and (max-height:500px)').matches}
 function openNav(){
   if(!mobileNav())return;
   saveDraft();
   $('sidebar').removeAttribute('inert');$('sidebar').removeAttribute('aria-hidden');
   $('sidebar').classList.add('show');$('backdrop').classList.add('show');
   $('openNav').setAttribute('aria-expanded','true');
   document.documentElement.classList.add('nav-open');
   document.querySelector('.main')?.setAttribute('inert','');
   $('closeNav').focus({preventScroll:true});
 }
 function closeNav(restoreFocus=false){
   const opened=$('sidebar').classList.contains('show');
   $('sidebar').classList.remove('show');$('backdrop').classList.remove('show');
   $('openNav').setAttribute('aria-expanded','false');
   document.documentElement.classList.remove('nav-open');
   document.querySelector('.main')?.removeAttribute('inert');
   if(restoreFocus&&opened)$('openNav').focus({preventScroll:true});
   if(mobileNav()){$('sidebar').setAttribute('inert','');$('sidebar').setAttribute('aria-hidden','true');}
   else{$('sidebar').removeAttribute('inert');$('sidebar').removeAttribute('aria-hidden');}
 }
 function setupNav(){
   closeNav();
   $('openNav').onclick=openNav;
   $('closeNav').onclick=()=>closeNav(true);$('backdrop').onclick=()=>closeNav(true);
   document.addEventListener('keydown',e=>{
     if(!$('sidebar').classList.contains('show'))return;
     if(e.key==='Escape'){e.preventDefault();closeNav(true);}
     if(e.key==='Tab'){
       const items=[...$('sidebar').querySelectorAll('button:not(:disabled),a[href]')].filter(x=>x.getClientRects().length);
       const first=items[0],last=items[items.length-1];
       if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
       else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
     }
   });
   const media=window.matchMedia('(max-width:840px), (max-width:1024px) and (max-height:500px)');
   // A width breakpoint change is not an editor reset or a keyboard blur.
   if(media.addEventListener)media.addEventListener('change',()=>closeNav());
   else media.addListener(()=>closeNav());
 }
 function normalizeAnswer(s){return String(s).trim().replace(/;$/,'').replace(/\s+/g,' ').toLowerCase()}
 function check(){if(checking||activeCourse!=='python')return;const l=byId.get(state.lesson);if(!l)return;if(!['python-subset','text'].includes(l.checking?.mode)){result('','Самостоятельная практика',l.checking?.reason||'Автоматическая проверка для этого урока ещё не подтверждена.');return}const code=$('editor').value;setRec(l.id,{draft:code,attempts:(rec(l.id).attempts||0)+1});if(!code.trim()){result('error','Пока пусто','Напиши или дополни код перед проверкой.');return}
 if(l.track==='linux'){const ok=(l.answers||[]).some(a=>normalizeAnswer(a)===normalizeAnswer(code));finish(l,ok,ok?'Команда правильная. Она проверена как текст — не выполнялась на ноутбуке.':'Команда не совпала с ожидаемым вариантом. Посмотри теорию и попробуй ещё раз.');return}
 if(l.track==='sql'){const answer=l.sql_expected;if(answer){const ok=normalizeAnswer(answer)===normalizeAnswer(code);finish(l,ok,ok?'SQL-запрос совпал с проверочным образцом. Проверка текстовая — без выполнения SQL.':'Запрос отличается от учебного образца. Проверь столбцы, условия и сортировку. Сейчас используется текстовое сопоставление, без выполнения SQL.');return}result('','SQL: самостоятельная практика','Для данного SQL-урока автоматическая проверка не настроена.');return}
 if(!Array.isArray(l.cases)||!l.cases.length){result('','Учебный материал','Автоматическая проверка для этого урока пока недоступна. Теория и черновик сохраняются; решение можно запустить в установленном Python на ноутбуке.');return}
 checking=true;$('runBtn').disabled=true;const worker=new Worker('worker.js');let done=false;const stop=()=>{if(done)return;done=true;checking=false;$('runBtn').disabled=!['python-subset','text'].includes(byId.get(state.lesson)?.checking?.mode);worker.terminate();};const timeout=setTimeout(()=>{stop();if(state.lesson!==l.id)return;result('error','Выполнение остановлено','Код выполнялся слишком долго или содержит бесконечный цикл. Проверь условия остановки.');},1800);
 worker.onmessage=e=>{if(done)return;clearTimeout(timeout);stop();const d=e.data;if(state.lesson!==l.id)return;if(d.ok)finish(l,true,`Пройдены все проверки (${d.count}). Отличная работа!`);else finish(l,false,d.error?explainError(d.error):`Тест ${d.index}: ожидалось «${d.expected||'(пустой вывод)'}», получилось «${d.actual||'(пустой вывод)'}». Проверь условия и вывод.`)};
 worker.onerror=()=>{clearTimeout(timeout);stop();if(state.lesson!==l.id)return;result('error','Ошибка движка','Этот вариант Python пока не поддерживается веб-проверкой. Попробуй более простой синтаксис или настольную версию.');};
 worker.postMessage({id:l.id,code,cases:l.cases});
 }
 function explainError(message){
   const missing=String(message).match(/^([A-Za-z_]\w*) is not defined$/);
   if(missing&&!missing[1].startsWith('__'))return `Переменная «${missing[1]}» ещё не создана. Проверь её имя и присвой значение до использования.`;
   if(/Unexpected token|Unexpected identifier|Invalid or unexpected token/.test(message))return 'Не удалось разобрать код. Проверь скобки, кавычки, двоеточия и отступы. Этот режим поддерживает учебный поднабор Python.';
   return 'Ошибка: '+String(message);
 }
 function finish(l,ok,description){if(ok){setRec(l.id,{completed:1,completed_at:rec(l.id).completed_at||new Date().toISOString()});renderTracks();renderList();$('nextBtn').disabled=false;const list=inTrack(),done=list.filter(x=>rec(x.id).completed).length;$('progressFill').style.width=(done/list.length*100)+'%';$('progressLabel').textContent=`${done} из ${list.length}`;result('success','Правильно! ✓',description+' Теперь можно идти дальше.');}else result('error','Пока не получилось',description)}
 function downloadJSON(){saveDraft();const list=Object.entries(state.records).map(([id,r])=>({id,draft:String(r.draft||''),completed:r.completed?1:0,attempts:Math.max(0,Number(r.attempts)||0),hint_level:Math.max(0,Math.min(2,Number(r.hint_level)||0)),completed_at:r.completed_at||null}));const data={format:'codementor-progress',version:1,exported_at:new Date().toISOString(),lessons:list};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});if(window.AndroidBridge && typeof window.AndroidBridge.saveJson==='function'){window.AndroidBridge.saveJson('codementor-progress-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(data,null,2));return;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='codementor-progress-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
 async function importJSON(file){if(!file)return;try{if(file.size>5e6)throw Error('Максимум 5 МБ');let data=JSON.parse(await file.text());const staged=window.CodeMentorProgress.merge(state.records,data);const ids=new Set(data.lessons.map(r=>r.id));
 state.records=staged;recoveryRequired=false;const persisted=save();pickStart();render();alert(persisted?`Прогресс импортирован: ${ids.size} записей.`:'Прогресс загружен в память, но сохранить его не удалось. Экспортируй JSON перед выходом.');$('settingsDialog').close();}catch(e){alert('Не удалось импортировать: '+e.message)}finally{$('importFile').value=''}}
 function setup(){restore();pickStart();render();$('editor').addEventListener('input',()=>{setRec(state.lesson,{draft:$('editor').value})});$('editor').addEventListener('keydown',e=>{
 if(e.isComposing)return;
 if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();check();return}
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 const t=e.target,python=!['linux','sql'].includes(byId.get(state.lesson)?.track);
 const change=window.CodeMentorEditor.edit(t.value,t.selectionStart,t.selectionEnd,e.key,python);
 if(change&&change.value.length<=12000){e.preventDefault();t.value=change.value;t.setSelectionRange(change.start,change.end);t.dispatchEvent(new Event('input'));}
 });$('runBtn').onclick=check;$('hintBtn').onclick=()=>{const l=byId.get(state.lesson);let r=rec(l.id),level=Math.min(2,(r.hint_level||0)+1);setRec(l.id,{hint_level:level});$('hints').hidden=false;$('hints').textContent='💡 '+(l.hints||[]).slice(0,level).join('\n\n')};$('resetBtn').onclick=()=>{if(!confirm('Вернуть стартовый код этого задания?'))return;$('editor').value=byId.get(state.lesson).starter||'';setRec(state.lesson,{draft:$('editor').value});result('','Код сброшен','Можешь начать решение заново.')};$('prevBtn').onclick=()=>navigate(-1);$('nextBtn').onclick=()=>navigate(1);setupNav();$('settingsBtn').onclick=()=>{$('storageStatus').textContent=`${Object.keys(state.records).length} сохранённых уроков`; $('settingsDialog').showModal()};$('exportBtn').onclick=downloadJSON;$('exportQuick').onclick=downloadJSON;$('importFile').onchange=e=>importJSON(e.target.files[0]);window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('installPwa').hidden=false});$('installPwa').onclick=()=>{if(deferredInstall){deferredInstall.prompt();deferredInstall=null;$('installPwa').hidden=true}};if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
 }
 function navigate(n){saveDraft();let a=inTrack(),i=a.findIndex(l=>l.id===state.lesson),next=a[i+n];if(!next||!unlocked(next))return;state.lesson=next.id;render()}
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveDraft()});
 document.addEventListener('DOMContentLoaded',setup);
})();
