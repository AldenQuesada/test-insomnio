// Api · fala com o banco. Uma porta só.
//
// Não sabe o que cada função devolve nem o que a tela faz com isso: recebe o
// nome da função e os argumentos, entrega o que voltou. Token vencido no meio
// do caminho é renovado uma vez, em silêncio.

import { guardada, renovar } from './sessao.js';

function cfg(){ return window.QUIZ_CONFIG; }

export const SEM_SESSAO = 'sem_sessao';

// Função que a tela de login precisa ANTES de existir sessão: vai com a chave
// pública mesmo. É a única.
export async function chamarPublica(funcao, args = {}){
  const r = await fetch(cfg().url + '/rest/v1/rpc/' + funcao, {
    method: 'POST',
    headers: {
      apikey: cfg().anon,
      Authorization: 'Bearer ' + cfg().anon,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });
  if (!r.ok) throw new Error(funcao);
  return r.json();
}

export async function chamar(funcao, args = {}, segunda = false){
  const s = guardada();
  if (!s || !s.access_token) throw SEM_SESSAO;

  const r = await fetch(cfg().url + '/rest/v1/rpc/' + funcao, {
    method: 'POST',
    headers: {
      apikey: cfg().anon,
      Authorization: 'Bearer ' + s.access_token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });

  if (r.status === 401 && !segunda) {
    const novo = await renovar();
    if (!novo) throw SEM_SESSAO;
    return chamar(funcao, args, true);
  }
  if (!r.ok) throw new Error(funcao);
  return r.json();
}
