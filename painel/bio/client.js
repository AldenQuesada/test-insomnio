/* One request at a time; stop on hidden/offline, ignore superseded responses. */
export function createRefreshLoop({request,onData,onError,onBusy=()=>{},interval=15000,setTimer=setTimeout,clearTimer=clearTimeout}){
 let enabled=false,busy=false,revision=0,timer=null,controller=null,pending=false,args=null;
 function clear(){if(timer!==null)clearTimer(timer);timer=null;}
 async function run(){
  clear();if(!enabled||busy)return;busy=true;pending=false;const version=revision,input=args;
  controller=new AbortController();onBusy(true);
  try{const data=await request(input,controller.signal);if(enabled&&version===revision)onData(data);}
  catch(error){if(enabled&&version===revision&&error.name!=='AbortError')onError(error);}
  finally{busy=false;controller=null;onBusy(false);if(enabled){if(pending)run();else timer=setTimer(run,interval);}}
 }
 return {
  start(input){args=input;enabled=true;revision++;pending=true;clear();if(busy)controller?.abort();else run();},
  stop(){enabled=false;revision++;pending=false;clear();controller?.abort();},
  refresh(){if(!enabled)return;revision++;pending=true;clear();if(busy)controller?.abort();else run();}
 };
}

export function createRequest({session,config,fetcher=fetch}){
 let renewal=null;
 return async function request(args,signal){
  async function renew(){if(!renewal)renewal=Promise.resolve(session.renovar()).finally(()=>{renewal=null;});return renewal;}
  if(!session.viva()&&!await renew())throw Object.assign(new Error('Session expired'),{code:'AUTH'});
  for(let attempt=0;attempt<2;attempt++){
   const s=session.guardada();if(!s?.access_token)throw Object.assign(new Error('Session expired'),{code:'AUTH'});
   const c=new AbortController(),abort=()=>c.abort();let timeout=false;
   if(signal.aborted)throw new DOMException('Aborted','AbortError');
   signal.addEventListener('abort',abort,{once:true});
   const deadline=setTimeout(()=>{timeout=true;c.abort();},20000);
   try{
    const r=await fetcher(config.url+'/rest/v1/rpc/analytics_studio_report',{method:'POST',signal:c.signal,
     headers:{apikey:config.anon,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify(args)});
    if(r.status===401){if(attempt===0&&await renew())continue;throw Object.assign(new Error('Session expired'),{code:'AUTH'});}
    if(!r.ok)throw Object.assign(new Error('Report unavailable'),{code:r.status===403?'FORBIDDEN':'NETWORK'});
    const d=await r.json();if(!d||!d.checked_at||!['bio','insomnia','journey'].includes(d.module))throw new Error('Invalid report');return d;
   }catch(e){if(timeout)throw Object.assign(new Error('Timed out'),{code:'TIMEOUT'});throw e;}
   finally{clearTimeout(deadline);signal.removeEventListener('abort',abort);}
  }
 };
}
