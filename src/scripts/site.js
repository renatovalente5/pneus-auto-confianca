/* Pneus Auto-Confiança — o comportamento do site. Sem bibliotecas; tudo funciona (pior) sem JavaScript. */
(function () {
  'use strict';
  var d = document, h = d.documentElement;

  // ---------- cabeçalho: sombra ao descer; botão do WhatsApp depois do primeiro ecrã ----------
  // O botão do WhatsApp e a barra das propostas (só na pré-visualização) estão fixos em baixo e saem quando chega o
  // rodapé, para não taparem a última linha dele: assim o rodapé não precisa de espaço vazio por baixo.
  var topo = d.querySelector('[data-topo]');
  var flutuante = d.querySelector('[data-flutuante]');
  var rodape = d.querySelector('.rodape');
  var legal = d.querySelector('.rodape__legal');
  var barra = d.querySelector('.propostas');
  function aoRolar() {
    var y = window.scrollY || 0, alto = window.innerHeight;
    if (topo) topo.classList.toggle('topo--descido', y > 8);
    if (flutuante) {
      // o rodapé (que já tem o WhatsApp) chegou à altura do botão
      var chegou = rodape && rodape.getBoundingClientRect().top < alto - (parseFloat(getComputedStyle(flutuante).bottom) || 0);
      flutuante.classList.toggle('flutuante--visivel', y > 360 && !h.classList.contains('menu-aberto') && !chegou);
    }
    if (barra && legal) {
      var r = legal.getBoundingClientRect();
      barra.classList.toggle('propostas--escondida', r.top < alto && r.bottom > alto - 80);
    }
  }
  addEventListener('scroll', aoRolar, { passive: true });
  addEventListener('resize', aoRolar);
  // a página pode mudar de altura sem se rolar (os filtros dos trabalhos, por exemplo)
  if ('ResizeObserver' in window) new ResizeObserver(function () { aoRolar(); }).observe(d.body);
  aoRolar();

  // ---------- menu do telemóvel ----------
  var menu = d.querySelector('[data-menu]');
  var botaoMenu = d.querySelector('[data-menu-botao]');
  function fecharMenu(focar) {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    h.classList.remove('menu-aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
    d.querySelector('[data-menu-rotulo]').textContent = 'Abrir o menu';
    if (focar) botaoMenu.focus();
    aoRolar();
  }
  if (menu && botaoMenu) {
    botaoMenu.addEventListener('click', function () {
      if (!menu.hidden) return fecharMenu(false);
      menu.hidden = false;
      h.classList.add('menu-aberto');
      botaoMenu.setAttribute('aria-expanded', 'true');
      d.querySelector('[data-menu-rotulo]').textContent = 'Fechar o menu';
      var primeiro = menu.querySelector('a');
      if (primeiro) primeiro.focus();
      aoRolar();
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) fecharMenu(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharMenu(true); });
    matchMedia('(min-width: 1000px)').addEventListener('change', function (m) { if (m.matches) fecharMenu(false); });
  }

  // ---------- aberto agora? (hora de Lisboa) ----------
  var CODIGOS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  var NOMES = { Mo: 'segunda', Tu: 'terça', We: 'quarta', Th: 'quinta', Fr: 'sexta', Sa: 'sábado', Su: 'domingo' };
  function agoraEmLisboa() {
    var p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    return { dia: dia, min: parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10) };
  }
  var mins = function (t) { var a = t.split(':'); return +a[0] * 60 + +a[1]; };
  var horaBonita = function (t) { return t.replace(/^0/, ''); };
  function turnosDe(horario, codigo) {
    for (var i = 0; i < horario.length; i++) if (horario[i].c.indexOf(codigo) >= 0) return horario[i].t;
    return [];
  }
  function estadoAgora(horario) {
    var a = agoraEmLisboa(), hoje = CODIGOS[a.dia], t = turnosDe(horario, hoje);
    for (var i = 0; i < t.length; i++) {
      if (a.min >= mins(t[i][0]) && a.min < mins(t[i][1])) return { aberto: true, texto: 'Aberto agora · até às ' + horaBonita(t[i][1]) };
      if (a.min < mins(t[i][0])) return { aberto: false, texto: 'Fechado · abre às ' + horaBonita(t[i][0]) };
    }
    for (var k = 1; k <= 7; k++) {
      var c = CODIGOS[(a.dia + k) % 7], tt = turnosDe(horario, c);
      if (tt.length) return { aberto: false, texto: 'Fechado · abre ' + (k === 1 ? 'amanhã' : NOMES[c]) + ' às ' + horaBonita(tt[0][0]) };
    }
    return null;
  }
  d.querySelectorAll('[data-estado]').forEach(function (el) {
    try {
      var e = estadoAgora(JSON.parse(el.getAttribute('data-horario')));
      if (!e) return;
      el.textContent = e.texto;
      el.classList.add(e.aberto ? 'estado--aberto' : 'estado--fechado');
      el.hidden = false;
    } catch (err) { /* sem estado: fica só o horário escrito */ }
  });
  var hojeCodigo = CODIGOS[agoraEmLisboa().dia];
  d.querySelectorAll('tr[data-dias]').forEach(function (tr) {
    if (tr.getAttribute('data-dias').split(' ').indexOf(hojeCodigo) >= 0) { tr.classList.add('hoje'); tr.setAttribute('aria-current', 'date'); }
  });

  // ---------- pedidos para o WhatsApp (a mensagem segue já escrita) ----------
  function abrirWhatsapp(numero, texto) {
    var url = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(texto);
    var w = window.open(url, '_blank', 'noopener');
    if (!w) location.href = url;
  }
  var valor = function (f, n) { var el = f.querySelector('[name="' + n + '"]:checked') || f.querySelector('[name="' + n + '"]'); return el ? String(el.value).trim() : ''; };
  d.querySelectorAll('form[data-medida]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = +valor(f, 'quantos'), tipo = valor(f, 'tipo');
      var medida = valor(f, 'largura') + '/' + valor(f, 'perfil') + ' R' + valor(f, 'jante');
      var qual = tipo === 'novos' ? (q === 1 ? 'novo' : 'novos') : tipo === 'semi-novos' ? (q === 1 ? 'semi-novo' : 'semi-novos') : 'novos ou semi-novos (gostava de ver as duas opções)';
      var texto = 'Olá! Procuro ' + q + (q === 1 ? ' pneu ' : ' pneus ') + medida + ', ' + qual + '. Qual é o preço com a montagem?';
      abrirWhatsapp(f.getAttribute('data-whatsapp'), texto);
    });
  });
  var SERVICOS = { comprar: 'comprar jantes', reparar: 'reparar as jantes', cor: 'mudar a cor das jantes', pincas: 'pintar as pinças dos travões' };
  d.querySelectorAll('form[data-jantes]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = SERVICOS[valor(f, 'servico')] || 'um orçamento de jantes', aro = valor(f, 'aro'), carro = valor(f, 'carro');
      var texto = 'Olá! Queria ' + s + (aro ? ' de ' + aro + '″' : '') + (carro ? ', para um ' + carro : '') + '. Envio fotografias.';
      abrirWhatsapp(f.getAttribute('data-whatsapp'), texto);
    });
  });

  // ---------- a folha de cada trabalho ----------
  var folha = d.querySelector('[data-folha]');
  var ultimoFoco = null;
  function fecharFolha() {
    if (!folha || !folha.open) return;
    folha.close();
    h.classList.remove('folha-aberta');
    if (ultimoFoco) ultimoFoco.focus();
  }
  if (folha && folha.showModal) {
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-trabalho]');
      if (!b) return;
      var modelo = d.querySelector('template[data-trabalho-modelo="' + b.getAttribute('data-trabalho') + '"]');
      if (!modelo) return;
      ultimoFoco = b;
      var alvo = folha.querySelector('[data-folha-conteudo]');
      alvo.innerHTML = '';
      alvo.appendChild(modelo.content.cloneNode(true));
      h.classList.add('folha-aberta');
      folha.showModal();
      folha.querySelector('[data-folha-fechar]').focus();
    });
    folha.addEventListener('click', function (e) { if (e.target === folha || e.target.closest('[data-folha-fechar]')) fecharFolha(); });
    folha.addEventListener('cancel', function (e) { e.preventDefault(); fecharFolha(); });
  }

  // ---------- filtros dos trabalhos ----------
  var filtros = d.querySelector('[data-filtros]');
  if (filtros) {
    filtros.hidden = false;
    filtros.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filtro]');
      if (!b) return;
      var k = b.getAttribute('data-filtro');
      filtros.querySelectorAll('[data-filtro]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      d.querySelectorAll('[data-trabalhos] > li').forEach(function (li) {
        li.hidden = k !== 'todos' && li.getAttribute('data-tipos').split(' ').indexOf(k) < 0;
      });
    });
  }

  // ---------- filas que deslizam: setas no computador ----------
  d.querySelectorAll('[data-fila]').forEach(function (fila) {
    var lista = fila.querySelector('ul'), ant = fila.querySelector('[data-fila-anterior]'), seg = fila.querySelector('[data-fila-seguinte]');
    if (!lista || !ant || !seg) return;
    function passo() { var li = lista.querySelector('li'); return li ? li.getBoundingClientRect().width + 16 : 300; }
    function setas() {
      var max = lista.scrollWidth - lista.clientWidth - 2;
      ant.disabled = lista.scrollLeft <= 2;
      seg.disabled = lista.scrollLeft >= max;
      fila.classList.toggle('fila--cabe', max <= 2);
    }
    ant.addEventListener('click', function () { lista.scrollBy({ left: -passo() * 2, behavior: 'smooth' }); });
    seg.addEventListener('click', function () { lista.scrollBy({ left: passo() * 2, behavior: 'smooth' }); });
    lista.addEventListener('scroll', setas, { passive: true });
    addEventListener('resize', setas);
    setas();
  });

  // ---------- o código do pneu: cada parte explica-se ----------
  d.querySelectorAll('[data-flanco]').forEach(function (fl) {
    fl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-parte]');
      if (!b) return;
      var k = b.getAttribute('data-parte');
      fl.querySelectorAll('[data-parte]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      fl.querySelectorAll('[data-explica]').forEach(function (p) { p.hidden = p.getAttribute('data-explica') !== k; });
    });
  });
})();
