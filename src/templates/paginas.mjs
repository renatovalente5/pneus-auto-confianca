// As páginas do site. Cada função devolve { caminho, titulo, descricao, seccao, corpo, … } para o layout.
import { readFileSync } from 'node:fs';
import { esc, foto, srcsetFoto, logo, icone, whatsappHref, jpegAbs, partilhaFoto, turnosTexto, horarioSchema, mesAno, decimal } from './util.mjs';
import { MENSAGEM_WHATSAPP } from './layout.mjs';
import { telefoneHtml, ralHtml, destinatariosHtml, direitosHtml, frasesPrivacidade, prazos } from '../../legal-comum/index.mjs';

// ---------- dados estruturados ----------

const migalhas = (ctx, itens) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [['Início', '/'], ...itens].map(([nome, caminho], i) => ({ '@type': 'ListItem', position: i + 1, name: nome, item: ctx.absPagina(caminho) })),
});

const negocio = (ctx) => {
  const { site, conteudo } = ctx;
  const [lat, lon] = site.coordenadas.split(',').map(Number);
  return {
    '@context': 'https://schema.org',
    '@type': ['AutoRepair', 'AutoPartsStore'],
    '@id': ctx.absPagina('/') + '#negocio',
    name: site.marca,
    alternateName: ['Pneus Auto Confiança', 'Pneus Auto - Confiança - Oficina Auto', 'Auto-Confiança'],
    slogan: site.lema,
    description: site.descricao,
    url: ctx.absPagina('/'),
    logo: ctx.abs('/icone-512.png'),
    image: [jpegAbs(ctx, 'montagem-davanti'), ctx.partilhaMarca],
    telephone: '+351' + site.telefone.replace(/\s/g, ''),
    email: site.email,
    address: { '@type': 'PostalAddress', streetAddress: site.morada.rua, postalCode: site.morada.codigoPostal, addressLocality: site.morada.localidade, addressRegion: site.morada.distrito, addressCountry: 'PT' },
    geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lon },
    hasMap: site.mapa,
    openingHoursSpecification: horarioSchema(site.horario),
    sameAs: [`https://www.instagram.com/${site.instagram}/`, site.facebook],
    brand: conteudo.marcas.map((m) => ({ '@type': 'Brand', name: m })),
    knowsAbout: ['Pneus novos', 'Pneus semi-novos', 'Jantes', 'Reparação de jantes', 'Montagem e equilibragem', 'Alinhamento da direção', 'Revisões', 'Baterias', 'Sensores de pressão (TPMS)'],
    legalName: site.empresa.firma,
    vatID: 'PT' + site.empresa.nif,
  };
};

// ---------- peças comuns ----------

const wa = (ctx, texto = MENSAGEM_WHATSAPP) => whatsappHref(ctx.site.whatsapp, texto);
const telHref = (n) => 'tel:+351' + n.replace(/\s/g, '');
const moradaLinha = (site) => `${esc(site.morada.rua)}, ${esc(site.morada.codigoPostal)} ${esc(site.morada.localidade)}`;

function cabecalho({ titulo, frase, acoes = '', classe = '' }) {
  return `<header class="cab contentor${classe ? ' ' + classe : ''}">
  <h1 class="cab__titulo">${titulo}</h1>
  ${frase ? `<p class="cab__frase">${frase}</p>` : ''}
  ${acoes ? `<div class="cab__acoes">${acoes}</div>` : ''}
</header>`;
}

const seccao = ({ id = '', classe = '', titulo, sub = '', ligacao = '', corpo }) => `<section class="seccao${classe ? ' ' + classe : ''}"${id ? ` id="${id}"` : ''}${titulo ? ` aria-labelledby="t-${id || classe.split(' ')[0]}"` : ''}>
  ${titulo ? `<div class="seccao__cab contentor"><div><h2 class="seccao__titulo" id="t-${id || classe.split(' ')[0]}">${titulo}</h2>${sub ? `<p class="seccao__sub">${sub}</p>` : ''}</div>${ligacao}</div>` : ''}
  ${corpo}
</section>`;

// As palavras com hífen não partem no hífen («semi- / novos»).
const semPartir = (t) => esc(t).replace(/([\p{L}\d]+(?:-[\p{L}\d]+)+)/gu, '<span class="nw">$1</span>');
const ligacaoSeta = (href, texto) => `<a class="ligacao-seta" href="${href}">${texto}${icone.seta}</a>`;

// O estado (aberto/fechado) faz-se no browser a partir do horário; sem JavaScript fica só o horário escrito.
const horarioDados = (site) => esc(JSON.stringify(site.horario.map((l) => ({ c: l.codigos, t: l.turnos }))));
const estado = (site, classe = 'estado') => `<span class="${classe}" data-estado data-horario="${horarioDados(site)}" hidden></span>`;

function notaGoogle(ctx, { classe = 'nota-google' } = {}) {
  const { google } = ctx.site;
  return `<a class="${classe}" href="${google.url}" target="_blank" rel="noopener"><span class="nota-google__estrelas" aria-hidden="true">${icone.estrela.repeat(5)}</span><span><b>${decimal(google.nota)}</b> no Google · ${google.opinioes} opiniões</span></a>`;
}

// O pedido pela medida: compõe a mensagem e abre o WhatsApp. Sem JavaScript abre a conversa com a mensagem geral.
function pedidoMedida(ctx, { id = 'medida', titulo = 'Qual é a medida do seu pneu?', classe = '' } = {}) {
  const { site, conteudo } = ctx;
  const m = conteudo.medidas;
  const opcoes = (lista, sel, fmt = (x) => x) => lista.map((x) => `<option value="${x}"${x === sel ? ' selected' : ''}>${fmt(x)}</option>`).join('');
  const naoSei = wa(ctx, 'Olá! Não sei a medida dos pneus. Envio uma fotografia da parte lateral do pneu.');
  return `<form class="medida${classe ? ' ' + classe : ''}" id="${id}" action="https://wa.me/${site.whatsapp}" method="get" target="_blank" data-medida data-whatsapp="${site.whatsapp}">
  <input type="hidden" name="text" value="${esc(MENSAGEM_WHATSAPP)}">
  <h2 class="medida__titulo">${titulo}</h2>
  <p class="medida__ajuda">Está escrita na parte lateral do pneu, por exemplo <b class="medida__exemplo">${m.exemplo.largura}/${m.exemplo.perfil} R${m.exemplo.jante}</b>.</p>
  <div class="medida__codigo">
    <label class="campo campo--medida"><span>Largura</span><select name="largura" data-campo="largura">${opcoes(m.larguras, m.exemplo.largura)}</select></label>
    <span class="medida__sep" aria-hidden="true">/</span>
    <label class="campo campo--medida"><span>Perfil</span><select name="perfil" data-campo="perfil">${opcoes(m.perfis, m.exemplo.perfil)}</select></label>
    <span class="medida__sep" aria-hidden="true">R</span>
    <label class="campo campo--medida"><span>Jante</span><select name="jante" data-campo="jante">${opcoes(m.jantes, m.exemplo.jante, (x) => `${x}″`)}</select></label>
  </div>
  <div class="medida__escolhas">
  <fieldset class="escolhas-grupo">
    <legend>Pneus</legend>
    <div class="escolhas">${m.tipos.map((t, i) => `<label class="escolha"><input type="radio" name="tipo" value="${t.id}"${i === 0 ? ' checked' : ''}><span>${esc(t.nome)}</span></label>`).join('')}</div>
  </fieldset>
  <fieldset class="escolhas-grupo">
    <legend>Quantos</legend>
    <div class="escolhas">${m.quantidades.map((q) => `<label class="escolha escolha--numero"><input type="radio" name="quantos" value="${q}"${q === 4 ? ' checked' : ''}><span>${q}</span></label>`).join('')}</div>
  </fieldset>
  </div>
  <div class="medida__fim">
    <button class="botao botao--acao" type="submit">${icone.whatsapp}Pedir preço no WhatsApp</button>
    <p class="medida__rodape"><a href="${naoSei}" target="_blank" rel="noopener">${icone.camara}Não sabe a medida? Envie uma fotografia</a></p>
  </div>
</form>`;
}

// Os trabalhos (carros que passaram pela oficina): cartões que abrem a folha com as fotografias.
function cartaoTrabalho(ctx, t, { sizes = '(min-width: 1100px) 290px, (min-width: 700px) 32vw, 72vw' } = {}) {
  return `<li class="trabalho" data-tipos="${t.tipos.join(' ')}">
  <button class="trabalho__botao" type="button" data-trabalho="${t.id}" aria-haspopup="dialog">
    ${foto(ctx, t.fotos[0], { sizes, classe: 'trabalho__foto' })}
    <span class="trabalho__texto"><span class="trabalho__carro">${esc(t.carro)}</span><span class="trabalho__feito">${esc(t.feito)}</span></span>
    ${t.fotos.length > 1 ? `<span class="trabalho__mais" aria-hidden="true">${icone.camara}${t.fotos.length}</span>` : ''}
  </button>
</li>`;
}

// A folha de um trabalho (uma <dialog> por página, preenchida pelo site.js a partir de um <template> por trabalho).
function folhasTrabalhos(ctx, trabalhos) {
  return `<dialog class="folha" data-folha aria-labelledby="folha-titulo">
  <div class="folha__caixa">
    <button class="folha__fechar" type="button" data-folha-fechar>${icone.fechar}<span class="sr">Fechar</span></button>
    <div class="folha__conteudo" data-folha-conteudo></div>
  </div>
</dialog>
${trabalhos.map((t) => `<template data-trabalho-modelo="${t.id}">
  <div class="folha__fotos" tabindex="0" aria-label="Fotografias">${t.fotos.map((f) => foto(ctx, f, { sizes: '(min-width: 900px) 720px, 100vw', classe: 'folha__foto' })).join('')}</div>
  <div class="folha__texto">
    <h2 id="folha-titulo">${esc(t.carro)}</h2>
    <p>${esc(t.feito)}</p>
    <p class="folha__data">${esc(mesAno(t.data))}</p>
    <a class="botao botao--acao" href="${wa(ctx, `Olá! Vi o trabalho no ${t.carro} no vosso site. Gostava de pedir um preço para o meu carro.`)}" target="_blank" rel="noopener">${icone.whatsapp}Quero um trabalho assim</a>
  </div>
</template>`).join('\n')}`;
}

function filaTrabalhos(ctx, trabalhos, { id = 'trabalhos' } = {}) {
  return `<div class="fila" data-fila>
  <ul class="fila__lista contentor-fila" role="list">${trabalhos.map((t) => cartaoTrabalho(ctx, t)).join('')}</ul>
  <div class="fila__setas contentor" aria-hidden="true">
    <button class="fila__seta" type="button" data-fila-anterior tabindex="-1">${icone.anterior}</button>
    <button class="fila__seta" type="button" data-fila-seguinte tabindex="-1">${icone.seguinte}</button>
  </div>
</div>`;
}

function areas(ctx, { sizes = '(min-width: 1100px) 290px, (min-width: 700px) 24vw, 46vw' } = {}) {
  return `<ul class="areas contentor" role="list">${ctx.conteudo.areas.map((a) => `<li class="area">
  <a class="area__ligacao" href="${ctx.href(a.pagina)}">${foto(ctx, a.foto, { sizes, classe: 'area__foto' })}<span class="area__nome"><span>${semPartir(a.nome)}</span>${icone.seta}</span></a>
</li>`).join('')}</ul>`;
}

function opinioes(ctx) {
  const { conteudo, site } = ctx;
  return `<div class="contentor">
  <ul class="opinioes" role="list">${conteudo.criticas.map((c) => `<li class="opiniao">
    <span class="opiniao__estrelas" aria-label="5 estrelas em 5">${icone.estrela.repeat(5)}</span>
    <blockquote class="opiniao__texto"><p>${esc(c.texto)}</p></blockquote>
    <p class="opiniao__quem"><span class="opiniao__inicial" aria-hidden="true">${esc(c.nome[0])}</span><span>${esc(c.nome)}<small>no Google · ${esc(mesAno(c.data))}</small></span></p>
  </li>`).join('')}</ul>
  <p class="nota-legal">As opiniões mais recentes com texto na ficha da ${esc(site.marca)} no Google, como foram escritas. A ${esc(site.marca)} não confirma se quem as escreveu é cliente.</p>
</div>`;
}

// «9:00–12:00 e 14:00–18:30», com o segundo turno a poder descer para a linha de baixo quando não cabe.
const turnosHtml = (turnos) => (turnos.length ? turnos.map((t, i) => `<span class="turno">${i ? 'e ' : ''}${esc(turnosTexto([t]))}</span>`).join(' ') : 'Fechado');

function horarioTabela(site, { classe = 'horario' } = {}) {
  return `<table class="${classe}">
  <caption class="sr">Horário</caption>
  <tbody>${site.horario.map((l) => `<tr data-dias="${l.codigos.join(' ')}"><th scope="row">${l.curto && l.curto !== l.dias ? `<span class="longo">${esc(l.dias)}</span><span class="curto" aria-hidden="true">${esc(l.curto)}</span>` : esc(l.dias)}</th><td>${turnosHtml(l.turnos)}</td></tr>`).join('')}</tbody>
</table>`;
}

let mapaSvg = null;
function mapa(ctx, { classe = '' } = {}) {
  mapaSvg ??= readFileSync(new URL('../../media/mapa/loja.svg', import.meta.url), 'utf8');
  return `<figure class="mapa${classe ? ' ' + classe : ''}">
  ${mapaSvg}
  <a class="mapa__abrir" href="${ctx.site.mapa}" target="_blank" rel="noopener">${icone.local}<span>Como chegar</span><span class="sr"> (abre o Google Maps)</span></a>
  <figcaption class="mapa__credito"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a></figcaption>
</figure>`;
}

function visita(ctx) {
  const { site } = ctx; // na página inicial do telemóvel o mapa sai (o «Como chegar» abre o mapa do próprio telemóvel)
  return `<div class="visita contentor">
  <div class="visita__info">
    <div class="visita__onde">
    <p class="visita__morada">${icone.local}<span>${esc(site.morada.rua)}<br>${esc(site.morada.codigoPostal)} ${esc(site.morada.localidade)}</span></p>
    ${estado(site, 'estado estado--grande')}
    </div>
    ${horarioTabela(site)}
    <div class="visita__acoes">
      <a class="botao botao--acao" href="${site.mapa}" target="_blank" rel="noopener">${icone.local}Como chegar</a>
      <a class="botao botao--linha" href="${telHref(site.telefone)}">${icone.telefone}Ligar</a>
    </div>
    <p class="visita__telefone">${telefoneHtml(site.telefone, { frase: 'com-a' })}</p>
  </div>
  ${mapa(ctx, { classe: 'mapa--visita' })}
</div>`;
}

// ---------- página inicial (três propostas) ----------

export function inicio(ctx) {
  const { site, conteudo, variante } = ctx;
  const capa = { a: capaA, b: capaB, c: capaC }[variante](ctx);
  const trabalhos = conteudo.trabalhos.slice(0, 8);
  const blocos = {
    medida: `<section class="seccao seccao--medida" aria-label="Pedir preço pela medida"><div class="contentor medida-envolta">${pedidoMedida(ctx)}${variante === 'a' ? medidaLado(ctx) : medidaLado(ctx, { foto: 'pneus-novos-etiquetas' })}</div></section>`,
    areas: seccao({ id: 'o-que-fazemos', titulo: 'Pneus, jantes e oficina', sub: 'Tudo na mesma casa, na Rua de Calvelos.', corpo: areas(ctx) }),
    trabalhos: seccao({ id: 'trabalhos', titulo: 'Carros que passaram por cá', sub: 'Do Datsun 1200 ao BMW M5.', ligacao: ligacaoSeta(ctx.href('/trabalhos/'), 'Ver todos'), corpo: filaTrabalhos(ctx, trabalhos) }),
    opinioes: seccao({ id: 'opinioes', titulo: 'Quem cá vem, recomenda', sub: notaGoogle(ctx), corpo: opinioes(ctx) }),
    visita: seccao({ id: 'visite-nos', titulo: 'Visite-nos em Fafe', corpo: visita(ctx) }),
  };
  const ordem = { a: ['medida', 'areas', 'trabalhos', 'opinioes', 'visita'], b: ['areas', 'trabalhos', 'opinioes', 'visita'], c: ['medida', 'trabalhos', 'opinioes', 'visita'] }[variante];
  const corpo = `${capa.html}
${ordem.map((k) => blocos[k]).join('\n')}
${folhasTrabalhos(ctx, trabalhos)}`;
  return {
    caminho: '/',
    titulo: site.marca,
    descricao: site.descricao,
    seccao: 'inicio',
    classe: `inicio inicio--${variante}`,
    corpo,
    precarregar: capa.precarregar,
    jsonLd: [negocio(ctx), { '@context': 'https://schema.org', '@type': 'WebSite', name: site.marca, alternateName: 'Pneus Auto Confiança', url: ctx.absPagina('/') }],
  };
}

// Ao lado do pedido (A e C): o que acontece depois, em três linhas, e uma fotografia.
function medidaLado(ctx, { foto: nome = 'montagem-davanti' } = {}) {
  return `<div class="medida-lado">
  ${foto(ctx, nome, { sizes: '(min-width: 900px) 480px, 100vw', classe: 'medida-lado__foto' })}
  <ul class="medida-lado__lista" role="list">
    <li>${icone.check}<span>Respondemos com o preço e o que há em stock, novos e semi-novos.</span></li>
    <li>${icone.check}<span>Montagem e equilibragem na oficina, com marcação.</span></li>
  </ul>
</div>`;
}

const confianca = (ctx) => `<ul class="capa__confianca" role="list">
  <li>${notaGoogle(ctx, { classe: 'nota-google nota-google--capa' })}</li>
  <li class="capa__local">${icone.local}<span>Rua de Calvelos, Fafe</span>${estado(ctx.site, 'estado')}</li>
</ul>`;

const acoesCapa = (ctx, { ligar = true } = {}) => `<div class="capa__acoes">
  <a class="botao botao--acao" href="#medida">Pedir preço pela medida</a>
  ${ligar ? `<a class="botao botao--linha botao--com-nota" href="${telHref(ctx.site.telefone)}">${icone.telefone}<span><span class="botao__numero">${esc(ctx.site.telefone)}</span><span class="botao__nota">(Chamada para a rede móvel nacional)</span></span></a>` : `<a class="botao botao--linha" href="${wa(ctx)}" target="_blank" rel="noopener">${icone.whatsapp}WhatsApp</a>`}
</div>`;

// A «Asfalto»: texto no escuro à esquerda, a fotografia da oficina de ponta a ponta à direita (no telemóvel, por trás).
function capaA(ctx) {
  const { conteudo } = ctx;
  const nome = 'bmw-530e-oficina';
  const s = srcsetFoto(ctx, nome);
  return {
    precarregar: [{ ...s, sizes: '(min-width: 900px) 50vw, 100vw' }],
    html: `<section class="capa capa--a">
  <div class="capa__media">${foto(ctx, nome, { sizes: '(min-width: 900px) 50vw, 100vw', prioridade: true, classe: 'capa__foto' })}</div>
  <div class="capa__texto">
    <p class="capa__rotulo">Pneus · Jantes · Oficina</p>
    <h1 class="capa__titulo">${esc(conteudo.capa.titulo)}</h1>
    <p class="capa__frase">${esc(conteudo.capa.frase)}</p>
    ${acoesCapa(ctx)}
    ${confianca(ctx)}
  </div>
</section>`,
  };
}

// B «Garagem»: o pedido pela medida dentro da capa, ao lado da fotografia da montagem.
function capaB(ctx) {
  const { conteudo } = ctx;
  const nome = 'montagem-davanti';
  const s = srcsetFoto(ctx, nome);
  return {
    precarregar: [{ ...s, sizes: '(min-width: 900px) 40vw, 1px', media: '(min-width: 900px)' }],
    html: `<section class="capa capa--b">
  <div class="capa__grelha contentor">
    <div class="capa__texto">
      <p class="capa__rotulo">${icone.local}Rua de Calvelos, Fafe ${estado(ctx.site, 'estado')}</p>
      <h1 class="capa__titulo">${esc(conteudo.capa.titulo)}</h1>
      <p class="capa__frase">${esc(conteudo.capa.frase)}</p>
      ${pedidoMedida(ctx, { titulo: 'Peça o preço pela medida', classe: 'medida--capa' })}
    </div>
    <div class="capa__media">
      ${foto(ctx, nome, { sizes: '(min-width: 900px) 40vw, 92vw', prioridade: true, classe: 'capa__foto' })}
      ${notaGoogle(ctx, { classe: 'nota-google nota-google--pastilha' })}
    </div>
  </div>
</section>`,
  };
}

// C «Rasto»: um mosaico com o logótipo deles no preto do pneu, o título, e as quatro coisas que fazem em fotografias.
function capaC(ctx) {
  const { conteudo } = ctx;
  const fotosC = { novos: 'mercedes-c-coupe', 'semi-novos': 'pneus-semi-novos', jantes: 'jantes-bmw-caixas', oficina: 'bmw-530e-elevador' };
  return {
    precarregar: [],
    html: `<section class="capa capa--c">
  <div class="mosaico contentor">
    <div class="mosaico__marca">
      ${logo(ctx, 150, { classe: 'mosaico__logo', alt: '', prioridade: true })}
      <h1 class="capa__titulo">${esc(conteudo.capa.titulo)}</h1>
      <p class="capa__frase">${esc(conteudo.capa.frase)}</p>
      ${acoesCapa(ctx, { ligar: false })}
    </div>
    ${conteudo.areas.map((a, i) => `<a class="mosaico__area mosaico__area--${i + 1}" href="${ctx.href(a.pagina)}">${foto(ctx, fotosC[a.id], { sizes: '(min-width: 1000px) 25vw, 46vw', classe: 'mosaico__foto', cedo: i < 2 })}<span class="mosaico__nome">${esc(a.nome)}${icone.seta}</span></a>`).join('')}
    <div class="mosaico__nota">${notaGoogle(ctx, { classe: 'nota-google nota-google--mosaico' })}<span class="capa__local">${icone.local}Rua de Calvelos, Fafe ${estado(ctx.site, 'estado')}</span></div>
  </div>
</section>`,
  };
}

// ---------- páginas interiores ----------

export function pneus(ctx) {
  const { site, conteudo } = ctx;
  const ex = conteudo.medidas.exemplo;
  const partes = [
    ['largura', String(ex.largura), 'Largura', `A largura do pneu, em milímetros: ${ex.largura} mm.`],
    ['perfil', `/${ex.perfil}`, 'Perfil', `A altura da parede lateral, em percentagem da largura: ${ex.perfil} % de ${ex.largura} mm.`],
    ['construcao', 'R', 'Construção', 'R quer dizer radial, a construção de quase todos os pneus de hoje.'],
    ['jante', String(ex.jante), 'Jante', `O diâmetro da jante onde o pneu monta, em polegadas: ${ex.jante}″.`],
    ['carga', ex.carga, 'Carga', `O índice de carga: ${ex.carga} aguenta até 615 kg por pneu.`],
    ['velocidade', ex.velocidade, 'Velocidade', `O índice de velocidade: ${ex.velocidade} vai até 240 km/h.`],
  ];
  const marcas = [
    ['XL', 'Reforçado (carga extra).'],
    ['RF, RFT, ZP, SSR', 'Run-flat: anda uns quilómetros mesmo sem ar.'],
    ['★ · MO · AO · N0', 'Homologado pela BMW, Mercedes, Audi e Porsche.'],
    ['M+S · ❄', 'Lama e neve; o floco é o de inverno a sério.'],
    ['DOT 2423', 'Os quatro últimos números são a data de fabrico: semana 24 de 2023.'],
  ];
  const corpo = `${cabecalho({ titulo: 'Pneus novos e semi-novos', frase: 'Todas as medidas, das marcas de sempre à Davanti. Diga-nos a medida e respondemos com o preço.' })}
<section class="seccao seccao--primeira seccao--medida" aria-label="Pedir preço pela medida"><div class="contentor medida-envolta">${pedidoMedida(ctx)}${medidaLado(ctx)}</div></section>
<section class="seccao" aria-labelledby="t-tipos">
  <h2 class="sr" id="t-tipos">Novos e semi-novos</h2>
  <div class="contentor duas">
    <article class="bloco" id="novos">
      ${foto(ctx, 'davanti-protoura', { sizes: '(min-width: 900px) 560px, 100vw', classe: 'bloco__foto' })}
      <h3 class="bloco__titulo">Novos</h3>
      <p>Das marcas premium às mais em conta, sempre com a etiqueta europeia. Trabalhamos muito com a Davanti, uma marca britânica de pneus de qualidade a bom preço.</p>
      <p class="marcas">${conteudo.marcas.map((m) => `<span>${esc(m)}</span>`).join('')}</p>
    </article>
    <article class="bloco" id="semi-novos">
      ${foto(ctx, 'pneus-semi-novos', { sizes: '(min-width: 900px) 560px, 100vw', classe: 'bloco__foto' })}
      <h3 class="bloco__titulo">Semi-novos</h3>
      <p>Pneus testados e com garantia, em várias medidas e marcas, para quem quer poupar sem deixar a segurança de lado. Montados por nós, na oficina.</p>
      <p><a class="ligacao-seta" href="${wa(ctx, 'Olá! Têm pneus semi-novos nesta medida: ')}" target="_blank" rel="noopener">Perguntar se há a minha medida${icone.seta}</a></p>
    </article>
  </div>
</section>
${seccao({ id: 'ler-a-medida', titulo: 'Como ler a medida', sub: 'Toque em cada parte do código que está na parede lateral do pneu.', corpo: `<div class="contentor flanco-envolta">
  <div class="flanco" data-flanco>
    <p class="flanco__codigo">${partes.map(([k, t], i) => `<button type="button" class="flanco__parte" data-parte="${k}" aria-pressed="${i === 0}">${esc(t)}</button>`).join('')}</p>
    <div class="flanco__explicacoes">${partes.map(([k, , nome, texto], i) => `<p class="flanco__explicacao" data-explica="${k}"${i === 0 ? '' : ' hidden'}><b>${esc(nome)}</b> ${esc(texto)}</p>`).join('')}</div>
  </div>
  <dl class="sinais">${marcas.map(([s, t]) => `<div><dt>${esc(s)}</dt><dd>${esc(t)}</dd></div>`).join('')}</dl>
</div>` })}
${seccao({ id: 'montagem', titulo: 'A montagem', corpo: `<div class="contentor duas duas--texto">
  <ul class="lista-check" role="list">
    <li>${icone.check}Montagem e equilibragem, com pesos da cor da jante se quiser.</li>
    <li>${icone.check}Válvulas e sensores de pressão (TPMS): substituição e programação.</li>
    <li>${icone.check}Alinhamento da direção, para o pneu gastar por igual.</li>
    <li>${icone.check}Enviamos pneus para todo o país, incluindo as ilhas.</li>
  </ul>
  <p>${ligacaoSeta(ctx.href('/oficina/'), 'Ver tudo o que a oficina faz')}</p>
</div>` })}`;
  return {
    caminho: '/pneus/',
    titulo: 'Pneus novos e semi-novos em Fafe',
    descricao: `Pneus novos e semi-novos em Fafe: Davanti, Michelin, Continental e outras marcas, em todas as medidas. Diga a medida e receba o preço pelo WhatsApp.`,
    seccao: 'pneus',
    corpo,
    jsonLd: [migalhas(ctx, [['Pneus', '/pneus/']])],
  };
}

export function jantes(ctx) {
  const { conteudo } = ctx;
  const j = conteudo.jantes;
  const comJantes = conteudo.trabalhos.filter((t) => t.tipos.includes('jantes'));
  const corpo = `${cabecalho({ titulo: 'Jantes', frase: 'Novas, semi-novas, usadas e originais, em várias medidas e furações. E reparamos e pintamos as suas.' })}
<section class="seccao seccao--primeira" aria-label="Jantes à venda">
  <ul class="galeria contentor" role="list">${j.galeria.map((n, i) => `<li class="galeria__item${i === 0 ? ' galeria__item--grande' : ''}">${foto(ctx, n, { sizes: i === 0 ? '(min-width: 900px) 600px, 100vw' : '(min-width: 900px) 300px, 50vw', classe: 'galeria__foto', cedo: i < 3 })}</li>`).join('')}</ul>
</section>
<section class="seccao" aria-labelledby="t-jantes-o-que">
  <h2 class="sr" id="t-jantes-o-que">Comprar, reparar e personalizar</h2>
  <div class="contentor duas">
    <article class="bloco bloco--texto">
      <span class="bloco__icone">${icone.jante}</span>
      <h3 class="bloco__titulo">Comprar</h3>
      <p>${(j.venda.join(', ').replace(/, ([^,]*)$/, ' e $1')).replace(/^./, (c) => c.toUpperCase())}, das marcas dos carros e das melhores do aftermarket. Diga-nos o carro e o aro que procura.</p>
      <p>Enviamos jantes para todo o país.</p>
    </article>
    <article class="bloco bloco--texto">
      <span class="bloco__icone">${icone.pincel}</span>
      <h3 class="bloco__titulo">Reparar e personalizar</h3>
      <p>Reparação de jantes, mudança de cor, pinças e cubos dos travões pintados e aumento de aro, por exemplo de 14″ para 16″. Também sensores de pressão (TPMS).</p>
    </article>
  </div>
</section>
<section class="seccao" aria-label="Pedir jantes ou um orçamento">
  <div class="contentor">${pedidoJantes(ctx)}</div>
</section>
${seccao({ id: 'trabalhos', titulo: 'Jantes que montámos', ligacao: ligacaoSeta(ctx.href('/trabalhos/'), 'Ver todos os trabalhos'), corpo: filaTrabalhos(ctx, comJantes) })}
${folhasTrabalhos(ctx, comJantes)}`;
  return {
    caminho: '/jantes/',
    titulo: 'Jantes novas, semi-novas e usadas, reparação e pintura',
    descricao: 'Jantes novas, semi-novas, usadas e originais em Fafe, em várias medidas e furações. Reparação, mudança de cor e pintura de pinças. Pedido pelo WhatsApp.',
    seccao: 'jantes',
    corpo,
    jsonLd: [migalhas(ctx, [['Jantes', '/jantes/']])],
  };
}

function pedidoJantes(ctx) {
  const { site, conteudo } = ctx;
  const j = conteudo.jantes;
  return `<form class="medida medida--jantes" action="https://wa.me/${site.whatsapp}" method="get" target="_blank" data-jantes data-whatsapp="${site.whatsapp}">
  <input type="hidden" name="text" value="${esc(MENSAGEM_WHATSAPP)}">
  <h2 class="medida__titulo">Peça as suas jantes ou um orçamento</h2>
  <fieldset class="escolhas-grupo">
    <legend>O que precisa?</legend>
    <div class="escolhas">${j.servicos.map((s, i) => `<label class="escolha"><input type="radio" name="servico" value="${s.id}"${i === 0 ? ' checked' : ''}><span>${esc(s.nome)}</span></label>`).join('')}</div>
  </fieldset>
  <div class="medida__linha">
    <label class="campo"><span>Aro</span><select name="aro"><option value="">Não sei</option>${j.aros.map((a) => `<option value="${a}"${a === 18 ? ' selected' : ''}>${a}″</option>`).join('')}</select></label>
    <label class="campo campo--cresce"><span>O carro</span><input type="text" name="carro" maxlength="60" placeholder="Ex.: BMW Série 3 de 2019" autocomplete="off"></label>
  </div>
  <button class="botao botao--acao botao--largo" type="submit">${icone.whatsapp}Enviar pelo WhatsApp</button>
  <p class="medida__rodape">${icone.camara}<span>Na conversa, junte duas fotografias das jantes ou do carro.</span></p>
</form>`;
}

export function oficina(ctx) {
  const { conteudo } = ctx;
  const corpo = `${cabecalho({ titulo: 'Oficina', frase: 'Montagem, alinhamento, revisões, travões e baterias, na Rua de Calvelos, em Fafe.' })}
<section class="seccao seccao--primeira" aria-label="Serviços da oficina">
  <div class="contentor oficina">
    <div class="servicos">${conteudo.servicos.map((g) => `<section class="servicos__grupo" aria-labelledby="g-${g.icone}">
      <h2 class="servicos__titulo" id="g-${g.icone}"><span class="servicos__icone">${icone[g.icone]}</span>${esc(g.grupo)}</h2>
      <ul role="list">${g.itens.map(([n, d]) => `<li><span class="servicos__nome">${esc(n)}</span>${d ? `<span class="servicos__nota">${esc(d)}</span>` : ''}</li>`).join('')}</ul>
    </section>`).join('\n    ')}
      <p class="recolha">${icone.carro}<span>${esc(conteudo.recolha)}</span></p>
    </div>
    <div class="oficina__fotos">
      ${foto(ctx, 'bmw-530e-elevador', { sizes: '(min-width: 900px) 420px, 100vw', classe: 'oficina__foto oficina__foto--alta' })}
      ${foto(ctx, 'roda-na-desmontadora', { sizes: '(min-width: 900px) 200px, 50vw', classe: 'oficina__foto' })}
      ${foto(ctx, 'clio-na-oficina', { sizes: '(min-width: 900px) 200px, 50vw', classe: 'oficina__foto' })}
    </div>
  </div>
</section>
<section class="seccao" aria-labelledby="t-eletricos">
  <div class="contentor"><div class="destaque">
    ${foto(ctx, 'vw-id4', { sizes: '(min-width: 900px) 520px, 100vw', classe: 'destaque__foto' })}
    <div class="destaque__texto">
      <span class="bloco__icone">${icone.raio}</span>
      <h2 class="seccao__titulo" id="t-eletricos">Também elétricos e híbridos</h2>
      <p>Pneus adequados ao peso e ao binário dos elétricos, travões e manutenção, com o mesmo cuidado.</p>
      <a class="botao botao--acao" href="${wa(ctx, 'Olá! Gostava de marcar um serviço na oficina.')}" target="_blank" rel="noopener">${icone.whatsapp}Marcar pelo WhatsApp</a>
    </div>
  </div></div>
</section>`;
  return {
    caminho: '/oficina/',
    titulo: 'Oficina: alinhamento, revisões, travões e baterias',
    descricao: 'Oficina em Fafe: montagem e equilibragem, alinhamento da direção, revisões, travões, baterias e sensores de pressão. Também elétricos e híbridos.',
    seccao: 'oficina',
    corpo,
    jsonLd: [migalhas(ctx, [['Oficina', '/oficina/']])],
  };
}

export function trabalhos(ctx) {
  const { conteudo } = ctx;
  const filtros = [['todos', 'Todos'], ['pneus', 'Pneus'], ['jantes', 'Jantes'], ['oficina', 'Oficina']];
  const corpo = `${cabecalho({ titulo: 'Trabalhos', frase: 'Alguns dos carros que passaram pela oficina, do Instagram para aqui.' })}
<section class="seccao seccao--primeira" aria-label="Trabalhos">
  <div class="contentor">
    <div class="filtros" role="group" aria-label="Mostrar" data-filtros hidden>${filtros.map(([k, t], i) => `<button type="button" class="filtro" data-filtro="${k}" aria-pressed="${i === 0}">${t}</button>`).join('')}</div>
    <ul class="grelha-trabalhos" role="list" data-trabalhos>${conteudo.trabalhos.map((t) => cartaoTrabalho(ctx, t, { sizes: '(min-width: 1100px) 380px, (min-width: 640px) 46vw, 100vw' })).join('')}</ul>
    <p class="nota-mais">Há mais no Instagram: <a href="https://www.instagram.com/${ctx.site.instagram}/" target="_blank" rel="noopener">@${esc(ctx.site.instagram)}</a></p>
  </div>
</section>
${folhasTrabalhos(ctx, conteudo.trabalhos)}`;
  return {
    caminho: '/trabalhos/',
    titulo: 'Trabalhos: pneus, jantes e oficina',
    descricao: 'Carros que passaram pela Pneus Auto-Confiança, em Fafe: BMW M5, Audi RS5, Honda Civic Type R, Datsun 1200 e outros, com o que se fez em cada um.',
    seccao: 'trabalhos',
    corpo,
    ogImagem: partilhaFoto(ctx, 'bmw-m5'),
    jsonLd: [migalhas(ctx, [['Trabalhos', '/trabalhos/']])],
  };
}

export function contactos(ctx) {
  const { site } = ctx;
  const corpo = `${cabecalho({ titulo: 'Contactos', frase: 'Fale connosco pelo WhatsApp ou por telefone, ou passe por cá.' })}
<section class="seccao seccao--primeira" aria-label="Formas de contacto">
  <div class="contentor contactos">
    <ul class="contactos__lista" role="list">
      <li class="contacto"><span class="circulo-icone">${icone.whatsapp}</span><div><h2>WhatsApp</h2><a href="${wa(ctx)}" target="_blank" rel="noopener">Enviar uma mensagem</a></div></li>
      <li class="contacto"><span class="circulo-icone">${icone.telefone}</span><div><h2>Telefone</h2><p>${telefoneHtml(site.telefone, { frase: 'com-a' })}</p><p>${telefoneHtml(site.fixo, { frase: 'com-a' })}</p></div></li>
      <li class="contacto"><span class="circulo-icone">${icone.email}</span><div><h2>Email</h2><a href="mailto:${site.email}">${esc(site.email)}</a></div></li>
      <li class="contacto"><span class="circulo-icone">${icone.local}</span><div><h2>Morada</h2><p>${moradaLinha(site)}</p><a href="${site.mapa}" target="_blank" rel="noopener">Como chegar</a></div></li>
      <li class="contacto contacto--horario"><span class="circulo-icone">${icone.relogio}</span><div><h2>Horário ${estado(site)}</h2>${horarioTabela(site)}</div></li>
      <li class="contacto"><span class="circulo-icone">${icone.instagram}</span><div><h2>Redes</h2><p><a href="https://www.instagram.com/${site.instagram}/" target="_blank" rel="noopener">Instagram</a> · <a href="${site.facebook}" target="_blank" rel="noopener">Facebook</a></p></div></li>
    </ul>
    ${mapa(ctx)}
  </div>
  <p class="contentor identificacao">${esc(site.empresa.firma)} · NIF ${esc(site.empresa.nif)} · ${esc(site.empresa.sede)}</p>
</section>`;
  return {
    caminho: '/contactos/',
    titulo: 'Contactos, morada e horário',
    descricao: `Pneus Auto-Confiança: ${site.morada.rua}, ${site.morada.codigoPostal} ${site.morada.localidade}. Segunda a sexta 9:00–12:00 e 14:00–18:30 (sexta até às 19:00), sábado de manhã. WhatsApp e telefone.`,
    seccao: 'contactos',
    corpo,
    jsonLd: [migalhas(ctx, [['Contactos', '/contactos/']])],
  };
}

// ---------- legais (fora do Google) ----------

export function privacidade(ctx) {
  const { site } = ctx;
  const config = { alojamento: 'github-pages', email: 'sapo', whatsapp: true, instagram: true, facebookPage: true, repositorioPublico: true };
  const corpo = `${cabecalho({ titulo: 'Política de privacidade', frase: 'Como tratamos os dados de quem nos contacta.' })}
<div class="contentor texto">
  <h2>Quem é responsável</h2>
  <p>${esc(site.empresa.firma)}, NIF ${esc(site.empresa.nif)}, ${esc(site.empresa.sede)}, que explora a ${esc(site.marca)}. Contacto: <a href="mailto:${site.email}">${esc(site.email)}</a>.</p>
  <h2>Que dados tratamos e para quê</h2>
  <p>Este site não tem contas, não usa cookies e não guarda nada do que escreve: os pedidos pela medida e das jantes só preparam a mensagem, que envia por si pelo WhatsApp. O mapa é um desenho do próprio site e não contacta serviços de terceiros. Tratamos os dados que nos envia (nome, contacto, o carro e o que nos pede) para responder, fazer o orçamento e, se o aceitar, prestar e faturar o serviço.</p>
  <p>A base é o seu pedido e o contrato que daí resulte (RGPD, art. 6.º, n.º 1, alínea b)) e, na faturação, a obrigação legal (alínea c)).</p>
  <h2>Por quanto tempo</h2>
  <ul><li>${esc(prazos.pedidosDeContacto.texto)}</li><li>${esc(prazos.encomendas.texto.replace('Encomendas e facturas', 'Serviços prestados e faturas'))}</li></ul>
  <h2>Quem mais os vê</h2>
  ${destinatariosHtml(config, { formato: 'lista' })}
  ${frasesPrivacidade(config).map((f) => `<p>${esc(f)}</p>`).join('\n  ')}
  <h2>Os seus direitos</h2>
  ${direitosHtml({ email: site.email })}
</div>`;
  return { caminho: '/privacidade/', titulo: 'Política de privacidade', ortografia: true, descricao: 'Política de privacidade da Pneus Auto-Confiança: que dados tratamos quando nos contacta, para quê, por quanto tempo e os seus direitos.', seccao: 'legal', legal: true, corpo };
}

export function litigios(ctx) {
  const corpo = `${cabecalho({ titulo: 'Resolução alternativa de litígios', frase: 'Se não chegarmos a acordo sobre um serviço, estas são as entidades a que pode recorrer.' })}
<div class="contentor texto">
  ${ralHtml({ ambito: 'local', concelhos: [ctx.site.morada.concelho], textos: { supletivoLocal: 'para quem resida fora das áreas dos centros acima' } })
    .replace('(Tribunal Arbitral de Consumo) (', '— Tribunal Arbitral de Consumo (')}
  <p>Pode também apresentar uma reclamação no <a href="https://www.livroreclamacoes.pt/inicio" target="_blank" rel="noopener">Livro de Reclamações Eletrónico</a>.</p>
</div>`;
  return { caminho: '/litigios/', titulo: 'Resolução de litígios', ortografia: true, descricao: 'As entidades de resolução alternativa de litígios de consumo a que pode recorrer e o Livro de Reclamações Eletrónico.', seccao: 'legal', legal: true, corpo };
}

export function naoEncontrada(ctx) {
  const corpo = `${cabecalho({ titulo: 'Esta página saiu da estrada.', frase: 'O endereço pode estar errado ou a página já não existir.', acoes: `<a class="botao botao--acao" href="${ctx.href('/')}">Ir para o início</a><a class="botao botao--linha" href="${ctx.href('/contactos/')}">Contactos</a>` })}`;
  return { caminho: '/404.html', titulo: 'Página não encontrada', descricao: 'A página que procura não existe. Volte ao início da Pneus Auto-Confiança ou fale connosco.', seccao: 'outra', legal: true, corpo };
}
