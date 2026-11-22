// Funções comuns do gerador: escapar, imagens responsivas, marca, horário, WhatsApp, dados estruturados.

export const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// O contexto de uma construção. base: onde o site vive (/pneus-auto-confianca no GitHub Pages); raiz: onde vivem as
// páginas desta proposta (a base, ou /propostas/b…). As imagens, letras e scripts são sempre os da base (partilhados).
export function criarContexto({ base, raiz, url, manifesto, fotos, usados }) {
  const ctx = { base, raiz, url, manifesto, fotos, usados };
  ctx.href = (caminho = '/') => (raiz + caminho).replace(/\/{2,}/g, '/');
  ctx.asset = (caminho = '/') => (base + caminho).replace(/\/{2,}/g, '/');
  ctx.abs = (caminho = '/') => url.replace(/\/$/, '') + caminho;     // url já inclui a base; caminho sem a base
  ctx.absPagina = (caminho = '/') => ctx.abs(ctx.href(caminho).slice(base.length) || '/');
  return ctx;
}

// <picture> com AVIF e WebP nas larguras que existem, e um JPEG de recurso.
// sizes: o que a imagem ocupa no ecrã; prioridade: só na imagem principal do primeiro ecrã (LCP).
export function foto(ctx, nome, { sizes = '100vw', classe = '', prioridade = false, cedo = false, alt, foco, largura } = {}) {
  const m = ctx.manifesto.fotos[nome];
  const info = ctx.fotos[nome];
  if (!m || !info) throw new Error(`Fotografia desconhecida: ${nome}`);
  const larguras = largura ? m.larguras.filter((w) => w <= largura) : m.larguras;
  const ws = larguras.length ? larguras : [m.larguras[0]];
  const prefixo = `${nome}-${m.resumo}`;
  const fontes = m.formatos.map((fmt) => {
    const srcset = ws.map((w) => { const f = `${prefixo}-${w}.${fmt}`; ctx.usados.add(f); return `${ctx.asset('/assets/img/' + f)} ${w}w`; }).join(', ');
    return `<source type="image/${fmt}" srcset="${srcset}" sizes="${esc(sizes)}">`;
  }).join('');
  const jpg = `${prefixo}-${m.jpg}.jpg`;
  ctx.usados.add(jpg);
  const h = Math.round(m.h * m.jpg / m.w);
  const f = foco ?? info.foco ?? 50;
  const estilo = f !== 50 ? ` style="object-position:50% ${f}%"` : '';
  const carregar = prioridade ? 'fetchpriority="high" decoding="async"' : cedo ? 'decoding="async"' : 'loading="lazy" decoding="async"';
  return `<picture${classe ? ` class="${classe}"` : ''}>${fontes}<img src="${ctx.asset('/assets/img/' + jpg)}" width="${m.jpg}" height="${h}" alt="${esc(alt ?? info.alt)}" ${carregar}${estilo}></picture>`;
}

// O srcset de uma fotografia num formato (para o preload da imagem principal).
export function srcsetFoto(ctx, nome, fmt = 'avif') {
  const m = ctx.manifesto.fotos[nome];
  const f = m.formatos.includes(fmt) ? fmt : m.formatos[0];
  return { fmt: f, srcset: m.larguras.map((w) => { const n = `${nome}-${m.resumo}-${w}.${f}`; ctx.usados.add(n); return `${ctx.asset('/assets/img/' + n)} ${w}w`; }).join(', ') };
}

// Uma fotografia em JPEG com o endereço completo (dados estruturados) e o cartão de partilha 1200×630 dela.
export const jpegAbs = (ctx, nome) => {
  const m = ctx.manifesto.fotos[nome];
  const f = `${nome}-${m.resumo}-${m.jpg}.jpg`;
  ctx.usados.add(f);
  return ctx.abs('/assets/img/' + f);
};
export const partilhaFoto = (ctx, nome) => {
  const m = ctx.manifesto.fotos[nome];
  const f = `${nome}-${m.resumo}-partilha.jpg`;
  ctx.usados.add(f);
  return ctx.abs('/assets/img/' + f);
};
export function partilhaMarca(ctx) {
  const f = ctx.manifesto.marca.partilha;
  ctx.usados.add(f);
  return ctx.abs('/assets/img/' + f);
}

// O logótipo deles (com transparência, nunca redesenhado) como <img> com srcset 1×/2×/3×.
export function logo(ctx, altura, { classe = '', alt = '', prioridade = false } = {}) {
  const m = ctx.manifesto.marca.logo;
  const alturas = m.alturas;
  const escolha = (x) => alturas.find((a) => a >= altura * x) ?? alturas[alturas.length - 1];
  const um = escolha(1), dois = escolha(2), tres = escolha(3);
  const f = (a, fmt) => { const n = `logo-${m.resumo}-${a}.${fmt}`; ctx.usados.add(n); return ctx.asset('/assets/img/' + n); };
  const w = Math.round(m.w * altura / m.h);
  return `<picture${classe ? ` class="${classe}"` : ''}><source type="image/webp" srcset="${f(um, 'webp')} 1x, ${f(dois, 'webp')} 2x, ${f(tres, 'webp')} 3x"><img src="${f(dois, 'png')}" width="${w}" height="${altura}" alt="${esc(alt)}" decoding="async"${prioridade ? ' fetchpriority="high"' : ''}></picture>`;
}

export const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// Ligação do WhatsApp com a mensagem já escrita.
export const whatsappHref = (numero, texto = '') => numero
  ? `https://wa.me/${numero}${texto ? '?text=' + encodeURIComponent(texto) : ''}`
  : '';

// O horário: «9:00–12:00 e 14:00–18:30» (sem o zero à esquerda, como se diz).
const hora = (h) => h.replace(/^0/, '');
export const turnosTexto = (turnos) => turnos.length ? turnos.map(([a, f]) => `${hora(a)}–${hora(f)}`).join(' e ') : 'Fechado';

// O horário para o Google (openingHoursSpecification).
const DIAS = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' };
export const horarioSchema = (horario) => horario.flatMap((l) => l.turnos.map(([abre, fecha]) => ({
  '@type': 'OpeningHoursSpecification', dayOfWeek: l.codigos.map((c) => DIAS[c]), opens: abre, closes: fecha,
})));

// «2026-04» → «abril de 2026»
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const mesAno = (aaaamm) => { const [a, m] = aaaamm.split('-').map(Number); return `${MESES[m - 1]} de ${a}`; };

// 4,7 (vírgula decimal)
export const decimal = (n) => String(n).replace('.', ',');

export { ICONES as icone } from '../lib/icones.mjs';
