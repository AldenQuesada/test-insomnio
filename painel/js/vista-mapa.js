// Vista Mapa · desenha o caminho ENTRE PÁGINAS, na horizontal.
//
// Quantos pontos existem, como se chamam, em que linha ficam e quais setas os
// ligam: tudo vem pronto do banco. Esta vista não decide nada disso, só
// desenha o que recebe. Somar uma página nova ao funil é uma linha no banco.

import { esc, num, t, pct } from './formato.js';
import { icone } from './icones.js';

function ponto(cfg, no){
  const T = cfg.textos;
  const temNumero = no.n != null;
  const valor = temNumero ? num(no.n) : t(T, 'mapa_sem_dado');
  return `<div class="pt ${no.tom || ''} ${temNumero ? '' : 'vazio-dado'}" data-no="${esc(no.chave)}">
    <div class="pt-ic">${icone(no.icone)}</div>
    <div class="pt-n">${esc(valor)}</div>
    <div class="pt-rot">${esc(no.rotulo || '')}</div>
    ${no.sub ? `<div class="pt-sub">${esc(no.sub)}</div>` : ''}
    ${no.unidade && temNumero ? `<div class="pt-uni">${esc(no.unidade)}</div>` : ''}
    ${no.nota ? `<div class="pt-nota">${esc(no.nota)}</div>` : ''}
  </div>`;
}

// A seta carrega quantos passaram e, embaixo, quantos ficaram pelo caminho.
// A perda é desenhada SAINDO da seta, que é o que faz o buraco ser visto em
// vez de deduzido.
function seta(cfg, s){
  const T = cfg.textos;
  const de = s.de_n, fluxo = s.fluxo;
  const temPct = de != null && fluxo != null && de > 0;
  const perdeu = (de != null && fluxo != null && de >= fluxo) ? de - fluxo : null;
  const grave = temPct && perdeu > 0 && (fluxo / de) < 0.5;

  return `<div class="st ${s.lateral ? 'lateral' : ''} ${grave ? 'grave' : ''}">
    <div class="st-linha">
      <span class="st-traco"></span>
      ${temPct ? `<span class="st-pct">${pct(fluxo, de)}%</span>` : ''}
      <span class="st-ponta">${icone('seta')}</span>
    </div>
    ${perdeu > 0 ? `<div class="st-perda">
       <span class="st-x">${esc(t(T, 'mapa_perdeu', num(perdeu)))}</span>
       ${s.perda ? `<span class="st-txt">${esc(s.perda)}</span>` : ''}
     </div>` : ''}
  </div>`;
}

export function desenhar(alvo, cfg, mapa){
  const T = cfg.textos;
  const nos = mapa.nos || [];
  if (!nos.length) {
    alvo.innerHTML = `<p class="vazio">${esc(t(T, 'vazio_periodo'))}</p>`;
    return;
  }
  const porChave = Object.fromEntries(nos.map(n => [n.chave, n]));
  const setas = mapa.setas || [];

  // Cada ponto declara em qual linha fica. Linha 2 existe para quem entra pela
  // porta lateral, sem passar pelo quiz.
  const linhas = [...new Set(nos.map(n => n.linha || 1))].sort();

  alvo.innerHTML = `<div class="mapa">${linhas.map(num_linha => {
    const daLinha = nos.filter(n => (n.linha || 1) === num_linha);
    let html = '';
    daLinha.forEach((n, i) => {
      if (i) {
        const s = setas.find(x => x.para === n.chave && x.de === daLinha[i - 1].chave);
        html += s ? seta(cfg, s) : `<div class="st"><div class="st-linha"><span class="st-traco"></span>
                   <span class="st-ponta">${icone('seta')}</span></div></div>`;
      }
      html += ponto(cfg, n);
    });
    return `<div class="mapa-linha">${html}</div>`;
  }).join('')}</div>` + pontes(cfg, setas, porChave);
}

// Seta que sai de uma linha e cai na outra. É ela que mostra, de uma olhada,
// que o resultado do quiz não leva ninguém para a página de venda.
function pontes(cfg, setas, porChave){
  const entre = setas.filter(s => {
    const a = porChave[s.de], b = porChave[s.para];
    return a && b && (a.linha || 1) !== (b.linha || 1);
  });
  if (!entre.length) return '';
  return `<div class="pontes">${entre.map(s => {
    const seco = s.fluxo === 0;
    return `<div class="ponte ${seco ? 'seca' : ''}">
      <span class="ponte-de">${esc(porChave[s.de].rotulo)}</span>
      <span class="ponte-seta">${icone('seta')}</span>
      <span class="ponte-para">${esc(porChave[s.para].rotulo)}</span>
      <b class="ponte-n">${num(s.fluxo)}</b>
      ${s.perda && seco ? `<span class="ponte-txt">${esc(s.perda)}</span>` : ''}
    </div>`;
  }).join('')}</div>`;
}
