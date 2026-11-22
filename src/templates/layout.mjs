// A moldura de todas as páginas: <head>, cabeçalho, menu, rodapé, o botão do WhatsApp e (nas propostas) a barra para
// trocar de proposta.
import { esc, logo, icone, jsonLd, whatsappHref } from './util.mjs';
import { livroReclamacoes, telefoneHtml } from '../../legal-comum/index.mjs';

// As três propostas de desenho (22 nov 2026). Só muda a página inicial (a capa e a ordem das secções) e a roupa de
// todas as páginas (cores, letra, cantos); o conteúdo é o mesmo.
export const VARIANTES = {
  a: { nome: 'Asfalto', tema: 'escuro', fonte: 'mona', resumo: 'escuro como o pneu, vermelho para agir, fotografia de ponta a ponta' },
  b: { nome: 'Garagem', tema: 'claro', fonte: 'instrument', resumo: 'claro e calmo, azul da marca, o pedido pela medida logo na capa' },
  c: { nome: 'Rasto', tema: 'claro', fonte: 'geologica', resumo: 'mosaico com o logótipo e as fotografias, letra inclinada como a do logótipo' },
};

export const FONTES = {
  mona: { ficheiro: 'mona-sans-latin.woff2', familia: 'Mona Sans', css: 'font-weight:200 900;font-stretch:75% 125%' },
  instrument: { ficheiro: 'instrument-sans-latin.woff2', familia: 'Instrument Sans', css: 'font-weight:400 700;font-stretch:75% 100%' },
  geologica: { ficheiro: 'geologica-latin.woff2', familia: 'Geologica', css: 'font-weight:100 900;font-style:oblique 0deg 12deg' },
};

// O menu principal: as quatro coisas que fazem e os contactos.
export const NAV = [
  ['pneus', '/pneus/', 'Pneus'],
  ['jantes', '/jantes/', 'Jantes'],
  ['oficina', '/oficina/', 'Oficina'],
  ['trabalhos', '/trabalhos/', 'Trabalhos'],
  ['contactos', '/contactos/', 'Contactos'],
];

export const MENSAGEM_WHATSAPP = 'Olá! Gostava de pedir um preço.';

export function pagina(ctx, p) {
  const { site, assets, opcoes, variante } = ctx;
  const v = VARIANTES[variante];
  const escuro = v.tema === 'escuro';
  const titulo = p.titulo === site.marca ? site.titulo : `${p.titulo} | ${site.marca}`;
  const canonical = ctx.absPagina(p.caminho);
  const indexar = !opcoes.preview && p.indexar !== false && !p.legal;
  const og = p.ogImagem || ctx.partilhaMarca;
  const atual = (c) => (p.seccao === c ? ' aria-current="page"' : '');
  const temaCor = escuro ? '#0B0D10' : variante === 'c' ? '#EFEDE8' : '#F6F6F3';
  const precarregar = (p.precarregar || []).map((pr) => `<link rel="preload" as="image" type="image/${pr.fmt}" imagesrcset="${pr.srcset}" imagesizes="${esc(pr.sizes)}"${pr.media ? ` media="${esc(pr.media)}"` : ''} fetchpriority="high">`).join('\n');
  const wa = whatsappHref(site.whatsapp, MENSAGEM_WHATSAPP);
  const fonte = FONTES[v.fonte];
  const pedido = ctx.href(p.seccao === 'inicio' ? '/#medida' : '/pneus/#medida');

  return `<!doctype html>
<html lang="pt-PT" data-tema="${v.tema}" data-variante="${variante}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script>document.documentElement.classList.add('js')</script>
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(p.descricao || site.descricao)}">
${indexar ? '' : '<meta name="robots" content="noindex">\n'}<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_PT">
<meta property="og:site_name" content="${esc(site.marca)}">
<meta property="og:title" content="${esc(p.ogTitulo || (p.titulo === site.marca ? site.titulo : p.titulo))}">
<meta property="og:description" content="${esc(p.descricao || site.descricao)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${temaCor}">
<link rel="icon" href="${ctx.asset('/favicon.png')}" sizes="32x32" type="image/png">
<link rel="icon" href="${ctx.asset('/icone-192.png')}" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="${ctx.asset('/apple-touch-icon.png')}">
<link rel="manifest" href="${ctx.asset('/site.webmanifest')}">
<link rel="preload" href="${ctx.asset('/assets/fontes/' + assets.fontes[fonte.ficheiro])}" as="font" type="font/woff2" crossorigin>
${precarregar}
<link rel="stylesheet" href="${ctx.asset('/assets/' + assets.css)}">
<script src="${ctx.asset('/assets/' + assets.js)}" defer></script>
${(p.jsonLd || []).map(jsonLd).join('\n')}
</head>
<body class="pagina-${p.seccao || 'outra'}${p.classe ? ' ' + p.classe : ''}">
<a class="saltar" href="#conteudo">Saltar para o conteúdo</a>
<header class="topo" data-topo>
  <div class="topo__barra contentor">
    <a class="topo__marca" href="${ctx.href('/')}" aria-label="${esc(site.marca)}, página inicial">${logo(ctx, 58, { classe: 'topo__logo' })}</a>
    <nav class="topo__nav" aria-label="Principal">
      <ul>${NAV.map(([c, h, t]) => `<li><a href="${ctx.href(h)}"${atual(c)}>${t}</a></li>`).join('')}</ul>
    </nav>
    <a class="botao botao--acao botao--pequeno topo__pedido" href="${pedido}">Pedir preço</a>
    <button class="topo__menu" type="button" aria-expanded="false" aria-controls="menu" data-menu-botao>
      <span class="topo__menu-abrir">${icone.menu}</span><span class="topo__menu-fechar">${icone.fechar}</span><span class="sr" data-menu-rotulo>Abrir o menu</span>
    </button>
  </div>
</header>
<div class="menu" id="menu" hidden data-menu>
  <nav class="menu__nav contentor" aria-label="Menu">
    <ul class="menu__lista">
      <li><a href="${ctx.href('/')}"${atual('inicio')}>Início</a></li>
      ${NAV.map(([c, h, t]) => `<li><a href="${ctx.href(h)}"${atual(c)}>${t}</a></li>`).join('\n      ')}
    </ul>
    <div class="menu__pe">
      <a class="botao botao--acao" href="${pedido}" data-menu-fechar>Pedir preço pela medida</a>
      <a class="botao botao--linha" href="${wa}" target="_blank" rel="noopener">${icone.whatsapp}WhatsApp</a>
      <p class="menu__telefone">${telefoneHtml(site.telefone, { frase: 'com-a' })}</p>
    </div>
  </nav>
</div>
<main id="conteudo" tabindex="-1">
${p.corpo}
</main>
${rodape(ctx)}
<a class="flutuante" href="${wa}" target="_blank" rel="noopener" data-flutuante>${icone.whatsapp}<span class="sr">Falar connosco no WhatsApp</span></a>
${opcoes.propostas ? barraPropostas(ctx, p) : ''}
</body>
</html>
`;
}

function rodape(ctx) {
  const { site } = ctx;
  const ano = new Date().getFullYear();
  const wa = whatsappHref(site.whatsapp, MENSAGEM_WHATSAPP);
  return `<footer class="rodape">
  <div class="contentor rodape__grelha">
    <div class="rodape__marca">
      <a href="${ctx.href('/')}" class="rodape__logo" aria-label="${esc(site.marca)}, página inicial">${logo(ctx, 84)}</a>
      <p class="rodape__frase">${esc(site.lema)}</p>
      <p class="rodape__redes">
        <a href="https://www.instagram.com/${site.instagram}/" target="_blank" rel="noopener" class="redonda">${icone.instagram}<span class="sr">Instagram</span></a>
        <a href="${site.facebook}" target="_blank" rel="noopener" class="redonda">${icone.facebook}<span class="sr">Facebook</span></a>
        <a href="${wa}" target="_blank" rel="noopener" class="redonda">${icone.whatsapp}<span class="sr">WhatsApp</span></a>
      </p>
    </div>
    <nav class="rodape__coluna" aria-label="O que fazemos">
      <h2 class="rodape__titulo">O que fazemos</h2>
      <ul>
        <li><a href="${ctx.href('/pneus/#novos')}">Pneus novos</a></li>
        <li><a href="${ctx.href('/pneus/#semi-novos')}">Pneus semi-novos</a></li>
        <li><a href="${ctx.href('/jantes/')}">Jantes</a></li>
        <li><a href="${ctx.href('/oficina/')}">Oficina</a></li>
      </ul>
    </nav>
    <nav class="rodape__coluna" aria-label="Ajuda">
      <h2 class="rodape__titulo">Ajuda</h2>
      <ul>
        <li><a href="${ctx.href('/pneus/#medida')}">Pedir preço pela medida</a></li>
        <li><a href="${ctx.href('/pneus/#ler-a-medida')}">Como ler a medida</a></li>
        <li><a href="${ctx.href('/trabalhos/')}">Trabalhos</a></li>
        <li><a href="${ctx.href('/contactos/')}">Contactos e horário</a></li>
      </ul>
    </nav>
    <div class="rodape__coluna">
      <h2 class="rodape__titulo">Fale connosco</h2>
      <ul class="rodape__contactos">
        <li><span class="rodape__icone">${icone.whatsapp}</span><a href="${wa}" target="_blank" rel="noopener">WhatsApp</a></li>
        <li><span class="rodape__icone">${icone.email}</span><a href="mailto:${site.email}">${esc(site.email).replace('@', '@<wbr>')}</a></li>
        <li><span class="rodape__icone">${icone.local}</span><a href="${site.mapa}" target="_blank" rel="noopener">${esc(site.morada.rua.split(',')[0])}, ${esc(site.morada.localidade)}</a></li>
        <li><span class="rodape__icone">${icone.envio}</span><span>Envios para todo o país</span></li>
      </ul>
    </div>
  </div>
  <div class="contentor rodape__legal">
    <p>© ${ano} ${esc(site.marca)}</p>
    <ul>
      <li><a href="${ctx.href('/privacidade/')}">Privacidade</a></li>
      <li><a href="${ctx.href('/litigios/')}">Resolução de litígios</a></li>
      <li>${livroReclamacoes()}</li>
    </ul>
  </div>
</footer>`;
}

// Nas propostas: uma pílula ao fundo para trocar (só a página inicial muda de desenho; as outras mudam de roupa).
function barraPropostas(ctx, p) {
  const raizDe = (k) => ctx.asset(k === ctx.opcoes.padrao ? '/' : `/propostas/${k}/`);
  const mesma = (k) => raizDe(k).replace(/\/$/, '') + (p.caminho === '/' || p.caminho.endsWith('.html') ? '/' : p.caminho);
  return `<nav class="propostas" aria-label="Propostas de desenho">
  <span class="propostas__titulo">Proposta</span>
  ${Object.entries(VARIANTES).map(([k, v]) => `<a href="${mesma(k)}"${k === ctx.variante ? ' aria-current="page"' : ''}><b>${k.toUpperCase()}</b> ${esc(v.nome)}</a>`).join('')}
</nav>`;
}
