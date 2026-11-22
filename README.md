# Pneus Auto-Confiança — site

Site da Pneus Auto-Confiança, casa de pneus e oficina na Rua de Calvelos, 696, em Fafe (Gabriel Pereira Costa,
Unipessoal, Lda.). Pneus novos e semi-novos, jantes (venda, reparação, cor) e oficina. Pré-visualização no GitHub Pages,
com noindex: https://renatovalente5.github.io/pneus-auto-confianca/ — as três propostas de desenho, A «Asfalto» (escura),
B «Garagem» (clara) e C «Rasto» (mosaico); a de `content/site.json → variante` fica na raiz e as outras em
`/propostas/<letra>/`. A firma já tem o domínio pneusautoconfianca.pt (só com email, sem site).

    python3 scripts/imagens.py          # versões AVIF/WebP das fotografias, o logótipo, ícones e cartão de partilha (.cache/imagens)
    node scripts/mapa.mjs               # só se a oficina mudar de sítio: o mapa (ruas do OpenStreetMap) em media/mapa/loja.svg
    node scripts/build.mjs --propostas  # o site em _site/ (--base, --url, --producao, --variante=b)
    node scripts/testar.mjs             # provas do site construído
    python3 -m http.server 5230 --directory _site

Conteúdo em `content/` (site.json: marca, contactos, horário, firma; conteudo.json: capa, áreas, medidas do pedido,
serviços, jantes, trabalhos e as críticas do Google; fotos.json: as descrições). As fotografias em `media/fotos/` são as
verdadeiras do Instagram @pneus_auto_confianca_oficina, sem as que têm texto por cima. O logótipo (`media/marca/logo.png`)
é o desenho deles com transparência, tirado das duas versões que publicam (sobre branco no Facebook e sobre preto no
Instagram), sem redesenhar. As letras (Mona Sans, Instrument Sans, Geologica) são SIL OFL. As peças legais vêm de
`legal-comum/`. O site não tem cookies nem serviços de terceiros: o mapa é desenhado aqui e os pedidos só compõem a
mensagem do WhatsApp.
