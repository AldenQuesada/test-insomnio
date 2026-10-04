// Rastreamento da página de venda.
//
// Duas camadas, de propósito:
//
//   1. O BANCO DELA (`quiz_events`), sempre. Não depende de pixel, de bloqueador
//      de anúncio nem de cookie aceito. É a fonte de verdade do funil: quantos
//      chegaram, até onde rolaram, em que bloco pararam, em qual botão
//      clicaram e quanto tempo ficaram.
//   2. Meta Pixel e GA4, só quando os IDs existirem em `schema.rastreio`. Sem
//      ID, ficam mudos, como no quiz.
//
// Os eventos usam o MESMO `session_id` do quiz quando a pessoa veio de lá. É
// isso que permite ler o funil inteiro de uma pessoa: respondeu o quiz, abriu
// a página, rolou até a pilha, clicou.
//
// Dado de saúde (nota, faixa, classificação) NUNCA vai para Pixel nem GA4.
// No banco também não é repetido: já está em `quiz_responses`, e o
// `session_id` liga as duas tabelas.
(function(){
  var R = {}, cfg = null, sessao = '', inicio = Date.now();
  var visivelDesde = Date.now(), visivelTotal = 0, rolouMax = 0;
  var feitos = {};          // eventos que só podem acontecer uma vez

  function agora(){ return Date.now(); }

  // Grava no banco. `manter` usa keepalive: o envio sobrevive à página
  // fechando, que é justamente quando o tempo de permanência é mandado.
  function gravar(tipo, meta, manter){
    if (!cfg || !cfg.quizId) return;
    try {
      fetch(cfg.url + '/rest/v1/quiz_events', {
        method: 'POST', keepalive: !!manter,
        headers: { apikey: cfg.anon, Authorization: 'Bearer ' + cfg.anon,
                   'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ quiz_id: cfg.quizId, session_id: sessao,
                               tipo: 'tsl_' + tipo, metadata: meta || {} })
      }).catch(function(){});
    } catch (e) {}
  }

  function uma(chave, fn){ if (feitos[chave]) return; feitos[chave] = 1; fn(); }

  // ── Pixel e GA4 ─────────────────────────────────────────────────────
  function ligarPixel(id){
    if (!id || window.fbq) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }
  function ligarGA4(id){
    if (!id || window.gtag) return;
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
  }
  // Mesmo id de evento no pixel e no banco: é o que evita contar duas vezes
  // se um dia entrar a API de Conversões pelo servidor.
  function anunciar(metaNome, gaNome, dados){
    var eid = sessao + '-' + metaNome + '-' + agora();
    try { if (window.fbq) window.fbq('track', metaNome, dados || {}, { eventID: eid }); } catch (e) {}
    try { if (window.gtag) window.gtag('event', gaNome, dados || {}); } catch (e) {}
  }

  // ── Tempo de permanência ───────────────────────────────────────────
  // Conta só o tempo com a aba à vista: aba esquecida aberta atrás de outra
  // não é leitura. Manda a cada vez que a página some, com o total acumulado;
  // na análise vale o maior valor por sessão.
  var tempoEnviado = -1;
  function enviarTempo(){
    if (visivelDesde) { visivelTotal += agora() - visivelDesde; visivelDesde = 0; }
    // `visibilitychange` e `pagehide` disparam juntos ao fechar: um envio só.
    var seg = Math.round(visivelTotal / 1000);
    if (seg === tempoEnviado) return;
    tempoEnviado = seg;
    gravar('tempo', { segundos: seg, rolou: rolouMax }, true);
  }

  R.iniciar = function(o){
    cfg = o || {};
    var r = cfg.resultado;
    sessao = (r && r.sessao) ||
             ('t-' + agora() + '-' + Math.random().toString(36).slice(2, 9));

    var url = new URLSearchParams(location.search);
    var utm = {};
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function(k){
      if (url.get(k)) utm[k] = url.get(k);
    });

    // Chegada
    gravar('view', { origem: r ? 'quiz' : 'directo', utm: utm,
                     ref: document.referrer || '', largura: window.innerWidth });
    var rast = cfg.rastreio || {};
    ligarPixel(rast.meta_pixel);
    ligarGA4(rast.ga4);
    anunciar('ViewContent', 'view_item', { content_name: 'tsl-insonia' });

    // Rolagem: 25, 50, 75 e 100%, cada um uma vez
    function medirRolagem(){
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      var pct = Math.min(100, Math.round(window.scrollY / h * 100));
      if (pct > rolouMax) rolouMax = pct;
      [25, 50, 75, 100].forEach(function(m){
        if (pct >= m) uma('rolou' + m, function(){ gravar('scroll', { pct: m }); });
      });
    }
    window.addEventListener('scroll', medirRolagem, { passive: true });

    // Blocos vistos: cada seção marcada com `data-bloco`, uma vez quando metade
    // dela aparece. É o que mostra em que ponto da página as pessoas desistem.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (!e.isIntersecting) return;
          var b = e.target.getAttribute('data-bloco');
          uma('bloco-' + b, function(){
            gravar('bloco', { bloco: b, segundos: Math.round((agora() - inicio) / 1000) });
          });
          io.unobserve(e.target);
        });
      // Conta quando o bloco cruza a linha do MEIO da tela. «Metade do bloco
      // visível» nunca acontece com bloco mais alto que a tela do celular, e
      // assim herói, autor e bônus ficavam de fora.
      }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
      document.querySelectorAll('[data-bloco]').forEach(function(n){ io.observe(n); });
    }

    // Cliques nos botões de compra: qual botão, em que bloco, quando
    document.addEventListener('click', function(ev){
      var a = ev.target.closest && ev.target.closest('a.cta, .barra-btn, .pv-cta');
      if (!a) return;
      var onde = a.classList.contains('barra-btn') ? 'barra'
               : a.classList.contains('pv-cta') ? 'previa'
               : ((a.closest('[data-bloco]') || {}).getAttribute
                   ? a.closest('[data-bloco]').getAttribute('data-bloco') : 'desconocido');
      gravar('click', { botao: onde, texto: (a.textContent || '').trim().slice(0, 60),
                        segundos: Math.round((agora() - inicio) / 1000), rolou: rolouMax }, true);
      anunciar('InitiateCheckout', 'begin_checkout', { content_name: 'tsl-insonia', boton: onde });
    }, true);

    document.addEventListener('visibilitychange', function(){
      if (document.visibilityState === 'hidden') enviarTempo();
      else visivelDesde = agora();
    });
    window.addEventListener('pagehide', enviarTempo);
  };

  // Chamados de dentro da página
  R.pagina = function(n){ uma('previa' + n, function(){ gravar('previa', { pagina: n }); }); };
  R.evento = function(tipo, meta){ uma(tipo, function(){ gravar(tipo, meta); }); };

  window.RastreioTSL = R;
})();
