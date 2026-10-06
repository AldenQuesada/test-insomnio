// Painel · junta as peças. Decide O QUE pedir e QUANDO, nunca o que dizer.
//
// Toda frase, o nome de cada passo, as abas, os períodos e o desenho do mapa
// vêm de `painel_config`. Se o banco mudar, a tela muda sem deploy.

import * as sessao from './sessao.js';
import { chamar, chamarPublica, SEM_SESSAO } from './api.js';
import { esc, t, dataBR } from './formato.js';
import { icone } from './icones.js';
import * as caminho from './vista-caminho.js';
import * as mapa from './vista-mapa.js';
import * as agora from './vista-agora.js';

const $ = id => document.getElementById(id);

let CFG = null;            // definição vinda do banco
let dias = 30;
let verInternos = false;
let aba = 'caminho';
let relogioAgora = null;

// ── login ───────────────────────────────────────────────────────────
async function pintarLogin(){
  let T = {};
  try { T = await chamarPublica('painel_login_textos', {}); } catch (e) {}
  $('login-titulo').textContent = t(T, 'entrar_titulo');
  $('login-apoio').textContent  = t(T, 'entrar_apoio');
  $('rot-email').textContent    = t(T, 'entrar_email');
  $('rot-senha').textContent    = t(T, 'entrar_senha');
  $('btentrar').textContent     = t(T, 'entrar_botao');
  $('ver-senha').setAttribute('aria-label', t(T, 'senha_mostrar'));
  $('form-login').dataset.textos = JSON.stringify(T);
}

function textosLogin(){
  try { return JSON.parse($('form-login').dataset.textos || '{}'); } catch (e) { return {}; }
}

function mostrarLogin(){
  $('tela-login').classList.remove('oculto');
  $('tela-painel').classList.add('oculto');
  pararAgora();
  const lembrado = sessao.emailLembrado();
  if (lembrado && !$('email').value) $('email').value = lembrado;
  ($('email').value ? $('senha') : $('email')).focus();
}

$('form-login').onsubmit = async ev => {
  ev.preventDefault();
  const T = textosLogin();
  const b = $('btentrar');
  const email = $('email').value.trim(), senha = $('senha').value;
  if (!email || !senha) return;
  b.disabled = true; b.textContent = t(T, 'entrar_enviando');
  $('erro-login').textContent = '';
  try {
    const d = await sessao.entrar(email, senha);
    b.disabled = false; b.textContent = t(T, 'entrar_botao');
    if (!d) { $('erro-login').textContent = t(T, 'entrar_errado'); return; }
    $('senha').value = '';
    if ($('senha').type === 'text') $('ver-senha').click();
    await abrirPainel();
  } catch (e) {
    b.disabled = false; b.textContent = t(T, 'entrar_botao');
    $('erro-login').textContent = t(T, 'entrar_sem_servidor');
  }
};

// Olho da senha. O rótulo dos dois estados vem do banco.
$('ver-senha').innerHTML = icone('olho');
$('ver-senha').onclick = function(){
  const T = textosLogin();
  const campo = $('senha');
  const escondida = campo.type === 'password';
  campo.type = escondida ? 'text' : 'password';
  this.innerHTML = icone(escondida ? 'olho_off' : 'olho');
  this.setAttribute('aria-pressed', String(escondida));
  this.setAttribute('aria-label', t(T, escondida ? 'senha_esconder' : 'senha_mostrar'));
  campo.focus();
  try { campo.setSelectionRange(campo.value.length, campo.value.length); } catch (e) {}
};

// ── barra de controles, montada da definição ────────────────────────
function montarControles(){
  const T = CFG.textos;
  $('titulo').textContent = CFG.titulo || '';
  $('btsair').textContent = t(T, 'sair');

  const padraoAba = (CFG.abas || []).find(a => a.padrao);
  aba = padraoAba ? padraoAba.chave : (CFG.abas?.[0]?.chave || 'caminho');
  $('abas').innerHTML = (CFG.abas || []).map(a =>
    `<button data-aba="${esc(a.chave)}" aria-pressed="${a.chave === aba}">${esc(a.rotulo)}</button>`).join('');

  const padraoPer = (CFG.periodos || []).find(p => p.padrao);
  dias = padraoPer ? padraoPer.dias : 30;
  $('periodos').innerHTML = (CFG.periodos || []).map(p =>
    `<button data-dias="${p.dias}" aria-pressed="${p.dias === dias}">${esc(p.rotulo)}</button>`).join('');

  $('bt-internos').textContent = t(T, 'internos_ligar');

  // Títulos de seção: a chave está no HTML, o texto vem do banco.
  document.querySelectorAll('[data-texto]').forEach(el => {
    el.textContent = t(T, el.dataset.texto);
  });
}

$('abas').onclick = ev => {
  const b = ev.target.closest('button'); if (!b) return;
  aba = b.dataset.aba;
  [...$('abas').children].forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  trocarAba();
};

$('periodos').onclick = ev => {
  const b = ev.target.closest('button'); if (!b) return;
  dias = parseInt(b.dataset.dias, 10);
  [...$('periodos').children].forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  carregar();
};

$('bt-internos').onclick = function(){
  verInternos = !verInternos;
  this.setAttribute('aria-pressed', String(verInternos));
  this.textContent = t(CFG.textos, verInternos ? 'internos_ligado' : 'internos_ligar');
  carregar();
};

$('btsair').onclick = () => { sessao.esquecer(); mostrarLogin(); };

// ── período ─────────────────────────────────────────────────────────
function desdeDe(n){
  if (!n) return null;
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function trocarAba(){
  document.querySelectorAll('[data-vista]').forEach(el =>
    el.classList.toggle('oculto', el.dataset.vista !== aba));
  if (aba === 'mapa') ligarAgora(); else pararAgora();
  carregar();
}

// ── carga ───────────────────────────────────────────────────────────
async function carregar(){
  const T = CFG.textos;
  $('resumo').textContent = t(T, 'carregando');
  const args = { p_desde: desdeDe(dias), p_ate: null, p_internos: verInternos };
  try {
    if (aba === 'mapa') {
      const d = await chamar('painel_mapa', { ...args, p_idioma: 'pt' });
      legenda(d.periodo || {});
      mapa.desenhar($('mapa'), CFG, d);
      await puxarAgora();
    } else {
      const d = await chamar('painel_funil', args);
      const p = d.periodo || {}, funil = d.funil || [];
      legenda(p);
      caminho.desenharNumeros($('numeros'), CFG, p, funil);
      caminho.desenharVeredito($('veredito'), CFG, funil, p.visitas || 0);
      if (!(p.visitas || 0)) $('fluxo').innerHTML = `<p class="vazio">${esc(t(T, 'vazio_caminho'))}</p>`;
      else caminho.desenharFluxo($('fluxo'), CFG, funil);
      caminho.desenharLista($('criativos'), CFG, d.criativos, l => l.criativo);
      caminho.desenharLista($('aparelhos'), CFG, d.aparelhos,
        l => `${l.app} · ${l.aparelho === 'movel' ? 'celular' : l.aparelho}`);
      caminho.desenharGrafico($('dias'), CFG, d.dias || []);
      caminho.desenharTecnico($('tecnico'), CFG, d.tecnico || {});
    }
  } catch (e) {
    if (e === SEM_SESSAO) { sessao.esquecer(); mostrarLogin(); return; }
    $('resumo').textContent = t(T, 'falhou');
  }
}

function legenda(p){
  const T = CFG.textos;
  $('resumo').textContent =
    (p.desde ? t(T, 'periodo_desde', dataBR(p.desde)) : t(T, 'periodo_tudo')) +
    t(T, p.internos ? 'modo_testes' : 'modo_real');
}

// ── agora ───────────────────────────────────────────────────────────
async function puxarAgora(){
  try {
    const d = await chamar('painel_agora', { p_internos: verInternos, p_idioma: 'pt' });
    agora.desenhar($('agora'), CFG, d);
    // Ponto com gente acende no mapa.
    const vivos = agora.pontosComGente(d);
    document.querySelectorAll('#mapa .pt').forEach(el =>
      el.classList.toggle('vivo', vivos.has(el.dataset.no)));
    return d.atualiza_seg || 10;
  } catch (e) { return 10; }
}

async function ligarAgora(){
  pararAgora();
  const seg = await puxarAgora();
  relogioAgora = setInterval(puxarAgora, Math.max(seg, 5) * 1000);
}
function pararAgora(){
  if (relogioAgora) { clearInterval(relogioAgora); relogioAgora = null; }
}
// Aba escondida não precisa perguntar ao banco de dez em dez segundos.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pararAgora();
  else if (aba === 'mapa' && !$('tela-painel').classList.contains('oculto')) ligarAgora();
});

// ── abertura ────────────────────────────────────────────────────────
async function abrirPainel(){
  $('tela-login').classList.add('oculto');
  $('tela-painel').classList.remove('oculto');
  if (!CFG) CFG = await chamar('painel_config', { p_idioma: 'pt' });
  montarControles();
  trocarAba();
}

(async function inicio(){
  await pintarLogin();
  if (!sessao.guardada()) { mostrarLogin(); return; }
  if (sessao.viva()) { await abrirPainel(); return; }
  const novo = await sessao.renovar();
  if (novo) await abrirPainel();
  else { sessao.esquecer(); mostrarLogin(); }
})();
