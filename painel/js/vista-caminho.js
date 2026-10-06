// Vista Caminho · desenha o funil vertical do quiz, passo a passo.
//
// Recebe os dados prontos e a definição; não busca nada e não guarda estado
// fora do que o grupo das perguntas precisa para lembrar se está aberto.

import { esc, num, t, emCada10, pct, pessoas, dataBR, diaCurto } from './formato.js';
import { icone } from './icones.js';

let grupoAberto = false;

// Nome e ícone de cada passo vêm da definição. Pergunta numerada usa o modelo
// com %s, para somar pergunta sem mexer aqui.
function infoPasso(cfg, chave){
  const passos = cfg.passos || {};
  if (passos[chave]) return passos[chave];
  const m = /^pergunta_(\d+)$/.exec(chave);
  if (m) return { rotulo: t(cfg.textos, 'passo_pergunta_n') || (passos.pergunta?.rotulo || '').replace('%s', m[1]),
                  icone: passos.pergunta?.icone };
  return { rotulo: chave, icone: null };
}

function caixa(cfg, passo, topo, classe, aviso, acao){
  const i = infoPasso(cfg, passo.chave);
  const n = passo.n || 0;
  return `<div class="no ${classe || ''}">
    <div class="no-ic">${icone(i.icone)}</div>
    <div class="no-txt"><div class="no-n">${num(n)}</div>
      <span class="no-rot">${esc(i.rotulo)}</span>
      ${aviso ? `<span class="no-aviso">${esc(aviso)}</span>` : ''}
    </div>
    <div class="no-pct">${pct(n, topo)}%</div>
    ${acao || ''}
  </div>`;
}

function ligacao(cfg, antes, depois, pior, jaAvisado){
  const a = antes.n || 0, d = depois.n || 0;
  // Passo que CRESCE não é queda: é sinal de que o teste mudou de tamanho e as
  // visitas antigas não tinham essa pergunta.
  if (d > a) {
    return `<div class="elo limpo">${jaAvisado ? ''
      : `<p class="aviso">${esc(t(cfg.textos, 'passo_novo'))}</p>`}</div>`;
  }
  const perdeu = a - d;
  if (perdeu <= 0) {
    return `<div class="elo limpo"><div class="segue">${esc(t(cfg.textos, 'seguiram_todos'))}</div></div>`;
  }
  const grave = perdeu === pior && perdeu > 0;
  return `<div class="elo${grave ? ' grave' : ''}">
    <span class="cotovelo"></span>
    <div class="saiu">${esc(t(cfg.textos, 'saiu_aqui', num(perdeu), pct(perdeu, a)))}</div>
  </div>`;
}

export function desenharFluxo(alvo, cfg, funil){
  if (!funil.length) {
    alvo.innerHTML = `<p class="vazio">${esc(t(cfg.textos, 'vazio_caminho'))}</p>`;
    return;
  }
  const topo = funil[0].n || 0;

  let pior = 0;
  funil.forEach((p, i) => {
    if (!i) return;
    const perdeu = (funil[i - 1].n || 0) - (p.n || 0);
    if (perdeu > pior) pior = perdeu;
  });

  // As perguntas viram um bloco só. Oito caixas quase iguais empurravam o
  // resto da página para fora da tela e não diziam nada a mais.
  const antes = [], perg = [], depois = [];
  funil.forEach(p => {
    if (/^pergunta_/.test(p.chave)) perg.push(p);
    else if (perg.length) depois.push(p);
    else antes.push(p);
  });

  let html = '', avisoGrupo = '';
  antes.forEach((p, i) => {
    if (i) html += ligacao(cfg, antes[i - 1], p, pior);
    html += caixa(cfg, p, topo, i === 0 ? 'inicio' : '');
  });

  if (perg.length) {
    if (antes.length) html += ligacao(cfg, antes.at(-1), perg[0], pior);
    const ultima = perg.at(-1);
    avisoGrupo = (depois.length && (ultima.n || 0) < (depois[0].n || 0))
      ? t(cfg.textos, 'passo_novo_curto') : '';
    const rot = t(cfg.textos, 'grupo_perguntas', perg.length);
    const acao = `<button class="abrir" data-abre-perg aria-expanded="${grupoAberto}">${
      esc(t(cfg.textos, grupoAberto ? 'grupo_esconder' : 'grupo_abrir'))}</button>`;
    html += `<div class="grupo">${
      caixa({ ...cfg, passos: { ...cfg.passos, grupo_perg: { rotulo: rot, icone: cfg.passos?.grupo?.icone } } },
            { chave: 'grupo_perg', n: ultima.n }, topo, '', avisoGrupo, acao)}${
      grupoAberto ? `<div class="dentro">${perg.map((p, i) =>
        (i ? ligacao(cfg, perg[i - 1], p, pior) : '') + caixa(cfg, p, topo)).join('')}</div>` : ''}</div>`;
  }

  const cadeia = (perg.length ? [perg.at(-1)] : [antes.at(-1)]).concat(depois);
  depois.forEach((p, i) => {
    html += ligacao(cfg, cadeia[i], p, pior, i === 0 && !!avisoGrupo);
    html += caixa(cfg, p, topo, p.chave === 'lead' ? 'fim' : '');
  });

  alvo.innerHTML = html;
  const bt = alvo.querySelector('[data-abre-perg]');
  if (bt) bt.onclick = () => { grupoAberto = !grupoAberto; desenharFluxo(alvo, cfg, funil); };
}

export function desenharVeredito(alvo, cfg, funil, visitas){
  const T = cfg.textos;
  if (!visitas) {
    alvo.innerHTML = cartaoVeredito('ok', t(T, 'veredito_vazio'), t(T, 'veredito_vazio_corpo'));
    return;
  }
  let pior = null;
  funil.forEach((p, i) => {
    if (!i) return;
    const a = funil[i - 1].n || 0, perdeu = a - (p.n || 0);
    if (perdeu > 0 && (!pior || perdeu > pior.perdeu)) pior = { perdeu, para: p, antes: a };
  });
  if (!pior) {
    alvo.innerHTML = cartaoVeredito('ok', t(T, 'veredito_inteiro'), t(T, 'veredito_inteiro_corpo'));
    return;
  }
  const onde = infoPasso(cfg, pior.para.chave).rotulo.toLowerCase();
  const quantos = `${num(pior.perdeu)} ${t(T, pior.perdeu === 1 ? 'pessoa' : 'pessoas')}`;
  alvo.innerHTML = cartaoVeredito('',
    t(T, 'veredito_buraco', onde),
    t(T, 'veredito_buraco_corpo', emCada10(T, pior.perdeu, pior.antes), quantos));
}

function cartaoVeredito(tom, titulo, corpo){
  return `<div class="veredito ${tom}"><span class="ic">${icone(tom === 'ok' ? 'certo' : 'alerta')}</span>
    <div><b>${esc(titulo)}</b><p>${esc(corpo)}</p></div></div>`;
}

export function desenharNumeros(alvo, cfg, periodo, funil){
  const T = cfg.textos;
  const visitas = periodo.visitas || 0;
  const leads = (funil.find(x => x.chave === 'lead') || {}).n || 0;
  const conv = visitas ? (leads / visitas * 100) : 0;
  // Lead é VISITA que terminou o teste. Se a mesma pessoa terminar oito vezes,
  // são oito. Por isso o número de pessoas aparece junto.
  const rotLead = (periodo.pessoas != null && periodo.pessoas !== leads)
    ? t(T, 'n_leads_pessoas', pessoas(T, periodo.pessoas))
    : t(T, 'n_leads');
  alvo.innerHTML =
    bloco(num(visitas), t(T, 'n_visitas')) +
    bloco(num(leads), rotLead, 'bom') +
    bloco(conv.toFixed(1).replace('.', ',') + '%', t(T, 'n_conversao'));
}

function bloco(v, k, classe){
  return `<div class="bloco ${classe || ''}"><div class="v">${esc(v)}</div><div class="k">${esc(k)}</div></div>`;
}

export function desenharLista(alvo, cfg, linhas, nome){
  const T = cfg.textos;
  if (!linhas || !linhas.length) {
    alvo.innerHTML = `<p class="vazio">${esc(t(T, 'vazio_periodo'))}</p>`;
    return;
  }
  const maior = Math.max(...linhas.map(l => l.abriu || 0)) || 1;
  alvo.innerHTML = `<div class="lista">${linhas.map(l => {
    const conv = l.pct == null ? 0 : l.pct;
    return `<div class="item">
      <div class="fundo" style="width:${Math.round((l.abriu || 0) / maior * 100)}%"></div>
      <div class="frente">
        <span class="nome">${esc(nome(l))}</span>
        <span class="nums">
          <span>${esc(t(T, 'col_abriu', num(l.abriu)))}</span>
          <span>${esc(t(T, 'col_lead', num(l.lead)))}</span>
          <b class="conv${conv ? '' : ' zero'}">${conv}%</b>
        </span>
      </div>
    </div>`;
  }).join('')}</div>`;
}

export function desenharGrafico(alvo, cfg, dias){
  const T = cfg.textos;
  if (!dias.length) {
    alvo.innerHTML = `<p class="vazio">${esc(t(T, 'vazio_periodo'))}</p>`;
    return;
  }
  const ult = dias.slice(-14);
  const maior = Math.max(...ult.map(x => x.abriu || 0)) || 1;
  alvo.innerHTML = `<div class="graf">${ult.map(x => {
    const alt = Math.round((x.abriu || 0) / maior * 100);
    const parte = x.abriu ? Math.round((x.lead || 0) / x.abriu * 100) : 0;
    const dica = `${dataBR(x.dia)}: ${t(T, 'col_abriu', num(x.abriu))}, ${t(T, 'col_lead', num(x.lead))}`;
    return `<div class="col" title="${esc(dica)}">
      <div class="barra" style="height:${Math.max(alt, 3)}%"><div class="lead" style="height:${parte}%"></div></div>
      <span class="dia">${esc(diaCurto(x.dia))}</span>
    </div>`;
  }).join('')}</div>`;
}

export function desenharTecnico(alvo, cfg, tec){
  const T = cfg.textos;
  const seg = tec.ms_carga_mediano == null ? '—'
            : (tec.ms_carga_mediano / 1000).toFixed(1).replace('.', ',') + ' s';
  const cartoes = [
    { k: 'tec_carga',         v: seg },
    { k: 'tec_carga_lenta',   v: num(tec.carga_lenta),   alerta: tec.carga_lenta > 0 },
    { k: 'tec_erro_envio',    v: num(tec.erros_envio),   alerta: tec.erros_envio > 0 },
    { k: 'tec_fone_invalido', v: num(tec.fone_invalido), alerta: tec.fone_invalido > 0 },
    { k: 'tec_fone_vazio',    v: num(tec.fone_vazio) },
    { k: 'tec_tsl',           v: num(tec.abriu_tsl) }
  ];
  alvo.innerHTML = cartoes.map(c =>
    `<div class="cartao${c.alerta ? ' alerta' : ''}"><div class="v">${esc(c.v)}</div>
     <div class="k">${esc(t(T, c.k))}</div></div>`).join('');
}
