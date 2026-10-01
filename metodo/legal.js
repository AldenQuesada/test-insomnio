// Renderizador das páginas legais. Um arquivo só serve os dois documentos:
// `/metodo/terminos/` e `/metodo/privacidad/`. Cada um é um index.html de
// quatro linhas que declara `window.DOC` e chama este script.
//
// O texto inteiro mora em `quiz_templates.schema.tsl_es.legales`, igual ao
// resto da página. Documento legal é justamente o que mais muda depois, e o
// que mais custa caro se mudar só numa cópia.
(function(){
  var CFG = window.QUIZ_CONFIG || {};
  var DOC = window.DOC;

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  var CSS = [
'*{margin:0;padding:0;box-sizing:border-box}',
'body{background:var(--noite);color:var(--clareza);font-family:Montserrat,system-ui,sans-serif;',
'  -webkit-font-smoothing:antialiased}',
'.caixa{max-width:780px;margin:0 auto;padding:54px 22px 80px}',
'.voltar{display:inline-block;font-size:13px;font-weight:600;letter-spacing:.06em;',
'  text-transform:uppercase;color:var(--saude);text-decoration:none;margin-bottom:36px}',
'.voltar:hover{color:var(--clareza)}',
'h1{font-family:"Bebas Neue",Montserrat,sans-serif;font-size:46px;line-height:1.04;',
'  letter-spacing:.01em;margin-bottom:14px}',
'.quem{font-size:15px;color:var(--apoio);margin-bottom:4px}',
'.doc-cnpj{font-size:14px;color:#7f879b}',
'.quando{font-size:13px;color:#7f879b;margin-top:16px;padding-bottom:26px;',
'  border-bottom:1px solid rgba(244,240,232,.12)}',
'p{font-family:Lora,Georgia,serif;font-size:16.5px;line-height:1.72;color:#d6dae5;',
'  margin-top:16px}',
'.intro p{font-size:17.5px}',
'section{margin-top:40px}',
'h2{font-size:19px;font-weight:700;line-height:1.3;color:var(--clareza);',
'  display:flex;gap:12px;align-items:baseline}',
'h2 .n{font-family:"Bebas Neue",sans-serif;font-size:24px;color:var(--saude);',
'  flex:0 0 auto;line-height:1}',
'ul{list-style:none;margin-top:16px;display:flex;flex-direction:column;gap:9px}',
'li{font-family:Lora,Georgia,serif;font-size:16.5px;line-height:1.6;color:#d6dae5;',
'  padding-left:20px;position:relative}',
'li::before{content:"";position:absolute;left:3px;top:11px;width:6px;height:6px;',
'  border-radius:50%;background:var(--saude)}',
'.assina{margin-top:24px;padding:20px 22px;background:var(--noite-2);border-radius:9px;',
'  border-left:3px solid var(--saude)}',
'.assina b{font-family:Montserrat,sans-serif;font-size:15px;display:block;margin-bottom:5px}',
'.assina span{font-family:Montserrat,sans-serif;font-size:14px;color:#9aa2b6;display:block}',
'@media (min-width:760px){ h1{font-size:60px} .caixa{padding-top:72px} }'
  ].join('\n');

  function secao(s, i){
    var h = '<section><h2><span class="n">' + (i + 1) + '</span>' + esc(s.t) + '</h2>';
    (s.p || []).forEach(function(t){ h += '<p>' + esc(t) + '</p>'; });
    if ((s.itens || []).length) {
      h += '<ul>' + s.itens.map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    }
    (s.p2 || []).forEach(function(t){ h += '<p>' + esc(t) + '</p>'; });
    return h + '</section>';
  }

  function pintar(L){
    var d = L[DOC];
    if (!d) throw new Error('documento no encontrado');
    document.title = d.titulo + ' · ' + L.entidad;

    var h = '<div class="caixa">' +
      '<a class="voltar" href="../">&#8249; ' + esc(L.volver || '') + '</a>' +
      '<h1>' + esc(d.titulo) + '</h1>' +
      '<p class="quem">' + esc(L.entidad || '') + '</p>' +
      (L.cnpj ? '<p class="doc-cnpj">' + esc(L.cnpj) + '</p>' : '') +
      (L.actualizado ? '<p class="quando">' + esc(L.actualizado) + '</p>' : '') +
      '<div class="intro">' +
        (d.intro || []).map(function(t){ return '<p>' + esc(t) + '</p>'; }).join('') +
      '</div>' +
      (d.secciones || []).map(secao).join('') +
      // O bloco de identificação fecha os dois documentos. O canal de
      // atendimento só é desenhado quando existe: prometer um canal que não
      // existe num documento legal é pior que não citar canal nenhum.
      '<div class="assina"><b>' + esc(L.entidad || '') + '</b>' +
        (L.cnpj ? '<span>' + esc(L.cnpj) + '</span>' : '') +
        (L.contacto ? '<span>' + esc(L.contacto) + '</span>' : '') +
      '</div></div>';

    document.getElementById('doc').innerHTML = h;
  }

  var st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  fetch(CFG.url + '/rest/v1/quiz_templates?select=schema&slug=eq.' + CFG.slug + '&active=eq.true', {
    headers: { apikey: CFG.anon, Authorization: 'Bearer ' + CFG.anon }
  }).then(function(r){ return r.json(); }).then(function(linhas){
    if (!linhas || !linhas.length) throw new Error('página no encontrada');
    pintar(((linhas[0].schema || {}).tsl_es || {}).legales || {});
  }).catch(function(e){
    document.getElementById('doc').innerHTML =
      '<div class="caixa"><p>No pudimos cargar este documento. ' +
      'Vuelve a intentarlo en unos minutos.</p></div>';
    if (window.console) console.error(e);
  });
})();
