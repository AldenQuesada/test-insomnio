/* First-party navigation correlation. No rendering, answers, contacts or ad SDKs. */
(function(root){
 'use strict';
 var KEY='instituto_journey_v1',ID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 var TTL=30*60*1000,MAX=24*60*60*1000,route=location.pathname==='/test-insomnio/'?'quiz':location.pathname==='/test-insomnio/metodo/'?'sales':null;
 var url=new URL(location.href),bio=url.searchParams.get('aq_bio'),flow=url.searchParams.get('aq_flow'),flag=url.searchParams.get('aq_i');
 var incoming=url.searchParams.has('aq_bio')||url.searchParams.has('aq_flow'),state=null,page='',internal=false,blocked=false;
 // Consume our own opaque parameters before any advertising SDK reads the URL.
 ['aq_bio','aq_flow','aq_i'].forEach(function(k){url.searchParams.delete(k);});
 if(url.href!==location.href){try{history.replaceState(history.state,'',url.href);}catch(_){blocked=true;}}
 function id(){if(root.crypto.randomUUID)return root.crypto.randomUUID();var b=new Uint8Array(16);root.crypto.getRandomValues(b);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;var h=Array.from(b,function(n){return n.toString(16).padStart(2,'0');}).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);}
 function privacy(){try{if(root.localStorage.getItem('instituto_analytics_optout')==='1')return true;}catch(_){}return blocked||!route||url.searchParams.get('medicao')==='off'||url.searchParams.has('ver')||navigator.globalPrivacyControl||navigator.doNotTrack==='1';}
 function save(){try{root.sessionStorage.setItem(KEY,JSON.stringify(state));}catch(_){}}
 function remove(){try{root.sessionStorage.removeItem(KEY);}catch(_){}}
 try{internal=root.localStorage.getItem('insonia_interno')==='1';}catch(_){}
 if(url.searchParams.has('interno'))internal=url.searchParams.get('interno')!=='0';
 else if(flag==='1'||flag==='0')internal=flag==='1';
 try{
  if(!privacy()){
   var now=Date.now(),stored=null,nav=root.performance&&root.performance.getEntriesByType('navigation')[0];
   try{stored=JSON.parse(root.sessionStorage.getItem(KEY));}catch(_){}
   var continuation=nav&&(nav.type==='reload'||nav.type==='back_forward');
   if(!incoming&&continuation&&stored&&stored.path===location.pathname&&stored.internal===internal&&ID.test(stored.id)&&now>=stored.last&&now-stored.last<TTL&&now-stored.born<MAX)state=stored;
   else state={id:ID.test(flow||'')?flow:id(),bio:ID.test(bio||'')?bio:null,born:now,last:now,path:location.pathname,internal:internal};
   page=id();save();
  }else remove();
 }catch(_){state=null;}
 function meta(){
  if(privacy()){state=null;remove();return null;}
  var now=Date.now();if(!state||now<state.last||now-state.last>=TTL||now-state.born>=MAX)return null;
  state.last=now;save();return {v:1,id:state.id,page:page,bio:state.bio,route:route,internal:internal};
 }
 function decorate(a){
  var m=meta();if(!m||route!=='quiz'||!a)return;
  try{var dest=new URL(a.href,location.href);if(dest.origin!==location.origin||dest.pathname!=='/test-insomnio/metodo/')return;
   dest.searchParams.set('aq_flow',m.id);if(m.bio)dest.searchParams.set('aq_bio',m.bio);else dest.searchParams.delete('aq_bio');dest.searchParams.set('aq_i',internal?'1':'0');a.href=dest.href;
  }catch(_){}
 }
 root.InstitutoJourney={meta:meta,decorate:decorate};
})(window);
