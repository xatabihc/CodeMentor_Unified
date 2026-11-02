/* Keep native document gestures; never cancel touchmove or wheel events. */
(function(root){
 'use strict';
 function ensureVisible(){
   const field=document.activeElement;
   if(!field?.matches?.('input,textarea,select')||!field.isConnected)return;
   const viewport=root.visualViewport;
   const top=viewport?.offsetTop||0,bottom=top+(viewport?.height||root.innerHeight);
   const rect=field.getBoundingClientRect();
   // Only react when the input is clipped. Do not reset the editor caret/scroll.
   if(rect.bottom>bottom-16||rect.top<top+16)field.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
 }
 let queued=false;
 function schedule(){if(queued)return;queued=true;root.requestAnimationFrame(()=>{queued=false;ensureVisible()})}
 let previousHeight=root.visualViewport?.height||root.innerHeight;
 function resized(){const height=root.visualViewport?.height||root.innerHeight;const shrank=height<previousHeight-1;previousHeight=height;if(shrank)schedule()}
 root.addEventListener('resize',resized,{passive:true});
 root.visualViewport?.addEventListener('resize',resized,{passive:true});
 document.addEventListener('focusin',e=>{if(e.target.matches('input,textarea,select'))schedule()});
 root.CodeMentorViewport={ensureVisible};
})(window);
