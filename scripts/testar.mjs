#!/usr/bin/env node
// Provas do site construído (_site): cada página com título, descrição, um h1, canonical e og:image que existe; ligações,
// imagens e srcset internos existem; dados estruturados válidos; legais com noindex (e todas, na pré-visualização); sem
// texto por resolver; e as regras do Renato: rodapé «© ano Marca» sem NIF, Livro de Reclamações no rodapé, nota do custo
// da chamada junto de cada número, WhatsApp só como ligação (sem o número à vista), nada de passos nem frase de fecho na
// página inicial.
//   node scripts/testar.mjs [--base=/pneus-auto-confianca] [--producao]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(RAIZ, '_site');
const site = JSON.parse(readFileSync(join(RAIZ, 'content', 'site.json'), 'utf8'));
const producao = process.argv.includes('--producao');
const base = (process.argv.find((a) => a.startsWith('--base=')) || '--base=').slice(7).replace(/\/$/, '');
const paginas = [];
(function andar(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== 'assets') andar(p); } else if (f.endsWith('.html')) paginas.push(p); } })(SITE);

let ok = 0; const falhas = [];
const prova = (cond, msg) => { if (cond) ok++; else falhas.push(msg); };
const existe = (url) => {
  let caminho = url.split('#')[0].split('?')[0];
  if (base && caminho.startsWith(base)) caminho = caminho.slice(base.length);
  if (!caminho.startsWith('/')) return true;
  const f = join(SITE, decodeURIComponent(caminho));
  return existsSync(f) && (statSync(f).isFile() || existsSync(join(f, 'index.html')));
};
const plano = (html) => html.replace(/<(script|style|template)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|[\s ]+/g, ' ');

for (const p of paginas) {
  const rel = p.slice(SITE.length);
  const html = readFileSync(p, 'utf8');
  const legal = /\/(privacidade|litigios)\/|404\.html/.test(rel);
  const inicio = /^\/(propostas\/[abc]\/)?index\.html$/.test(rel);
  const semScripts = html.replace(/<(script|style)[\s\S]*?<\/(script|style)>/g, '');
  prova(/<title>[^<]{10,}<\/title>/.test(html), `${rel}: sem <title>`);
  prova(/<meta name="description" content="[^"]{60,}">/.test(html), `${rel}: descrição em falta ou curta`);
  prova((semScripts.replace(/<template[\s\S]*?<\/template>/g, '').match(/<h1[\s>]/g) || []).length === 1, `${rel}: não tem exatamente um h1`);
  prova(/<html lang="pt-PT"/.test(html), `${rel}: língua`);
  prova(/<link rel="canonical" href="https?:\/\//.test(html), `${rel}: canonical`);
  prova(!/\{\{|\}\}|undefined|NaN|\[object Object\]|null</.test(semScripts), `${rel}: texto por resolver (undefined, null, {{ }})`);
  if (legal || !producao) prova(html.includes('<meta name="robots" content="noindex">'), `${rel}: sem noindex`);
  else prova(!html.includes('noindex'), `${rel}: noindex numa página de produção`);
  const og = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
  prova(og && existe(new URL(og).pathname), `${rel}: og:image em falta (${og})`);
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(u)) continue;
    prova(existe(u), `${rel}: ligação partida ${u}`);
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) for (const parte of m[1].split(',')) prova(existe(parte.trim().split(' ')[0]), `${rel}: srcset partido ${parte.trim()}`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); ok++; } catch { falhas.push(`${rel}: JSON-LD inválido`); }
  }
  // as regras do Renato
  const rodape = (html.match(/<footer class="rodape">[\s\S]*?<\/footer>/) || [''])[0];
  prova(new RegExp(`© ${new Date().getFullYear()} ${site.marca}</p>`).test(rodape), `${rel}: rodapé sem «© ano ${site.marca}»`);
  prova(!rodape.includes(site.empresa.nif), `${rel}: o NIF está no rodapé`);
  prova(/livroreclamacoes\.pt/.test(rodape), `${rel}: rodapé sem o Livro de Reclamações`);
  for (const m of html.matchAll(/<a href="tel:[^"]+"[^>]*>([^<]*\d{3} \d{3} \d{3}[^<]*)(<span class="nota-chamada">\(Chamada para a rede (móvel|fixa) nacional\)<\/span>)?/g)) prova(Boolean(m[2]), `${rel}: número sem a nota da chamada (${m[1].trim()})`);
  for (const m of html.matchAll(/<a [^>]*href="https:\/\/wa\.me\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g)) prova(!/\d{3}\s?\d{3}\s?\d{3}/.test(plano(m[1])), `${rel}: o WhatsApp mostra o número`);
  if (inicio) prova(!/[Cc]omo funciona|[Dd]o pedido à entrega|[Pp]asso 1/.test(plano(html)), `${rel}: secção de passos na página inicial`);
}

// o que o site serve além das páginas
for (const f of ['favicon.png', 'apple-touch-icon.png', 'icone-192.png', 'icone-512.png', 'site.webmanifest', 'robots.txt', '.nojekyll', '404.html']) prova(existsSync(join(SITE, f)), `falta ${f}`);
if (producao) prova(existsSync(join(SITE, 'sitemap.xml')), 'falta o sitemap.xml');

if (falhas.length) { console.error(`${falhas.length} falhas (${ok} provas passaram):\n- ${[...new Set(falhas)].join('\n- ')}`); process.exit(1); }
console.log(`${paginas.length} páginas, ${ok} provas: tudo certo.`);
