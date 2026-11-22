#!/usr/bin/env node
// Constrói o site em _site/ a partir de content/, media/ (via .cache/imagens) e src/.
//
//   node scripts/build.mjs                         pré-visualização local (base /, noindex)
//   node scripts/build.mjs --propostas             as três propostas: a escolhida na raiz, as outras em /propostas/<letra>/
//   node scripts/build.mjs --base=/pneus-auto-confianca --url=https://renatovalente5.github.io/pneus-auto-confianca --propostas
//   node scripts/build.mjs --producao --url=https://pneusautoconfianca.pt   (indexável, com sitemap; quando houver domínio)
//
// Antes: python3 scripts/imagens.py (gera .cache/imagens e o manifesto) e, só se a oficina mudar de sítio,
// node scripts/mapa.mjs (media/mapa/loja.svg).
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { criarContexto, partilhaMarca } from '../src/templates/util.mjs';
import { pagina, VARIANTES, FONTES } from '../src/templates/layout.mjs';
import * as P from '../src/templates/paginas.mjs';
import { livroCss } from '../legal-comum/index.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const producao = process.argv.includes('--producao');
const opcoes = {
  base: (arg('base', '') || '').replace(/\/$/, ''),
  url: arg('url', 'http://127.0.0.1:5230').replace(/\/$/, ''),
  producao,
  preview: !producao,
  propostas: !producao && process.argv.includes('--propostas'),
  saida: join(RAIZ, arg('saida', '_site')),
};

const ler = (f) => JSON.parse(readFileSync(join(RAIZ, f), 'utf8'));
const site = ler('content/site.json');
const conteudo = ler('content/conteudo.json');
const fotos = ler('content/fotos.json');
opcoes.padrao = arg('variante', site.variante);
const CACHE = join(RAIZ, '.cache', 'imagens');
if (!existsSync(join(CACHE, 'manifesto.json'))) throw new Error('Falta .cache/imagens/manifesto.json: corre primeiro python3 scripts/imagens.py');
const manifesto = JSON.parse(readFileSync(join(CACHE, 'manifesto.json'), 'utf8'));

// ---- o conteúdo bate certo? (uma gralha num nome de fotografia pararia o site a meio) ----
const erros = [];
if (!VARIANTES[opcoes.padrao]) erros.push(`variante «${opcoes.padrao}» desconhecida (a, b ou c)`);
const fotosUsadas = [...conteudo.areas.map((a) => a.foto), ...conteudo.jantes.galeria, ...conteudo.trabalhos.flatMap((t) => t.fotos)];
for (const n of fotosUsadas) if (!fotos[n] || !manifesto.fotos[n]) erros.push(`fotografia «${n}»: não está em content/fotos.json ou no manifesto`);
const ids = conteudo.trabalhos.map((t) => t.id);
if (new Set(ids).size !== ids.length) erros.push('trabalhos: há dois com o mesmo id');
for (const t of conteudo.trabalhos) if (!/^\d{4}-\d\d$/.test(t.data)) erros.push(`trabalho ${t.id}: data «${t.data}» (aaaa-mm)`);
if (!existsSync(join(RAIZ, 'media', 'mapa', 'loja.svg'))) erros.push('falta media/mapa/loja.svg (node scripts/mapa.mjs)');
if (erros.length) { console.error('O conteúdo tem problemas:\n- ' + erros.join('\n- ')); process.exit(1); }

// ---- saída limpa ----
rmSync(opcoes.saida, { recursive: true, force: true });
for (const d of ['assets/img', 'assets/fontes']) mkdirSync(join(opcoes.saida, d), { recursive: true });
const resumo = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 10);

// letras e ficheiros com resumo no nome (o GitHub Pages guarda 10 min em cache e não deixa mudar os cabeçalhos)
const fontes = {};
for (const f of readdirSync(join(RAIZ, 'src', 'fontes')).filter((x) => x.endsWith('.woff2'))) {
  const buf = readFileSync(join(RAIZ, 'src', 'fontes', f));
  const nome = f.replace('.woff2', `-${resumo(buf)}.woff2`);
  writeFileSync(join(opcoes.saida, 'assets', 'fontes', nome), buf);
  fontes[f] = nome;
}
const cssFontes = Object.values(FONTES).map((f) => `@font-face{font-family:"${f.familia}";src:url("fontes/${fontes[f.ficheiro]}") format("woff2");${f.css};font-display:swap}`).join('\n');
const css = [cssFontes, livroCss(), readFileSync(join(RAIZ, 'src', 'estilos', 'site.css'), 'utf8')].join('\n');
const assets = { fontes };
const escreverAsset = (chave, texto, ext) => {
  const nome = `${chave}-${resumo(texto)}.${ext}`;
  writeFileSync(join(opcoes.saida, 'assets', nome), texto);
  assets[ext] = nome;
};
escreverAsset('site', css, 'css');
escreverAsset('site', readFileSync(join(RAIZ, 'src', 'scripts', 'site.js'), 'utf8'), 'js');

// ---- páginas, por proposta ----
const usados = new Set();
const escrever = (caminho, html) => {
  const destino = caminho.endsWith('.html') ? join(opcoes.saida, caminho) : join(opcoes.saida, caminho, 'index.html');
  mkdirSync(dirname(destino), { recursive: true });
  if (existsSync(destino)) throw new Error(`duas páginas no mesmo endereço: ${caminho}`);
  writeFileSync(destino, html.normalize('NFC'));
};
// Tipografia dos títulos (h1–h3): as palavras curtas agarram-se à seguinte (não ficam sozinhas no fim da linha) e as
// palavras com hífen não partem no hífen («semi- / novos», «Auto- / Confiança»). Só no texto, nunca nas etiquetas.
const CURTAS = /(^|[\s>(«])(e|o|a|os|as|é|à|às|ao|aos|um|uma|de|do|da|em|no|na|se|só|até|por|para) (?=[^\s<])/giu;
const tipografiaTexto = (t) => t.replace(CURTAS, '$1$2 ').replace(CURTAS, '$1$2 ').replace(/([\p{L}\d]+(?:-[\p{L}\d]+)+)/gu, '<span class="nw">$1</span>');
const tipografia = (html) => html.replace(/<(h[123])([^>]*)>([\s\S]*?)<\/\1>/g, (_, tag, attrs, dentro) =>
  `<${tag}${attrs}>${dentro.split(/(<[^>]+>)/).map((parte) => (parte.startsWith('<') ? parte : tipografiaTexto(parte))).join('')}</${tag}>`);
// As peças legais vêm do legal-comum, ainda na grafia antiga: aqui ficam no Acordo Ortográfico, como o resto do site.
const AO90 = { rectificação: 'retificação', afectar: 'afetar', 'Protecção': 'Proteção', protecção: 'proteção', actualizada: 'atualizada', actualizado: 'atualizado', 'co-responsabilidade': 'corresponsabilidade', efectuar: 'efetuar', objecto: 'objeto', direcção: 'direção', colectiva: 'coletiva', facturação: 'faturação', facturas: 'faturas' };
const ortografia = (html) => html.replace(new RegExp(Object.keys(AO90).join('|'), 'g'), (m) => AO90[m]);

const variantes = opcoes.propostas ? [opcoes.padrao, ...Object.keys(VARIANTES).filter((k) => k !== opcoes.padrao)] : [opcoes.padrao];
let nPaginas = 0;
const todas = [];
for (const variante of variantes) {
  const prefixo = variante === opcoes.padrao ? '' : `/propostas/${variante}`;
  const ctx = criarContexto({ base: opcoes.base, raiz: opcoes.base + prefixo, url: opcoes.url, manifesto, fotos, usados });
  Object.assign(ctx, { site, conteudo, opcoes, assets, variante });
  ctx.partilhaMarca = partilhaMarca(ctx);
  const paginas = [P.inicio(ctx), P.pneus(ctx), P.jantes(ctx), P.oficina(ctx), P.trabalhos(ctx), P.contactos(ctx), P.privacidade(ctx), P.litigios(ctx)];
  if (!prefixo) paginas.push(P.naoEncontrada(ctx));
  for (const p of paginas) {
    let html = tipografia(pagina(ctx, p));
    if (p.ortografia) html = ortografia(html);
    escrever(prefixo + p.caminho, html);
    nPaginas++;
    if (!prefixo) todas.push({ ...p, abs: ctx.absPagina(p.caminho) });
  }
}

// ---- imagens usadas ----
let nImg = 0;
for (const f of usados) {
  const origem = join(CACHE, f);
  if (!existsSync(origem)) throw new Error(`Falta na cache: ${f} (corre python3 scripts/imagens.py)`);
  copyFileSync(origem, join(opcoes.saida, 'assets', 'img', f)); nImg++;
}

// ---- ícones, manifesto da app, robots, sitemap ----
const hl = manifesto.marca.logo.resumo;
copyFileSync(join(CACHE, `icone-${hl}-32.png`), join(opcoes.saida, 'favicon.png'));
copyFileSync(join(CACHE, `icone-${hl}-180.png`), join(opcoes.saida, 'apple-touch-icon.png'));
copyFileSync(join(CACHE, `icone-${hl}-192.png`), join(opcoes.saida, 'icone-192.png'));
copyFileSync(join(CACHE, `icone-${hl}-512.png`), join(opcoes.saida, 'icone-512.png'));
const asset = (c) => (opcoes.base + c).replace(/\/{2,}/g, '/');
writeFileSync(join(opcoes.saida, 'site.webmanifest'), JSON.stringify({
  name: site.marca, short_name: site.marcaCurta, start_url: asset('/'), display: 'browser',
  background_color: '#0B0D10', theme_color: '#0B0D10',
  icons: [{ src: asset('/icone-192.png'), sizes: '192x192', type: 'image/png' }, { src: asset('/icone-512.png'), sizes: '512x512', type: 'image/png' }],
}, null, 1));
writeFileSync(join(opcoes.saida, '.nojekyll'), '');
if (opcoes.producao) {
  const indexaveis = todas.filter((p) => p.indexar !== false && !p.legal);
  // O <lastmod> sai do git (o último commit que mexeu no que faz as páginas), nunca do relógio do build.
  const git = (...a) => execFileSync('git', a, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  if (git('rev-parse', '--is-shallow-repository') === 'true') throw new Error('histórico raso: as datas do mapa do site sairiam erradas (fetch-depth: 0 no checkout)');
  const data = git('log', '-1', '--format=%cI', '--', 'content', 'src', 'media', 'legal-comum', 'scripts/build.mjs', 'scripts/imagens.py');
  writeFileSync(join(opcoes.saida, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${opcoes.url}/sitemap.xml\n`);
  writeFileSync(join(opcoes.saida, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexaveis.map((p) => `  <url><loc>${p.abs}</loc><lastmod>${data}</lastmod></url>`).join('\n')}\n</urlset>\n`);
} else {
  // pré-visualização: as páginas levam noindex; o robots deixa ler (para o Google ver o noindex)
  writeFileSync(join(opcoes.saida, 'robots.txt'), 'User-agent: *\nAllow: /\n');
}

console.log(`${nPaginas} páginas (${variantes.map((v) => v.toUpperCase()).join(', ')}), ${nImg} imagens → ${opcoes.saida} (${opcoes.producao ? 'produção' : 'pré-visualização noindex'})`);
