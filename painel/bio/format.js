export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const num=n=>n==null?'—':Number(n).toLocaleString('pt-BR',{maximumFractionDigits:1});
export const pct=(n,d)=>d?num(100*n/d)+'%':'—';
export const seconds=n=>n==null?'—':num(n)+' s';
export function date(value,zone='America/Sao_Paulo',time=false){return value?new Date(value).toLocaleString('pt-BR',{timeZone:zone,...(time?{hour:'2-digit',minute:'2-digit',second:'2-digit'}:{day:'2-digit',month:'2-digit',year:'numeric'})}):'Sem registro';}
export function change(a,b){if(!b)return a?'Sem base anterior':'Sem variação registrada';return `${a>=b?'+':''}${num(100*(a-b)/b)}% vs. período anterior` ;}
export function csv(rows){return '\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/^[\s]*[=+@-]/,"'$&").replace(/"/g,'""')+'"').join(';')).join('\r\n');}
export const deviceLabel=x=>({mobile:'Celular',tablet:'Tablet',desktop:'Computador',unknown:'Não identificado',movel:'Celular',escritorio:'Computador'}[x]||x||'Não identificado');
export const sourceLabel=x=>x==='(sem origem)'?'Sem origem identificada':x;
export const browserLabel=x=>x==='unknown'?'Não identificado':x;
