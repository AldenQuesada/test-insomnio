// Ícones · um conjunto de desenhos com nome. Quem escolhe QUAL ícone usar é o
// banco, que guarda só o nome; o desenho mora aqui.
//
// É o mesmo arranjo que o quiz usa nos badges desde a primeira versão, e é de
// propósito: SVG vindo do banco entraria na página como marcação, e bastaria
// alguém escrever na definição para injetar script na tela.

const T = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const DESENHOS = {
  olho:    `<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>`,
  olho_off:`<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`,
  toque:   `<path d="M9 11V6a2 2 0 1 1 4 0v5"/><path d="M13 11V9a2 2 0 1 1 4 0v2"/><path d="M17 11v-1a2 2 0 1 1 4 0v6a5 5 0 0 1-5 5h-3a6 6 0 0 1-5-2.7L5 15a2 2 0 0 1 3-2.6l1 1"/>`,
  gente:   `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>`,
  etiq:    `<path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.2"/>`,
  lista:   `<line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.5" cy="6" r="1.3"/><circle cx="4.5" cy="12" r="1.3"/><circle cx="4.5" cy="18" r="1.3"/>`,
  zap:     `<path d="M21 15.46v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.12 2.75 2 2 0 0 1 3.11.55h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.46a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.85.57 2.81.7a2 2 0 0 1 1.72 2.02z"/>`,
  certo:   `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
  alerta:  `<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
  megafone:`<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M16 8.5a4 4 0 0 1 0 7"/><path d="M19 5.5a8 8 0 0 1 0 13"/>`,
  pagina:  `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="15" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>`,
  carrinho:`<circle cx="9" cy="21" r="1.4"/><circle cx="19" cy="21" r="1.4"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>`,
  seta:    `<line x1="4" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>`
};

// Nome que não existe cai num ponto neutro, para a tela nunca ficar com um
// buraco por causa de um nome escrito errado no banco.
export function icone(nome){
  const d = DESENHOS[nome] || `<circle cx="12" cy="12" r="7"/>`;
  return `<svg viewBox="0 0 24 24" ${T}>${d}</svg>`;
}

export function existe(nome){ return Object.hasOwn(DESENHOS, nome); }
