import {esc,num,seconds,pct} from './format.js?v=charts-2';

const dayLabel=day=>day.split('-').reverse().slice(0,2).join('/');
export function periodDays(value,now=new Date(),zone='America/Sao_Paulo'){
 return value==='month'?Number(new Intl.DateTimeFormat('en',{timeZone:zone,day:'numeric'}).format(now)):Number(value);
}
export function clickRanking(d){
 const rows=d.cards.map(c=>({id:c.id,label:c.title,value:Number(c.clicks)||0}));
 const unknown=Number(d.quality.unidentified_clicks)||0;
 if(unknown)rows.push({id:'unidentified',label:'Sem card identificado',value:unknown,unknown:true});
 return rows.sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label,'pt-BR'));
}
export function hourRanking(rows){return [...rows].sort((a,b)=>b.views-a.views||a.hour-b.hour);}
function exactTable(headers,rows,id){return `<details data-detail="${id}"><summary>Ver valores exatos</summary><div class="scroll"><table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;}
function figure(id,kind,rows,label,unit,footer,table){
 const spec={id,kind,rows,unit};
 return `<figure class="plot" data-plot="${id}"><div class="plot-scroll" tabindex="0" role="region" aria-label="${esc(label)}"><svg class="chart chart-${kind}" data-chart="${encodeURIComponent(JSON.stringify(spec))}" role="group" aria-label="${esc(label)}"${kind==='bars'?` style="min-width:${Math.max(300,rows.length*98+60)}px"`:''}></svg></div><figcaption><p class="chart-reading" data-reading>${esc(footer)}</p><p class="chart-help">Toque ou passe sobre ${kind==='line'?'os pontos':'as barras'} para consultar. Use as setas no teclado.</p></figcaption>${table}</figure>`;
}
export function visitsChart(d){
 const rows=d.days.map(r=>({label:dayLabel(r.day),value:r.views,detail:`${dayLabel(r.day)} · ${num(r.views)} visitas · ${num(r.sessions)} sessões · ${num(r.clicks)} cliques`}));
 const peak=rows.reduce((a,b)=>b.value>a.value?b:a,rows[0]);
 return figure('visits','line',rows,'Visitas por dia, em linhas','visitas',d.current.views?`${num(d.current.views)} visitas no período · pico em ${peak.label}: ${num(peak.value)}`:'Nenhuma visita registrada neste recorte.',exactTable(['Dia','Visitas','Sessões','Cliques'],d.days.map(r=>[r.day.split('-').reverse().join('/'),num(r.views),num(r.sessions),num(r.clicks)]),'visits-values'));
}
export function hoursChart(d){
 const rows=hourRanking(d.hours||[]),max=Math.max(1,...rows.map(r=>r.views)),total=rows.reduce((s,r)=>s+r.views,0);
 return `<figure class="plot"><div class="hours-scroll" tabindex="0" role="region" aria-label="Visitas por horário, barras horizontais do maior para o menor"><ol class="hour-bars">${rows.map(r=>`<li><span>${String(r.hour).padStart(2,'0')}h</span><div class="hour-track"><span style="width:${r.views/max*100}%"></span></div><strong>${num(r.views)}</strong><small>${total?pct(r.views,total):'—'}</small></li>`).join('')}</ol></div><figcaption><p class="chart-reading">${total?`Pico às ${String(rows[0].hour).padStart(2,'0')}h · ${num(rows[0].views)} visitas`:'Nenhuma visita registrada neste recorte.'}</p><p class="chart-help">24 horários · role para ver todos · horário de Brasília.</p></figcaption></figure>`;
}
export function clicksChart(d){
 const ranked=clickRanking(d),positive=ranked.filter(r=>r.value>0),rows=(positive.length?positive:ranked).map(r=>({...r,detail:`${r.label} · ${num(r.value)} cliques · ${pct(r.value,d.current.clicks)} do total`}));
 const sum=ranked.reduce((s,r)=>s+r.value,0),unknown=d.quality.unidentified_clicks||0;
 const footer=`${num(sum)} cliques no ranking${unknown?` · ${num(unknown)} sem card identificado`:''}${sum!==d.current.clicks?' · há diferença em relação ao total; consulte Saúde dos dados':''}.`;
 return figure('clicks','bars',rows,'Cliques por card, barras verticais do maior para o menor','cliques',footer,exactTable(['Card','Cliques','% dos cliques'],ranked.map(r=>[r.label,num(r.value),pct(r.value,d.current.clicks)]),'click-values'))+`<p class="note">${positive.length?'Cards sem cliques ficam na tabela de valores exatos. ':''}Cliques repetidos entram no total. Os não identificados ficam separados, sem atribuição a um livro.</p>`;
}
export function dwellChart(d){
 const e=d.engagement;
 if(!e)return '<div class="empty"><strong>Detalhamento de permanência indisponível</strong>A medição resumida continua no indicador acima.</div>';
 const rows=e.days.map(r=>({label:dayLabel(r.day),value:r.median_active_seconds,detail:`${dayLabel(r.day)} · ${r.median_active_seconds==null?'Sem medição':seconds(r.median_active_seconds)+' de tempo ativo mediano'} · ${num(r.timed_sessions)} sessões medidas`}));
 const footer=`${num(e.timed_sessions)} de ${num(d.current.sessions||0)} sessões com medição · ${num(e.unmeasured_sessions)} sem tempo medido.`;
 return figure('dwell','line',rows,'Tempo ativo mediano por dia, em segundos','s',footer,exactTable(['Dia de entrada','Mediana','Sessões medidas'],e.days.map(r=>[r.day.split('-').reverse().join('/'),r.median_active_seconds==null?'Sem medição':seconds(r.median_active_seconds),num(r.timed_sessions)]),'dwell-values'));
}
export function durationChart(d){
 const e=d.engagement;if(!e)return '<div class="empty"><strong>Aguardando detalhamento</strong></div>';
 if(!e.timed_sessions)return '<div class="empty"><strong>Sem sessões com tempo medido neste recorte</strong>O histórico sem medição não entra como zero segundos.</div>';
 const rows=e.buckets.map(r=>({label:r.label,value:r.sessions,detail:`${r.label} · ${num(r.sessions)} sessões · ${pct(r.sessions,e.timed_sessions)} das medidas`}));
 return figure('duration','bars',rows,'Distribuição do tempo ativo por sessão','sessões',`${num(e.timed_sessions)} sessões medidas · mediana geral de ${seconds(d.current.median_active_seconds)}.`,exactTable(['Tempo ativo','Sessões','% das medidas'],rows.map(r=>[r.label,num(r.value),pct(r.value,e.timed_sessions)]),'duration-values'));
}

// Pure SVG rendering: never interpolates unescaped labels and never fills nulls
// with zeros. Missing duration days split the line into separate segments.
export function renderPlot(spec,width,height=252){
 const {rows,kind,unit}=spec,left=46,right=18,top=28,bottom=kind==='bars'?83:32;
 const w=Math.max(1,width-left-right),h=height-top-bottom;
 const values=rows.filter(r=>r.value!==null&&Number.isFinite(r.value));
 const rawMax=Math.max(1,...values.map(r=>r.value));
 const tick=Math.max(1,Math.ceil(rawMax/4)),max=Math.ceil(rawMax/tick)*tick;
 const x=i=>kind==='bars'?left+w*(i+.5)/rows.length:left+(rows.length===1?w/2:w*i/(rows.length-1));
 const y=value=>top+h*(1-value/max),base=top+h;
 let html='';for(let value=0;value<=max;value+=tick){const py=y(value);html+=`<line x1="${left}" x2="${width-right}" y1="${py}" y2="${py}"/><text x="${left-8}" y="${py+4}" text-anchor="end">${esc(num(value))}</text>`;}
 html+=`<text x="${left}" y="12">${esc(unit)}</text>`;
 if(kind==='line'){
  let path='';rows.forEach((r,i)=>{if(r.value===null){path='';return;}const pos=`${x(i)},${y(r.value)}`;html+=path?`<path class="value-line" d="M${path} L${pos}"/>`:'';path=pos;});
 }
 const every=Math.max(1,Math.ceil(rows.length/(width<450?4:8))),first=rows.findIndex(r=>r.value!==null);
 rows.forEach((r,i)=>{
  const px=x(i),step=w/Math.max(1,rows.length),py=r.value===null?base:y(r.value);
  if(r.value!==null){
   const mark=kind==='bars'?`<rect class="series${r.unknown?' unknown':''}" x="${px-step*.28}" y="${py}" width="${step*.56}" height="${base-py}" rx="4"/><text class="bar-value" x="${px}" y="${py-9}" text-anchor="middle">${esc(num(r.value))}</text>`:`<circle class="value-dot" cx="${px}" cy="${py}" r="${r.value>0?3:2}"/>`;
   html+=`<g class="plot-point" role="button" tabindex="${i===first?'0':'-1'}" data-point="${i}" data-reading="${esc(r.detail)}" aria-label="${esc(r.detail)}"><title>${esc(r.detail)}</title>${mark}<rect class="plot-hit" x="${Math.max(left-8,px-step/2)}" y="${top}" width="${step}" height="${h+5}"/></g>`;
  }
  if(kind==='bars'){
   const words=r.label.split(' '),lines=[''];for(const word of words){const last=lines.length-1;if((lines[last]+' '+word).trim().length>15&&lines[last])lines.push(word);else lines[last]=(lines[last]+' '+word).trim();}
   html+=`<text text-anchor="middle">${lines.slice(0,4).map((line,n)=>`<tspan x="${px}" y="${base+22+n*13}">${esc(line)}</tspan>`).join('')}</text>`;
  }else if((i%every===0&&(i===0||x(rows.length-1)-px>52))||i===rows.length-1)html+=`<text x="${px}" y="${height-8}" text-anchor="${i===0?'start':i===rows.length-1?'end':'middle'}">${esc(r.label)}</text>`;
 });
 if(!values.length)html+=`<text x="${left+w/2}" y="${top+h/2}" text-anchor="middle">Sem medição neste período</text>`;
 return html;
}
const bound=new WeakSet();
export function drawCharts(root){
 root.querySelectorAll('svg[data-chart]').forEach(svg=>{
  const spec=JSON.parse(decodeURIComponent(svg.dataset.chart)),width=svg.clientWidth,height=svg.clientHeight;
  if(!width)return;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.innerHTML=renderPlot(spec,width,height);
 });
 if(bound.has(root))return;bound.add(root);
 const select=target=>{
  const p=target.closest?.('[data-point]');if(!p)return;const figure=p.closest('figure');
  figure.querySelector('.chart-reading').textContent=p.dataset.reading;
  figure.querySelectorAll('[data-point]').forEach(el=>{el.classList.toggle('selected',el===p);el.setAttribute('tabindex',el===p?'0':'-1');});
 };
 for(const event of ['pointerover','click','focusin'])root.addEventListener(event,e=>select(e.target));
 root.addEventListener('keydown',e=>{
  const p=e.target.closest?.('[data-point]');if(!p)return;
  if(['Enter',' '].includes(e.key)){e.preventDefault();select(p);return;}
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
  e.preventDefault();const points=[...p.closest('svg').querySelectorAll('[data-point]')],i=points.indexOf(p);
  const next=e.key==='Home'?0:e.key==='End'?points.length-1:Math.max(0,Math.min(points.length-1,i+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)));
  points[next]?.focus();
 });
}
