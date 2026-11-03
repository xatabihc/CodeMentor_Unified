/* Independent visual preference: never modify or migrate learning records. */
(function(root){
 'use strict';
 const key='codementor-ui-theme-v1';
 const themes=['blue','red','green','purple','amber','night'];
 const names={blue:'Синяя',red:'Красная',green:'Зелёная',purple:'Фиолетовая',amber:'Оранжевая',night:'Тёмная'};
 function valid(value){return themes.includes(value)?value:'blue'}
 function current(){return valid(root.document?.documentElement?.getAttribute('data-theme'))}
 function apply(value){
  const theme=valid(value);
  root.document.documentElement.setAttribute('data-theme',theme);
  for(const b of root.document.querySelectorAll?.('[data-theme-choice]')||[]){
   b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme));
  }
  try{root.localStorage?.setItem(key,theme)}catch(e){}
  return theme;
 }
 function initial(){
  let saved='blue';try{saved=root.localStorage?.getItem(key)||saved}catch(e){}
  return apply(saved);
 }
 function setup(){
  initial();const host=root.document.getElementById('themePicker');
  if(!host)return;
  const grid=root.document.createElement('div');grid.className='theme-grid';
  for(const theme of themes){
   const button=root.document.createElement('button');
   button.type='button';button.className='theme-choice';button.dataset.themeChoice=theme;
   button.setAttribute('aria-label','Тема: '+names[theme]);
   const sample=root.document.createElement('span');sample.className='theme-swatch';
   sample.style.setProperty('--swatch',({blue:'#2563eb',red:'#dc3247',green:'#148b61',purple:'#8051dc',amber:'#bd5d0a',night:'#101b2d'})[theme]);
   const label=root.document.createElement('span');label.textContent=names[theme];
   button.append(sample,label);button.addEventListener('click',()=>apply(theme));grid.append(button);
  }
  host.append(grid);
  apply(current());
 }
 if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',setup);
 else setup();
 root.CodeMentorThemes={themes,valid,apply,current,storageKey:key};
})(typeof window==='undefined'?globalThis:window);
