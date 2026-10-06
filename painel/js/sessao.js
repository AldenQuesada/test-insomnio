// Sessão · entrar, sair e manter o acesso vivo. Só isso.
//
// Não sabe desenhar nada e não conhece o painel. Quem precisa de token pede
// aqui; quem precisa de dado pede em api.js.

const CHAVE_SESSAO = 'painel_sessao';
const CHAVE_EMAIL  = 'painel_email';

function cfg(){ return window.QUIZ_CONFIG; }

export function guardada(){
  try { return JSON.parse(localStorage.getItem(CHAVE_SESSAO) || 'null'); }
  catch (e) { return null; }
}

function guardar(s){
  try { localStorage.setItem(CHAVE_SESSAO, JSON.stringify(s)); } catch (e) {}
}

export function esquecer(){
  try { localStorage.removeItem(CHAVE_SESSAO); } catch (e) {}
}

export function emailLembrado(){
  try { return localStorage.getItem(CHAVE_EMAIL) || ''; } catch (e) { return ''; }
}

export async function entrar(email, senha){
  const r = await fetch(cfg().url + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: cfg().anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: senha })
  });
  const d = await r.json();
  if (!d || !d.access_token) return null;
  guardar(d);
  try { localStorage.setItem(CHAVE_EMAIL, email); } catch (e) {}
  lembrarNoNavegador(email, senha);
  return d;
}

// O token dura uma hora. Em vez de obrigar a entrar de novo, troca o de
// atualização por um novo e segue; só devolve nulo se ele também morreu.
export async function renovar(){
  const s = guardada();
  if (!s || !s.refresh_token) return null;
  try {
    const r = await fetch(cfg().url + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: cfg().anon, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    const d = await r.json();
    if (d && d.access_token) { guardar(d); return d; }
  } catch (e) {}
  return null;
}

// Verdadeira enquanto o token ainda tem mais de um minuto de vida.
export function viva(){
  const s = guardada();
  if (!s || !s.access_token) return false;
  return !s.expires_at || (s.expires_at * 1000 - Date.now() > 60000);
}

// Pede ao gerenciador de senhas do navegador para guardar. Só o Chrome atende
// esta chamada; nos outros quem resolve é o formulário da página.
function lembrarNoNavegador(email, senha){
  try {
    if (window.PasswordCredential && navigator.credentials?.store) {
      navigator.credentials
        .store(new window.PasswordCredential({ id: email, password: senha, name: email }))
        .catch(() => {});
    }
  } catch (e) {}
}
