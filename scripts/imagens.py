#!/usr/bin/env python3
"""As versões web das imagens do site da Pneus Auto-Confiança.

Lê:
  media/fotos/*.jpg     as fotografias (do Instagram deles, só as verdadeiras, sem texto por cima); cada uma tem de
                        estar em content/fotos.json, com a descrição
  media/marca/logo.png  o logótipo deles com transparência, tirado das duas versões que publicam (sobre branco no
                        Facebook, sobre preto no Instagram): alpha = 1 − (branco − preto)/255, sem redesenhar

Escreve em .cache/imagens/ (o nome de cada ficheiro leva um resumo do original: só se refaz o que muda) e o manifesto
.cache/imagens/manifesto.json, que o scripts/build.mjs lê para escrever os <picture> e copiar para _site/ só o que as
páginas usam.

    python3 scripts/imagens.py
"""
import glob, hashlib, json, os, sys
try:
    from PIL import Image, ImageOps, features
except ImportError:  # o Python do Mac tem a Pillow na pasta do utilizador
    sys.path.append(os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages'))
    from PIL import Image, ImageOps, features

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FOTOS = os.path.join(RAIZ, 'media', 'fotos')
MARCA = os.path.join(RAIZ, 'media', 'marca')
INDICE = os.path.join(RAIZ, 'content', 'fotos.json')
CACHE = os.path.join(RAIZ, '.cache', 'imagens')

LARGURAS = [360, 540, 720, 960, 1280, 1600]
FORMATOS = ('avif', 'webp') if features.check('avif') else ('webp',)
QUALIDADE = {'avif': 52, 'webp': 80}
PARTILHA = (1200, 630)
PRETO = (3, 6, 8)            # o preto do pneu do logótipo (medido: #030608)
VERSAO = f'v1-{LARGURAS}-{QUALIDADE}-{PARTILHA}'

# alturas a que o logótipo aparece (×1, ×2, ×3): cabeçalho 40–64, rodapé ~84, capa até ~260
ALTURAS_LOGO = (40, 44, 48, 52, 56, 60, 64, 72, 80, 84, 88, 96, 104, 112, 120, 132, 144, 156, 168, 180, 192, 208,
                224, 240, 252, 264, 288, 312, 336, 360, 400, 480, 520, 600, 720, 780)


def resumo(caminho, extra=''):
    h = hashlib.sha256((VERSAO + extra).encode())
    with open(caminho, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()[:10]


def guardar(im, destino, formato, **kw):
    if os.path.exists(destino):
        return
    tmp = destino + '.tmp'
    if formato == 'avif':
        im.save(tmp, 'AVIF', quality=kw.get('q', QUALIDADE['avif']), speed=6)
    elif formato == 'webp':
        im.save(tmp, 'WEBP', quality=kw.get('q', QUALIDADE['webp']), method=6)
    elif formato == 'png':
        im.save(tmp, 'PNG', optimize=True)
    else:
        im.save(tmp, 'JPEG', quality=kw.get('q', 82), optimize=True, progressive=True,
                subsampling=kw.get('subsampling', 2))
    os.replace(tmp, destino)


def versoes(nome, origem):
    """AVIF + WebP nas larguras que a imagem aguenta (nunca se aumenta), um JPEG de recurso e o cartão de partilha."""
    h = resumo(origem)
    with Image.open(origem) as cab:
        W, H = cab.size
    larguras = sorted(set([w for w in LARGURAS if w < W] + [min(W, LARGURAS[-1])]))
    jw = min(W, 960)
    feito = [os.path.join(CACHE, f'{nome}-{h}-{w}.{fmt}') for w in larguras for fmt in FORMATOS]
    feito += [os.path.join(CACHE, f'{nome}-{h}-{jw}.jpg'), os.path.join(CACHE, f'{nome}-{h}-partilha.jpg')]
    info = {'w': W, 'h': H, 'resumo': h, 'larguras': larguras, 'formatos': list(FORMATOS), 'jpg': jw}
    if all(os.path.exists(f) for f in feito):
        return info
    im = ImageOps.exif_transpose(Image.open(origem)).convert('RGB')
    for w in larguras:
        r = im if w == W else im.resize((w, round(H * w / W)), Image.LANCZOS)
        for fmt in FORMATOS:
            guardar(r, os.path.join(CACHE, f'{nome}-{h}-{w}.{fmt}'), fmt)
    guardar(im if jw == W else im.resize((jw, round(H * jw / W)), Image.LANCZOS),
            os.path.join(CACHE, f'{nome}-{h}-{jw}.jpg'), 'jpg')
    # cartão de partilha 1200×630, recortado ao meio (a ficha de cada trabalho partilha a sua fotografia)
    pw, ph = PARTILHA
    esc = max(pw / W, ph / H)
    r = im.resize((round(W * esc), round(H * esc)), Image.LANCZOS)
    x = (r.width - pw) // 2
    y = max(0, min(r.height - ph, round(r.height * 0.5 - ph / 2)))
    guardar(r.crop((x, y, x + pw, y + ph)), os.path.join(CACHE, f'{nome}-{h}-partilha.jpg'), 'jpg')
    return info


def marca():
    """O logótipo nas alturas em que aparece, os ícones (o logótipo no preto do pneu, como no Instagram) e o cartão
    de partilha (o logótipo inteiro ao centro, no mesmo preto, ao tamanho do desenho: nunca aumentado)."""
    origem = os.path.join(MARCA, 'logo.png')
    logo = Image.open(origem).convert('RGBA')
    h = resumo(origem)
    out = {'logo': {'w': logo.width, 'h': logo.height, 'resumo': h, 'alturas': []}}
    for alt in sorted(set(min(a, logo.height) for a in ALTURAS_LOGO)):
        w = round(logo.width * alt / logo.height)
        r = logo if alt == logo.height else logo.resize((w, alt), Image.LANCZOS)
        guardar(r, os.path.join(CACHE, f'logo-{h}-{alt}.png'), 'png')
        guardar(r, os.path.join(CACHE, f'logo-{h}-{alt}.webp'), 'webp', q=92)
        out['logo']['alturas'].append(alt)
    for lado in (32, 180, 192, 512):
        q = Image.new('RGBA', (lado, lado), PRETO + (255,))
        margem = 0.02 if lado == 32 else 0.08
        caixa = round(lado * (1 - 2 * margem))
        r = logo.copy(); r.thumbnail((caixa, caixa), Image.LANCZOS)
        q.alpha_composite(r, ((lado - r.width) // 2, (lado - r.height) // 2))
        guardar(q.convert('RGB'), os.path.join(CACHE, f'icone-{h}-{lado}.png'), 'png')
    out['icones'] = [32, 180, 192, 512]
    hc = resumo(origem, extra=f'cartao-{PRETO}-{PARTILHA}')
    out['partilha'] = f'pneus-auto-confianca-fafe-{hc}-partilha.jpg'
    destino = os.path.join(CACHE, out['partilha'])
    if not os.path.exists(destino):
        cartao = Image.new('RGBA', PARTILHA, PRETO + (255,))
        r = logo.copy()
        r.thumbnail((PARTILHA[0] - 200, PARTILHA[1] - 120), Image.LANCZOS)  # só encolhe se não couber
        cartao.alpha_composite(r, ((PARTILHA[0] - r.width) // 2, (PARTILHA[1] - r.height) // 2))
        guardar(cartao.convert('RGB'), destino, 'jpg', q=92, subsampling=0)
    return out


def main():
    indice = json.load(open(INDICE, encoding='utf-8'))
    fotos = {os.path.splitext(os.path.basename(f))[0]: f for f in sorted(glob.glob(os.path.join(FOTOS, '*.jpg')))}
    sem_indice = sorted(set(fotos) - set(indice))
    sem_ficheiro = sorted(set(indice) - set(fotos))
    if sem_indice or sem_ficheiro:
        if sem_indice:
            print('Fotografias sem entrada em content/fotos.json:', ', '.join(sem_indice))
        if sem_ficheiro:
            print('Entradas de content/fotos.json sem fotografia:', ', '.join(sem_ficheiro))
        sys.exit(1)
    os.makedirs(CACHE, exist_ok=True)
    manifesto = {'fotos': {}, 'marca': None}
    for nome, f in fotos.items():
        manifesto['fotos'][nome] = versoes(nome, f)
    manifesto['marca'] = marca()
    with open(os.path.join(CACHE, 'manifesto.json'), 'w', encoding='utf-8') as f:
        json.dump(manifesto, f, ensure_ascii=False, indent=1)
    print(f"{len(manifesto['fotos'])} fotografias e a marca.")


if __name__ == '__main__':
    main()
