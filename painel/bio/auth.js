/* Shares the existing panel login; stale refreshes cannot restore a signed-out session. */
const KEY='painel_sessao',EMAIL='painel_email';let generation=0,renewal=null;
export function guardada(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(_){return null;}}
export function viva(){const s=guardada();return !!s?.access_token&&(!s.expires_at||s.expires_at*1000-Date.now()>60000);}
export function emailLembrado(){try{return localStorage.getItem(EMAIL)||'';}catch(_){return '';}}
function save(s){if(!s?.access_token||!s.refresh_token)return null;if(!s.expires_at)s.expires_at=Math.floor(Date.now()/1000)+(s.expires_in||3600);try{localStorage.setItem(KEY,JSON.stringify(s));}catch(_){throw new Error('Storage unavailable');}return s;}
async function token(grant,body){const cfg=window.QUIZ_CONFIG,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{const r=await fetch(cfg.url+'/auth/v1/token?grant_type='+grant,{method:'POST',signal:controller.signal,headers:{apikey:cfg.anon,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)return null;return await r.json();}finally{clearTimeout(timer);}}
export function esquecer(){generation++;try{localStorage.removeItem(KEY);}catch(_){}}
export async function entrar(email,password){const own=++generation,s=await token('password',{email,password});if(own!==generation||!s?.access_token)return null;save(s);try{localStorage.setItem(EMAIL,email);}catch(_){}return s;}
export function renovar(){if(renewal)return renewal;const own=generation,previous=guardada();if(!previous?.refresh_token)return Promise.resolve(null);renewal=(async()=>{try{const s=await token('refresh_token',{refresh_token:previous.refresh_token});if(own!==generation)return null;if(!s?.access_token){const latest=guardada();return latest?.refresh_token!==previous.refresh_token&&viva()?latest:null;}return save(s);}catch(_){return null;}finally{renewal=null;}})();return renewal;}
