// Vista Agora · quem está no site neste momento.
//
// Desenha e nada mais. Quem busca é o painel; de quanto em quanto tempo
// buscar é o banco que diz, em `mapa.agora.atualiza_seg`.

import { esc, num, t, segundos, rotuloApp } from './formato.js';
import { icone } from './icones.js';

export function desenhar(alvo, cfg, agora){
  const T = cfg.textos;
  const gente = agora.pessoas || [];
  const u = agora.ultimos || {};
  const nomes = Object.fromEntries((cfg.mapa?.nos || []).map(n => [n.chave, n]));

  const titulo = gente.length === 1
    ? t(T, 'agora_uma')
    : t(T, 'agora_pessoas', num(gente.length));

  alvo.innerHTML = `
    <div class="agora-topo">
      <span class="pulso ${gente.length ? 'vivo' : ''}"></span>
      <b>${esc(titulo)}</b>
      <span class="agora-nota">${esc(t(T, 'agora_atualiza', agora.atualiza_seg))}</span>
    </div>
    ${gente.length ? `<div class="agora-lista">${gente.map(p => {
      const no = nomes[p.no] || {};
      return `<div class="agora-item">
        <span class="agora-ic">${icone(no.icone)}</span>
        <span class="agora-onde">${esc(no.rotulo || p.no)}</span>
        <span class="agora-quando">${esc(t(T, 'agora_ha', segundos(T, p.segundos)))}</span>
        <span class="agora-apar">${esc(rotuloApp(T, p.app))}</span>
      </div>`;
    }).join('')}</div>` : `<p class="vazio">${esc(t(T, 'vazio_agora'))}</p>`}
    <div class="agora-resumo">${esc(t(T, 'agora_ultimos', u.minutos))}
      <b>${esc(t(T, 'agora_abriram', num(u.abriram)))}</b> ·
      <b>${esc(t(T, 'agora_comecaram', num(u.comecaram)))}</b> ·
      <b>${esc(t(T, 'agora_leads', num(u.leads)))}</b>
    </div>`;
}

// Quais pontos do mapa têm gente agora, para o mapa acender.
export function pontosComGente(agora){
  return new Set((agora.pessoas || []).map(p => p.no));
}
