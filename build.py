"""Genera las tarjetas del inicio y las páginas de detalle desde data/inmuebles.json.

Uso:  python build.py [ruta_del_excel.xlsx]
Cada inmueble lleva un código (101, 102, ...). Para publicar uno nuevo, agrégalo a
data/inmuebles.json (y sus fotos en assets/inmuebles/<codigo>/) y corre este script.
"""
import html
import json
import os
import sys
from urllib.parse import quote

ROOT = os.path.dirname(os.path.abspath(__file__))
WA = '573023487290'
CATEGORIAS = {'proyecto': 'Proyectos', 'lote': 'Lotes', 'casa': 'Casas', 'apartamento': 'Apartamentos', 'arriendo': 'Arriendos'}


def e(t):
    return html.escape(str(t), quote=True)


def wa(texto):
    return f'https://wa.me/{WA}?text={quote(texto)}'


def leer(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return f.read()


def escribir(p, s):
    full = os.path.join(ROOT, p)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8', newline='\n') as f:
        f.write(s)


def reemplazar(s, ini, fin, nuevo):
    i = s.index(ini) + len(ini)
    j = s.index(fin)
    return s[:i] + '\n' + nuevo + '\n    ' + s[j:]


# ---------- Tarjetas del inicio ----------
def tarjeta(it):
    cod = it['codigo']
    if it.get('foto_portada'):
        media = (f'<div class="h-52 relative"><img src="{e(it["foto_portada"])}" alt="{e(it["titulo"])}" '
                 f'loading="lazy" class="w-full h-full object-cover">')
    else:
        media = f'<div class="{it.get("ph", "ph1")} h-52 relative">'
    badges = (f'<span class="absolute top-3 left-3 bg-vino text-white text-xs font-semibold px-3 py-1 rounded-md">{e(it["negocio"].upper())}</span>'
              f'<span class="absolute top-3 right-3 bg-white/95 text-vino text-xs font-bold px-2.5 py-1 rounded-md">Cód. {cod}</span></div>')
    chips = ''.join(f'<span>{e(c)}</span>' for c in it.get('chips', []))
    nota = f'<p class="text-sm text-tinta/60">{e(it["precio_nota"])}</p>' if it.get('precio_nota') else ''
    if it.get('detalle'):
        href = f'inmueble/{cod}.html'
    else:
        href = wa(it['whatsapp_texto'])
    return f'''    <article data-t="{e(it['categoria'])}" class="card bg-white rounded-2xl overflow-hidden border border-black/10 flex flex-col">
      {media}{badges}
      <div class="p-6 flex flex-col flex-1">
        <p class="text-xs font-semibold text-rojo uppercase">{e(it['ubicacion_corta'])}</p>
        <h3 class="font-display font-bold text-xl mt-1 text-vino">{e(it['titulo'])}</h3>
        <p class="font-display font-extrabold text-2xl mt-3">{e(it['precio_texto'])}</p>
        {nota}
        <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-tinta/70">{chips}</div>
        <p class="mt-3 text-sm text-tinta/65">{e(it['resumen'])}</p>
        <a href="{e(href)}" class="mt-auto pt-5"><span class="block text-center rounded-lg border border-rojo text-rojo font-semibold py-2.5 hover:bg-rojo hover:text-white transition">Ver detalles</span></a>
      </div>
    </article>
'''


def inicio(items):
    s = leer('index.html')
    cats = []
    for it in items:
        if it['categoria'] not in cats:
            cats.append(it['categoria'])
    tabs = '      <button data-f="todos" class="tab-on rounded-lg px-4 py-2 bg-cielo text-vino">Todos</button>\n'
    for c in cats:
        tabs += f'      <button data-f="{c}" class="rounded-lg px-4 py-2 bg-cielo text-vino">{CATEGORIAS.get(c, c.title())}</button>\n'
    s = reemplazar(s, '<!-- TABS:START -->', '<!-- TABS:END -->', tabs.rstrip('\n'))
    s = reemplazar(s, '<!-- CARDS:START -->', '<!-- CARDS:END -->', '\n'.join(tarjeta(i) for i in items).rstrip('\n'))
    escribir('index.html', s)


# ---------- Página de detalle ----------
def partes_del_sitio():
    s = leer('index.html')
    head = s[:s.index('</head>')]
    chrome_ini = s.index('<!-- Franja superior -->')
    chrome_fin = s.index('<!-- Portada -->')
    top = s[chrome_ini:chrome_fin]
    foot_ini = s.index('<footer')
    foot_fin = s.index('<script>', foot_ini)
    foot = s[foot_ini:foot_fin]
    # rutas relativas desde /inmueble/
    top = top.replace('href="#', 'href="../index.html#').replace('src="logo.svg"', 'src="../logo.svg"')
    head = head.replace('href="logo.svg"', 'href="../logo.svg"')
    return head, top, foot


def lista(titulo, puntos):
    if not puntos:
        return ''
    li = ''.join(f'<li class="flex gap-3"><span class="text-rojo font-bold">&#10003;</span><span>{e(p)}</span></li>' for p in puntos)
    return f'''<div class="rounded-2xl border border-black/10 p-6">
        <h3 class="font-display font-bold text-lg text-vino">{e(titulo)}</h3>
        <ul class="mt-4 space-y-2 text-tinta/80">{li}</ul>
      </div>'''


def dato(titulo, valor, extra=''):
    return f'''<div class="rounded-2xl bg-suave p-5">
        <p class="text-xs font-semibold text-rojo uppercase tracking-wide">{e(titulo)}</p>
        <p class="mt-1 font-display font-extrabold text-xl text-tinta">{e(valor)}</p>
        {f'<p class="text-sm text-tinta/60">{e(extra)}</p>' if extra else ''}
      </div>'''


def detalle(it, partes):
    head, top, foot = partes
    cod = it['codigo']
    base = f'../assets/inmuebles/{cod}/'
    fotos = it.get('fotos', [])
    mapas = it.get('mapas', [])
    thumbs = ''.join(
        f'<button type="button" class="thumb rounded-lg overflow-hidden border-2 border-transparent aspect-[4/3] bg-black/5" data-i="{k}">'
        f'<img src="{base}{e(f["f"])}" alt="{e(f["alt"])}" loading="lazy" class="w-full h-full object-cover"></button>'
        for k, f in enumerate(fotos))
    gal_json = json.dumps([{'src': base + f['f'], 'alt': f['alt']} for f in fotos], ensure_ascii=False)

    datos = ''
    datos += dato('Área', it['area_texto'])
    datos += dato('Precio', it['precio_texto'], it.get('precio_nota', ''))
    if it.get('valor_total_aprox'):
        datos += dato('Valor aproximado', it['valor_total_aprox'], f'{it["area_texto"]} × {it["precio_texto"].replace(" por m²", "")}')
    for d in it.get('datos_extra', []):
        datos += dato(d['t'], d['v'], d.get('x', ''))
    if it.get('permuta'):
        datos += dato('Permuta', 'Sí', 'En parte de pago, por propiedad en Fusagasugá')

    desc = ''.join(f'<p class="mt-3 text-tinta/75">{e(p)}</p>' for p in it.get('descripcion', []))

    mapas_html = ''.join(
        f'''<figure><button type="button" class="zoom block w-full rounded-2xl overflow-hidden border border-black/10 bg-black/5" data-src="{base}{e(m['f'])}" data-alt="{e(m['texto'])}"><img src="{base}{e(m['f'])}" alt="{e(m['texto'])}" loading="lazy" class="w-full aspect-[3/4] object-cover"></button>
          <figcaption class="mt-2 text-sm text-tinta/65">{e(m['texto'])}</figcaption></figure>'''
        for m in mapas)

    video = ''
    if it.get('video'):
        video = f'''<section class="mt-14">
      <h2 class="font-display font-extrabold text-2xl text-vino">Video</h2>
      <video class="mt-4 w-full max-h-[70vh] rounded-2xl bg-black" controls preload="metadata" playsinline poster="{base}cover.jpg">
        <source src="{base}{e(it['video'])}" type="video/mp4">
      </video>
    </section>'''

    wa_link = wa(it['whatsapp_texto'])
    titulo_pag = f'Cód. {cod} · {it["titulo"]} | Inmobiliaria A&amp;D'

    head = head.replace(head[head.index('<title>'):head.index('</title>') + 8], f'<title>{titulo_pag}</title>')
    return f'''{head}
</head>
<body class="antialiased">

{top}
<main class="max-w-6xl mx-auto px-5 py-10">
  <nav class="text-sm text-tinta/60"><a href="../index.html" class="hover:text-rojo">Inicio</a> / <a href="../index.html#inmuebles" class="hover:text-rojo">Inmuebles</a> / <span>Cód. {cod}</span></nav>

  <div class="mt-5 flex flex-wrap items-start justify-between gap-4">
    <div>
      <div class="flex flex-wrap gap-2 text-xs font-semibold">
        <span class="bg-vino text-white px-3 py-1 rounded-md">{e(it['negocio'].upper())}</span>
        <span class="bg-cielo text-vino px-3 py-1 rounded-md">Cód. {cod}</span>
        <span class="bg-cielo text-vino px-3 py-1 rounded-md">{e(it.get('estado', ''))}</span>
      </div>
      <h1 class="mt-3 font-display font-extrabold text-3xl md:text-4xl text-vino">{e(it['titulo'])}</h1>
      <p class="mt-2 text-tinta/70">{e(it['referencia'])}</p>
    </div>
    <a href="{wa_link}" class="rounded-lg bg-rojo text-white font-semibold px-6 py-3.5 hover:bg-vino transition">Consultar por WhatsApp</a>
  </div>

  <section class="mt-8 grid lg:grid-cols-[1fr_300px] gap-4">
    <button type="button" id="main" class="relative rounded-2xl overflow-hidden bg-black/5 aspect-[4/3] w-full">
      <img id="mainimg" src="{base}{fotos[0]['f']}" alt="{e(fotos[0]['alt'])}" class="w-full h-full object-contain">
      <span id="counter" class="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full"></span>
    </button>
    <div class="grid grid-cols-4 lg:grid-cols-3 gap-2 content-start max-h-[520px] overflow-y-auto pr-1" id="thumbs">{thumbs}</div>
  </section>

  <section class="mt-10 grid sm:grid-cols-3 lg:grid-cols-5 gap-4">
    {datos}
  </section>

  <section class="mt-10">
    <h2 class="font-display font-extrabold text-2xl text-vino">Descripción</h2>
    {desc}
  </section>

  <section class="mt-10 grid md:grid-cols-3 gap-6">
    {lista('Servicios', it.get('servicios'))}
    {lista('Incluye', it.get('incluye'))}
    {lista('Ubicación', it.get('ubicacion_puntos'))}
  </section>

  <section class="mt-14">
    <h2 class="font-display font-extrabold text-2xl text-vino">Mapa y ubicación</h2>
    <div class="mt-4 grid md:grid-cols-3 gap-5">{mapas_html}</div>
  </section>

  {video}

  <section class="mt-14 rounded-3xl bg-rojo text-white px-8 py-12 text-center">
    <h2 class="font-display font-extrabold text-3xl max-w-2xl mx-auto">¿Te interesa el inmueble {cod}?</h2>
    <p class="mt-3 text-white/85">{e(it.get('permuta', 'Escríbenos y coordinamos una visita.'))}</p>
    <a href="{wa_link}" class="inline-block mt-7 rounded-lg bg-white text-vino font-semibold px-8 py-4 hover:bg-cielo transition">Escribir por WhatsApp</a>
  </section>
</main>

{foot}
<div id="lb" class="hidden fixed inset-0 z-[60] bg-black/90 items-center justify-center p-4">
  <button type="button" id="lbclose" class="absolute top-4 right-5 text-white text-4xl leading-none" aria-label="Cerrar">&times;</button>
  <button type="button" id="lbprev" class="absolute left-3 top-1/2 text-white text-5xl leading-none px-3" aria-label="Anterior">&#8249;</button>
  <img id="lbimg" src="" alt="" class="max-h-[90vh] max-w-full object-contain">
  <button type="button" id="lbnext" class="absolute right-3 top-1/2 text-white text-5xl leading-none px-3" aria-label="Siguiente">&#8250;</button>
</div>

<script>
const G = {gal_json};
let cur = 0, lista = G, lbOpen = false;
const mainimg = document.getElementById('mainimg'), counter = document.getElementById('counter');
const thumbs = document.querySelectorAll('.thumb');
function show(i) {{
  cur = (i + G.length) % G.length;
  mainimg.src = G[cur].src; mainimg.alt = G[cur].alt;
  counter.textContent = (cur + 1) + ' / ' + G.length;
  thumbs.forEach((t, k) => t.classList.toggle('border-rojo', k === cur));
}}
thumbs.forEach(t => t.addEventListener('click', () => show(+t.dataset.i)));
const lb = document.getElementById('lb'), lbimg = document.getElementById('lbimg');
function openLb(list, i) {{
  lista = list; cur = i; lbOpen = true;
  lbimg.src = lista[cur].src; lbimg.alt = lista[cur].alt;
  lb.classList.remove('hidden'); lb.classList.add('flex');
  const multi = lista.length > 1;
  document.getElementById('lbprev').style.display = multi ? '' : 'none';
  document.getElementById('lbnext').style.display = multi ? '' : 'none';
}}
function stepLb(d) {{ cur = (cur + d + lista.length) % lista.length; lbimg.src = lista[cur].src; lbimg.alt = lista[cur].alt; }}
function closeLb() {{ lbOpen = false; lb.classList.add('hidden'); lb.classList.remove('flex'); }}
document.getElementById('main').addEventListener('click', () => openLb(G, cur));
document.querySelectorAll('.zoom').forEach(z => z.addEventListener('click', () => openLb([{{src: z.dataset.src, alt: z.dataset.alt}}], 0)));
document.getElementById('lbclose').addEventListener('click', closeLb);
document.getElementById('lbprev').addEventListener('click', () => stepLb(-1));
document.getElementById('lbnext').addEventListener('click', () => stepLb(1));
lb.addEventListener('click', ev => {{ if (ev.target === lb) closeLb(); }});
document.addEventListener('keydown', ev => {{
  if (!lbOpen) return;
  if (ev.key === 'Escape') closeLb();
  if (ev.key === 'ArrowLeft') stepLb(-1);
  if (ev.key === 'ArrowRight') stepLb(1);
}});
show(0);
</script>
</body>
</html>
'''


# ---------- Excel ----------
def excel(items, ruta):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    wb = Workbook()
    ws = wb.active
    ws.title = 'Inventario'
    cols = ['Código', 'Negocio', 'Tipo', 'Título', 'Ubicación', 'Referencia de ubicación', 'Área', 'Precio',
            'Nota de precio', 'Valor total aprox.', 'Permuta', 'Separación', 'Financiación', 'Servicios',
            'Incluye', 'Documentos / legal', 'Descripción', 'Estado', 'Fecha', 'Fotos', 'Video',
            'Enlace en la página', 'Por confirmar con Deisy']
    ws.append(cols)
    for it in items:
        ws.append([
            it['codigo'], it['negocio'], it.get('tipo', ''), it['titulo'], it['ubicacion_corta'], it['referencia'],
            it['area_texto'], it['precio_texto'], it.get('precio_nota', ''), it.get('valor_total_aprox', ''),
            it.get('permuta', ''), it.get('separacion', ''), it.get('financiacion', ''),
            '; '.join(it.get('servicios', [])), '; '.join(it.get('incluye', [])), it.get('documentos', ''),
            ' '.join(it.get('descripcion', [])) or it.get('resumen', ''), it.get('estado', ''), it.get('fecha', ''),
            len(it.get('fotos', [])), 'Sí' if it.get('video') else '',
            f'https://inmobiliariaayd.online/inmueble/{it["codigo"]}.html' if it.get('detalle') else 'Solo tarjeta (WhatsApp)',
            it.get('por_confirmar', '')])
    head_fill = PatternFill('solid', fgColor='8B0F1F')
    for c in ws[1]:
        c.font = Font(bold=True, color='FFFFFF')
        c.fill = head_fill
        c.alignment = Alignment(wrap_text=True, vertical='center')
    anchos = [9, 9, 22, 30, 30, 40, 14, 18, 22, 18, 30, 14, 30, 45, 28, 30, 60, 13, 12, 7, 7, 38, 50]
    for k, w in enumerate(anchos):
        ws.column_dimensions[chr(65 + k)].width = w
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical='top')
    ws.freeze_panes = 'E2'
    wb.save(ruta)


if __name__ == '__main__':
    with open(os.path.join(ROOT, 'data', 'inmuebles.json'), encoding='utf-8') as f:
        items = json.load(f)
    codigos = [i['codigo'] for i in items]
    assert len(codigos) == len(set(codigos)), 'Código repetido'
    inicio(items)
    partes = partes_del_sitio()
    for it in items:
        if it.get('detalle'):
            escribir(f'inmueble/{it["codigo"]}.html', detalle(it, partes))
    if len(sys.argv) > 1:
        excel(items, sys.argv[1])
    print('Listo:', len(items), 'inmuebles')
