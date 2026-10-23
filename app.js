// Página principal: filtros y lectura de inmuebles desde Supabase.
// Las fichas 101-121 son estáticas; desde el panel se pueden ocultar o marcar como vendidas.
// Los inmuebles nuevos creados en el panel se agregan aquí como tarjetas.
// Zoom de las fotos de servicios (galería de casas prefabricadas)
(function () {
  const lb = document.getElementById('lbs'), im = document.getElementById('lbs-img');
  if (!lb) return;
  const cerrar = () => { lb.classList.add('hidden'); lb.classList.remove('flex'); };
  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-zoom]');
    if (b) { im.src = b.dataset.zoom; im.alt = b.dataset.alt || ''; lb.classList.remove('hidden'); lb.classList.add('flex'); }
    else if (ev.target === lb || ev.target.id === 'lbs-x') cerrar();
  });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') cerrar(); });
})();

(function () {
  const grid = document.getElementById('grid');
  const tabsBox = document.getElementById('tabs');
  if (!grid || !tabsBox) return;

  const CAT = { proyecto: 'Proyectos', lote: 'Lotes', casa: 'Casas', apartamento: 'Apartamentos', finca: 'Fincas' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let filtro = 'todos';

  function aplicar() {
    grid.querySelectorAll('article').forEach(c => {
      const ok = (filtro === 'todos' || c.dataset.t === filtro) && !c.dataset.oculto;
      c.style.display = ok ? '' : 'none';
    });
  }

  tabsBox.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    tabsBox.querySelectorAll('button').forEach(x => x.classList.remove('tab-on'));
    b.classList.add('tab-on');
    filtro = b.dataset.f;
    aplicar();
  });

  function agregarTab(cat) {
    if (tabsBox.querySelector('[data-f="' + cat + '"]')) return;
    const b = document.createElement('button');
    b.dataset.f = cat;
    b.className = 'rounded-lg px-4 py-2 bg-cielo text-vino';
    b.textContent = CAT[cat] || cat;
    tabsBox.appendChild(b);
  }

  function insignia(card, texto) {
    const media = card.querySelector('div.relative');
    if (!media || media.querySelector('.estado-badge')) return;
    const s = document.createElement('span');
    s.className = 'estado-badge absolute inset-x-0 bottom-0 bg-vino/90 text-white text-center text-sm font-bold py-2 tracking-wide';
    s.textContent = texto;
    media.appendChild(s);
  }

  function tarjeta(r) {
    const d = r.datos || {};
    const foto = (d.fotos && d.fotos[0] && d.fotos[0].url) || '';
    const media = foto
      ? '<div class="h-52 relative"><img src="' + esc(foto) + '" alt="' + esc(r.titulo) + '" loading="lazy" class="w-full h-full object-cover">'
      : '<div class="ph1 h-52 relative">';
    const chips = (d.chips || []).slice(0, 4).map(c => '<span>' + esc(c) + '</span>').join('');
    const nota = d.precio_nota ? '<p class="text-sm text-tinta/60">' + esc(d.precio_nota) + '</p>' : '';
    const a = document.createElement('article');
    a.dataset.t = r.categoria;
    a.dataset.cod = r.codigo;
    a.className = 'card bg-white rounded-2xl overflow-hidden border border-black/10 flex flex-col';
    a.innerHTML = media +
      '<span class="absolute top-3 left-3 bg-vino text-white text-xs font-semibold px-3 py-1 rounded-md">' + esc(String(r.negocio).toUpperCase()) + '</span>' +
      '<span class="absolute top-3 right-3 bg-white/95 text-vino text-xs font-bold px-2.5 py-1 rounded-md">Cód. ' + esc(r.codigo) + '</span></div>' +
      '<div class="p-6 flex flex-col flex-1">' +
      '<p class="text-xs font-semibold text-rojo uppercase">' + esc(d.ubicacion_corta) + '</p>' +
      '<h3 class="font-display font-bold text-xl mt-1 text-vino">' + esc(r.titulo) + '</h3>' +
      '<p class="font-display font-extrabold text-2xl mt-3">' + esc(d.precio_texto) + '</p>' + nota +
      '<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-tinta/70">' + chips + '</div>' +
      '<p class="mt-3 text-sm text-tinta/65">' + esc(d.resumen) + '</p>' +
      '<a href="ficha.html?c=' + esc(r.codigo) + '" class="mt-auto pt-5"><span class="block text-center rounded-lg border border-rojo text-rojo font-semibold py-2.5 hover:bg-rojo hover:text-white transition">Ver detalles</span></a>' +
      '</div>';
    return a;
  }

  const C = window.AYD_SUPABASE;
  if (!C) return;
  const H = { apikey: C.key, Authorization: 'Bearer ' + C.key };
  const q = C.url + '/rest/v1/inmuebles?select=codigo,estado,titulo,categoria,negocio,origen,datos&publicado=eq.true&order=codigo.asc';
  Promise.all([
    fetch(q, { headers: H }).then(r => r.ok ? r.json() : []),
    fetch(C.url + '/rest/v1/rpc/codigos_ocultos', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, H), body: '{}' }).then(r => r.ok ? r.json() : [])
  ]).then(([filas, ocultos]) => {
    (ocultos || []).forEach(cod => {
      const c = grid.querySelector('[data-cod="' + cod + '"]');
      if (c) { c.dataset.oculto = '1'; }
    });
    (filas || []).forEach(r => {
      if (r.origen === 'panel') {
        if (grid.querySelector('[data-cod="' + r.codigo + '"]')) return;
        agregarTab(r.categoria);
        const c = tarjeta(r);
        grid.appendChild(c);
        if (r.estado === 'Vendido' || r.estado === 'Reservado') insignia(c, r.estado.toUpperCase());
      } else {
        const c = grid.querySelector('[data-cod="' + r.codigo + '"]');
        if (c && (r.estado === 'Vendido' || r.estado === 'Reservado')) insignia(c, r.estado.toUpperCase());
      }
    });
    aplicar();
  }).catch(() => { /* si Supabase no responde, queda la versión estática */ });
})();
