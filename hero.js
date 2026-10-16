// Carrusel de videos de la portada. Los slides los genera build.py desde data/inmuebles.json.
(function () {
  const root = document.getElementById('hero');
  if (!root) return;
  const slides = Array.from(root.querySelectorAll('.hslide'));
  if (!slides.length) return;
  const dotsBox = document.getElementById('hdots');
  const pauseBtn = document.getElementById('hpause');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = 0;
  let paused = reduce;
  let timer = null;
  let visible = true;

  const dots = slides.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Ver proyecto ' + (i + 1));
    b.className = 'h-2 w-2 rounded-full bg-white/50 transition-all';
    b.addEventListener('click', () => go(i));
    dotsBox.appendChild(b);
    return b;
  });

  function video(s) { return s.querySelector('video'); }

  function load(s, preload) {
    const v = video(s);
    if (!v.getAttribute('src') && s.dataset.src) v.src = s.dataset.src;
    v.preload = preload;
    return v;
  }

  function stopTimer() { clearTimeout(timer); timer = null; }

  function armTimer(s) {
    stopTimer();
    const start = +s.dataset.start || 0;
    const end = +s.dataset.end || 0;
    const seconds = (end ? end - start : 15) + 4; // seguro por si el video no avanza
    timer = setTimeout(next, seconds * 1000);
  }

  function next() { if (slides.length > 1) go(cur + 1); else restart(slides[cur]); }

  function restart(s) {
    const v = video(s);
    v.currentTime = +s.dataset.start || 0;
    if (!paused && visible) v.play().catch(() => {});
    armTimer(s);
  }

  function go(i) {
    stopTimer();
    video(slides[cur]).pause();
    slides[cur].classList.remove('is-active');
    cur = (i + slides.length) % slides.length;
    const s = slides[cur];
    s.classList.add('is-active');
    dots.forEach((d, k) => { d.className = 'h-2 rounded-full bg-white/50 transition-all ' + (k === cur ? 'w-6 !bg-white' : 'w-2'); });
    const v = load(s, 'auto');
    const start = +s.dataset.start || 0;
    const end = +s.dataset.end || 0;
    const seek = () => { try { v.currentTime = start; } catch (e) { /* aún sin metadatos */ } };
    if (v.readyState > 0) seek(); else v.addEventListener('loadedmetadata', seek, { once: true });
    v.ontimeupdate = () => { if (end && v.currentTime >= end) next(); };
    v.onended = next;
    if (!paused && visible) { v.play().catch(() => {}); armTimer(s); }
    if (slides.length > 1) load(slides[(cur + 1) % slides.length], 'metadata'); // adelanta solo los metadatos
  }

  function setPaused(p) {
    paused = p;
    pauseBtn.textContent = p ? '▶' : '❚❚';
    pauseBtn.setAttribute('aria-label', p ? 'Reproducir' : 'Pausar');
    const s = slides[cur];
    if (p) { video(s).pause(); stopTimer(); } else { video(s).play().catch(() => {}); armTimer(s); }
  }

  pauseBtn.addEventListener('click', () => setPaused(!paused));
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (!paused) { if (visible) { video(slides[cur]).play().catch(() => {}); armTimer(slides[cur]); } else { video(slides[cur]).pause(); stopTimer(); } }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting && !document.hidden;
      if (!paused) { if (visible) { video(slides[cur]).play().catch(() => {}); armTimer(slides[cur]); } else { video(slides[cur]).pause(); stopTimer(); } }
    }, { threshold: 0.25 }).observe(root);
  }

  if (slides.length < 2) dotsBox.style.display = 'none';
  setPaused(paused);
  go(0);
})();
