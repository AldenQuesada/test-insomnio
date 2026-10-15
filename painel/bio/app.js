import * as session from '../js/sessao.js';
import {chamar, SEM_SESSAO} from '../js/api.js';
import {render,csv} from './view.js?v=1';
const $=id=>document.getElementById(id);let data=null,request=0;
function login(){ $('login').hidden=false;$('app').hidden=true;$('email').value=session.emailLembrado(); }
function options(id,values){const select=$(id),selected=select.value;select.replaceChildren(new Option(id==='source'?'Todas':'Todos',''));(values||[]).filter(Boolean).sort().forEach(v=>select.add(new Option(v,v)));select.value=selected;}
async function load(){
 const seq=++request;$('status').textContent='Consultando os registros…';$('refresh').disabled=true;$('csv').disabled=true;$('content').setAttribute('aria-busy','true');
 try{
  const d=await chamar('analytics_bio_report',{p_days:Number($('days').value),p_internal:$('internal').checked,p_source:$('source').value||null,p_device:$('device').value||null,p_browser:$('browser').value||null});
  if(seq!==request)return;data=d;$('content').innerHTML=render(d);options('source',d.filters.sources);options('device',d.filters.devices);options('browser',d.filters.browsers);
  $('period').textContent=new Date(d.period.from).toLocaleDateString('pt-BR',{timeZone:d.config.timezone})+' até agora · '+d.config.timezone+' · '+(d.period.internal?'inclui testes internos':'tráfego sem marca de teste');
  $('status').textContent='Atualizado às '+new Date().toLocaleTimeString('pt-BR')+'. Comparação com o mesmo intervalo de tempo anterior.';$('csv').disabled=false;
 }catch(e){if(seq!==request)return;data=null;$('content').replaceChildren();if(e===SEM_SESSAO){session.esquecer();login();}else $('status').textContent='Não foi possível consultar os dados. Verifique sua conexão e se sua conta tem acesso ao painel da bio.';}
 finally{if(seq===request){$('refresh').disabled=false;$('content').removeAttribute('aria-busy');}}
}
async function open(){ $('login').hidden=true;$('app').hidden=false;await load(); }
$('form').onsubmit=async ev=>{ev.preventDefault();const b=ev.currentTarget.querySelector('button');b.disabled=true;$('login-error').textContent='';try{const s=await session.entrar($('email').value.trim(),$('password').value);if(!s)throw Error();$('password').value='';await open();}catch(_){$('login-error').textContent='Não foi possível entrar. Confira a conta e tente novamente.';}finally{b.disabled=false;}};
['days','source','device','browser','internal'].forEach(id=>$(id).addEventListener('change',load));$('refresh').onclick=load;
$('logout').onclick=()=>{request++;data=null;session.esquecer();$('content').replaceChildren();login();};
$('csv').onclick=()=>{if(!data)return;const url=URL.createObjectURL(new Blob([csv(data)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='bio-cards.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
if(session.guardada()&&(session.viva()||await session.renovar()))open();else login();
