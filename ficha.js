// Ficha de un inmueble creado desde el panel: ficha.html?c=<codigo>
(function () {
  const root = document.getElementById('ficha');
  const C = window.AYD_SUPABASE;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cod = parseInt(new URLSearchParams(location.search).get('c'), 10);

  function vacio(msg) {
    root.innerHTML = '<div class="py-24 text-center"><h1 class="font-display font-extrabold text-3xl text-vino">' + esc(msg) + '</h1>' +
      '<a href="index.html#inmuebles" class="inline-block mt-6 rounded-lg bg-rojo text-white font-semibold px-6 py-3 hover:bg-vino transition">Ver todos los inmuebles</a></div>';
  }
  if (!cod || !C) return vacio('Inmueble no encontrado');

  const H = { apikey: C.key, Authorization: 'Bearer ' + C.key };
  fetch(C.url + '/rest/v1/inmuebles?select=codigo,estado,titulo,categoria,negocio,datos&publicado=eq.true&codigo=eq.' + cod, { headers: H })
    .then(r => r.ok ? r.json() : [])
    .then(filas => filas.length ? pintar(filas[0]) : vacio('Este inmueble no está disponible'))
    .catch(() => vacio('No pudimos cargar el inmueble'));

  function lista(titulo, items) {
    if (!items || !items.length) return '';
    return '<div class="rounded-2xl border border-black/10 p-6"><h3 class="font-display font-bold text-lg text-vino">' + esc(titulo) + '</h3>' +
      '<ul class="mt-4 space-y-2 text-tinta/80">' + items.map(t => '<li class="flex gap-3"><span class="text-rojo font-bold">&#10003;</span><span>' + esc(t) + '</span></li>').join('') + '</ul></div>';
  }
  function dato(t, v, x) {
    if (!v) return '';
    return '<div class="rounded-2xl bg-suave p-5"><p class="text-xs font-semibold text-rojo uppercase tracking-wide">' + esc(t) + '</p>' +
      '<p class="mt-1 font-display font-extrabold text-xl text-tinta">' + esc(v) + '</p>' + (x ? '<p class="text-sm text-tinta/60">' + esc(x) + '</p>' : '') + '</div>';
  }

  function pintar(r) {
    const d = r.datos || {};
    const fotos = (d.fotos || []).filter(f => f && f.url);
    const videos = (d.videos || []).filter(v => v && v.url);
    const wa = 'https://wa.me/573023487290?text=' + encodeURIComponent(d.whatsapp_texto || ('Hola, me interesa el inmueble ' + r.codigo));
    document.title = 'Cód. ' + r.codigo + ' · ' + r.titulo + ' | Inmobiliaria A&D';
    const desc = (d.descripcion || []).map(p => '<p class="mt-3 text-tinta/75">' + esc(p) + '</p>').join('');
    const thumbs = fotos.map((f, k) => '<button type="button" class="thumb rounded-lg overflow-hidden border-2 border-transparent aspect-[4/3] bg-black/5" data-i="' + k + '"><img src="' + esc(f.url) + '" alt="' + esc(f.alt || r.titulo) + '" loading="lazy" class="w-full h-full object-cover"></button>').join('');
    const galeria = fotos.length ? (
      '<section class="mt-8 grid ' + (fotos.length > 1 ? 'lg:grid-cols-[1fr_300px]' : '') + ' gap-4">' +
      '<button type="button" id="main" class="relative rounded-2xl overflow-hidden bg-black/5 aspect-[4/3] w-full"><img id="mainimg" src="' + esc(fotos[0].url) + '" alt="' + esc(r.titulo) + '" class="w-full h-full object-contain"><span id="counter" class="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full"></span></button>' +
      (fotos.length > 1 ? '<div class="grid grid-cols-4 lg:grid-cols-3 gap-2 content-start max-h-[520px] overflow-y-auto pr-1">' + thumbs + '</div>' : '') + '</section>') : '';
    const vids = videos.length ? (
      '<section class="mt-10"><h2 class="font-display font-extrabold text-2xl text-vino">' + (videos.length > 1 ? 'Videos' : 'Video') + '</h2>' +
      '<div class="mt-4 grid gap-5 ' + (videos.length > 1 ? 'md:grid-cols-2' : '') + '">' +
      videos.map(v => '<video class="w-full max-h-[70vh] rounded-2xl bg-black" controls preload="metadata" playsinline><source src="' + esc(v.url) + '" type="video/mp4"></video>').join('') + '</div></section>') : '';
    const datos = dato('Área', d.area_texto) + dato('Precio', d.precio_texto, d.precio_nota);
    root.innerHTML =
      '<nav class="text-sm text-tinta/60"><a href="index.html" class="hover:text-rojo">Inicio</a> / <a href="index.html#inmuebles" class="hover:text-rojo">Inmuebles</a> / <span>Cód. ' + esc(r.codigo) + '</span></nav>' +
      '<div class="mt-5 flex flex-wrap items-start justify-between gap-4"><div><div class="flex flex-wrap gap-2 text-xs font-semibold">' +
      '<span class="bg-vino text-white px-3 py-1 rounded-md">' + esc(String(r.negocio).toUpperCase()) + '</span>' +
      '<span class="bg-cielo text-vino px-3 py-1 rounded-md">Cód. ' + esc(r.codigo) + '</span>' +
      '<span class="bg-cielo text-vino px-3 py-1 rounded-md">' + esc(r.estado) + '</span></div>' +
      '<h1 class="mt-3 font-display font-extrabold text-3xl md:text-4xl text-vino">' + esc(r.titulo) + '</h1>' +
      '<p class="mt-2 text-tinta/70">' + esc(d.referencia || d.ubicacion_corta) + '</p></div>' +
      '<a href="' + wa + '" class="rounded-lg bg-rojo text-white font-semibold px-6 py-3.5 hover:bg-vino transition">Consultar por WhatsApp</a></div>' +
      galeria +
      '<section class="mt-10 grid sm:grid-cols-2 gap-4">' + datos + '</section>' + vids +
      (desc ? '<section class="mt-10"><h2 class="font-display font-extrabold text-2xl text-vino">Descripción</h2>' + desc + '</section>' : '') +
      '<section class="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">' +
      lista(d.servicios_titulo || 'Características', d.servicios) + lista('Condiciones', d.condiciones) + lista('Ubicación', d.ubicacion_puntos) + '</section>' +
      '<section class="mt-14 rounded-3xl bg-rojo text-white px-8 py-12 text-center"><h2 class="font-display font-extrabold text-3xl max-w-2xl mx-auto">¿Te interesa el inmueble ' + esc(r.codigo) + '?</h2>' +
      '<p class="mt-3 text-white/85">Escríbenos y coordinamos una visita.</p>' +
      '<a href="' + wa + '" class="inline-block mt-7 rounded-lg bg-white text-vino font-semibold px-8 py-4 hover:bg-cielo transition">Escribir por WhatsApp</a></section>';
    activar(fotos);
  }

  function activar(fotos) {
    if (!fotos.length) return;
    const G = fotos.map(f => ({ src: f.url, alt: f.alt || '' }));
    let cur = 0, lista = G, lbOpen = false;
    const mainimg = document.getElementById('mainimg'), counter = document.getElementById('counter');
    const thumbs = document.querySelectorAll('.thumb');
    const lb = document.getElementById('lb'), lbimg = document.getElementById('lbimg');
    function show(i) {
      cur = (i + G.length) % G.length;
      mainimg.src = G[cur].src; mainimg.alt = G[cur].alt;
      counter.textContent = (cur + 1) + ' / ' + G.length;
      thumbs.forEach((t, k) => t.classList.toggle('border-rojo', k === cur));
    }
    thumbs.forEach(t => t.addEventListener('click', () => show(+t.dataset.i)));
    function openLb(l, i) { lista = l; cur = i; lbOpen = true; lbimg.src = lista[cur].src; lb.classList.remove('hidden'); lb.classList.add('flex'); }
    function stepLb(d) { cur = (cur + d + lista.length) % lista.length; lbimg.src = lista[cur].src; }
    function closeLb() { lbOpen = false; lb.classList.add('hidden'); lb.classList.remove('flex'); }
    document.getElementById('main').addEventListener('click', () => openLb(G, cur));
    document.getElementById('lbclose').addEventListener('click', closeLb);
    document.getElementById('lbprev').addEventListener('click', () => stepLb(-1));
    document.getElementById('lbnext').addEventListener('click', () => stepLb(1));
    lb.addEventListener('click', ev => { if (ev.target === lb) closeLb(); });
    document.addEventListener('keydown', ev => {
      if (!lbOpen) return;
      if (ev.key === 'Escape') closeLb();
      if (ev.key === 'ArrowLeft') stepLb(-1);
      if (ev.key === 'ArrowRight') stepLb(1);
    });
    show(0);
  }
})();
