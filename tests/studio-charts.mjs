import assert from 'node:assert/strict';
import {clickRanking,hourRanking,renderPlot,periodDays,clicksChart,dwellChart,durationChart} from '../painel/bio/charts.js';
const data={cards:[{id:'b',title:'B',clicks:2},{id:'a',title:'A',clicks:5},{id:'z',title:'Zero',clicks:0}],quality:{unidentified_clicks:3},current:{clicks:10,sessions:12,median_active_seconds:15},engagement:{timed_sessions:2,unmeasured_sessions:10,days:[{day:'2026-10-01',median_active_seconds:0,timed_sessions:1},{day:'2026-10-02',median_active_seconds:null,timed_sessions:0},{day:'2026-10-03',median_active_seconds:30,timed_sessions:1}],buckets:[{label:'Menos de 10 s',sessions:1},{label:'30 a 59 s',sessions:1}]}};
assert.deepEqual(clickRanking(data).map(r=>r.value),[5,3,2,0]);
assert.equal(clickRanking(data).reduce((s,r)=>s+r.value,0),data.current.clicks);
assert(clicksChart(data).includes('3 sem card identificado'));
assert.deepEqual(hourRanking([{hour:3,views:0},{hour:2,views:8},{hour:1,views:8}]).map(r=>r.hour),[1,2,3]);
assert.equal(periodDays('month',new Date('2026-11-01T02:59:00Z')),31);
assert.equal(periodDays('month',new Date('2026-11-01T03:00:00Z')),1);
assert.equal(periodDays('month',new Date('2028-02-29T15:00:00Z')),29);
assert.equal(periodDays('30'),30);
const rows=[0,null,30,10].map((value,i)=>({label:String(i),value,detail:'<script>bad</script>'}));
for(const width of [280,390,1000]){
 const svg=renderPlot({rows,kind:'line',unit:'s'},width,228);
 assert.equal((svg.match(/class="value-line"/g)||[]).length,1,'Missing measurement must break the line');
 assert.equal((svg.match(/data-point=/g)||[]).length,3,'Zero is measured; null is not');
 assert(!svg.includes('<script>'));assert(svg.includes('&lt;script&gt;'));assert(!/NaN|Infinity/.test(svg));
 const bars=renderPlot({rows:rows.filter(r=>r.value!==null),kind:'bars',unit:'sessões'},width,280);
 assert(!/NaN|Infinity/.test(bars));
}
assert(renderPlot({rows:[{value:null,label:'1'}],kind:'line',unit:'s'},300).includes('Sem medição'));
assert(renderPlot({rows:[{value:0,label:'1',detail:'0 visitas'}],kind:'line',unit:'visitas'},300).includes('data-point="0"'));
assert(dwellChart(data).includes('2 de 12 sessões com medição'));
assert(dwellChart(data).includes('Sem medição'));
assert(durationChart({...data,engagement:{...data.engagement,timed_sessions:0}}).includes('não entra como zero'));
console.log('PASS: rank order and reconciliation, unknown clicks, timezone/month/leap boundaries, duration gaps vs zero, responsive SVG, HTML escaping, measurement coverage and empty states.');
