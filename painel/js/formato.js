// Formato · só transforma valor em texto. Não sabe de banco, de tela nem de
// sessão, e não guarda nenhuma frase: as frases vêm todas do banco e passam
// por aqui apenas para receber os números.

export function esc(x){
  return String(x == null ? '' : x)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function num(n){
  return n == null ? '—' : Number(n).toLocaleString('pt-BR');
}

// Troca cada %s do texto do banco, na ordem, pelos valores dados. Chave que
// não existir devolve string vazia, e não o nome da chave: rótulo faltando no
// banco tem que sumir da tela, não virar código à mostra.
export function t(textos, chave, ...valores){
  let s = (textos && textos[chave]) || '';
  for (const v of valores) s = s.replace('%s', v);
  return s;
}

// "7 de cada 10" diz mais que "71%" para quem lê de relance. As três frases
// possíveis moram no banco.
export function emCada10(textos, parte, total){
  if (!total) return '';
  const x = Math.round(parte / total * 10);
  if (x <= 0)  return t(textos, 'quase_ninguem');
  if (x >= 10) return t(textos, 'quase_todos');
  return t(textos, 'de_cada_10', x);
}

export function pessoas(textos, n){
  return n === 1 ? t(textos, 'n_pessoa') : t(textos, 'n_pessoas', num(n));
}

export function dataBR(iso){
  return String(iso || '').split('-').reverse().join('/');
}

export function diaCurto(iso){
  return String(iso || '').slice(8);
}

export function segundos(textos, s){
  return s < 90 ? t(textos, 'agora_segundos', s)
                : t(textos, 'agora_minutos', Math.round(s / 60));
}

export function pct(parte, total){
  return total ? Math.round(parte / total * 100) : 0;
}

// Aparelho e navegador chegam crus do banco ('movel', vazio) e viram palavra
// aqui, com o que estiver na definição. O nome do app (Instagram, Facebook)
// passa direto: é nome próprio, não rótulo a traduzir.
export function rotuloAparelho(textos, aparelho){
  if (aparelho === 'movel')      return t(textos, 'aparelho_celular');
  if (aparelho === 'escritorio') return t(textos, 'aparelho_escritorio');
  return t(textos, 'aparelho_outro');
}

export function rotuloApp(textos, app){
  return app || t(textos, 'app_navegador');
}

export function rotuloCriativo(textos, criativo){
  return criativo || t(textos, 'sem_origem');
}
