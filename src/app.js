'use strict';
(() => {
  const data = JSON.parse(document.getElementById('map-data').textContent);
  const districts = data.districts.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const byId = new Map(districts.map(d => [d.id, d]));
  const $ = id => document.getElementById(id);
  const map = $('map');
  const canvas = $('canvas');
  const locateButton = $('locate');
  const locationMessage = $('location-message');
  const userPosition = $('user-position');
  const search = $('search');
  const okrug = $('okrug');
  const emptyMarkup = $('selection').innerHTML;
  const statuses = {
    urgent: { label: 'Высокая потребность', color: '#de8276' },
    needed: { label: 'Повышенная потребность', color: '#e8cf98' },
    enough: { label: 'Крови достаточно', color: '#a5cbb4' },
    unknown: { label: 'Нет данных', color: '#dce2d8' },
  };
  let selectedId = null;
  let view = 'city';
  let box = [0, 0, 1000, 850];
  let baseBox = box.slice();
  let gesture = null;
  let suppressClick = false;
  const paths = new Map(districts.map(d => [d.id, $(`region-${d.id}`)]));
  const normalize = value => value.toLowerCase().replaceAll('ё', 'е').replace(/[\s-]+/g, ' ').trim();
  const visible = d => (view === 'all' || d.zone === view) && (!okrug.value || d.okrug === okrug.value);
  const element = (tag, className, content) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content !== undefined) el.textContent = content;
    return el;
  };
  const groups = [...new Map(districts.map(d => [d.okrug, d.okrugName])).entries()];
  groups.sort((a, b) => a[0].localeCompare(b[0], 'ru')).forEach(([code, name]) => {
    const option = element('option', '', code);
    option.value = code;
    option.title = name;
    okrug.append(option);
  });

  function bounds(items) {
    return [Math.min(...items.map(d => d.bounds[0])), Math.min(...items.map(d => d.bounds[1])),
      Math.max(...items.map(d => d.bounds[2])), Math.max(...items.map(d => d.bounds[3]))];
  }
  function setBox(next) {
    box = next;
    map.setAttribute('viewBox', box.join(' '));
  }
  function fit(items) {
    if (!items.length) return;
    const [left, top, right, bottom] = bounds(items);
    const width = Math.max(right - left, 30);
    const height = Math.max(bottom - top, 30);
    const ratio = (canvas.clientWidth || 750) / (canvas.clientHeight || 500);
    const h = Math.max(height * 1.28, width * 1.2 / ratio);
    const w = h * ratio;
    setBox([(left + right - w) / 2, (top + bottom - h) / 2 - h * .025, w, h]);
  }
  function resetView() {
    fit(districts.filter(visible));
    baseBox = box.slice();
  }
  function updatePaths() {
    districts.forEach(d => {
      const path = paths.get(d.id);
      path.style.fill = statuses[d.status].color;
      path.style.display = view === 'all' || d.zone === view ? '' : 'none';
      const active = visible(d);
      path.classList.toggle('dimmed', !active);
      path.classList.toggle('selected', d.id === selectedId);
      path.setAttribute('aria-pressed', String(d.id === selectedId));
      path.setAttribute('aria-label', `${d.name}, ${d.okrug}. Демо: ${statuses[d.status].label}`);
      path.setAttribute('tabindex', active ? '0' : '-1');
      path.setAttribute('aria-hidden', String(!active));
      path.style.pointerEvents = active ? '' : 'none';
    });
    if (selectedId) $('regions').append(paths.get(selectedId));
    const count = districts.filter(visible).length;
    $('map-count').textContent = `${count} из 132 районов · ${okrug.value || '12 округов'}`;
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  }
  function renderList() {
    const query = normalize(search.value);
    const items = districts.filter(d => (!okrug.value || d.okrug === okrug.value)
      && (query ? normalize(d.name).includes(query) : view === 'all' || d.zone === view));
    const list = $('district-list');
    list.replaceChildren();
    $('list-label').textContent = query ? 'Результаты поиска' : 'Районы на карте';
    $('list-count').textContent = String(items.length);
    items.forEach(d => {
      const button = element('button', 'district-item');
      button.type = 'button';
      button.dataset.id = d.id;
      button.setAttribute('aria-pressed', String(d.id === selectedId));
      button.append(element('i', `dot ${d.status}`), element('span', '', d.name), element('span', 'item-okrug', d.okrug));
      list.append(button);
    });
    if (!items.length) list.append(element('p', 'no-results', 'Район не найден. Проверьте название или выберите «Все округа».'));
  }
  function renderCard() {
    const container = $('selection');
    if (!selectedId) {
      container.innerHTML = emptyMarkup;
      return;
    }
    const d = byId.get(selectedId);
    const card = element('div', 'selected-card');
    const top = element('div', 'card-top');
    const close = element('button', 'clear-selection', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Снять выбор района');
    close.addEventListener('click', () => { clearSelection(); search.focus(); });
    top.append(element('span', '', `РАЙОН МОСКВЫ · ${d.okrug}`), close);
    const status = element('p', 'status-line');
    status.append(element('i', `dot ${d.status}`), element('span', '', statuses[d.status].label));
    const options = element('div', 'color-options');
    options.setAttribute('role', 'group');
    options.setAttribute('aria-label', 'Демонстрационный цвет района');
    Object.entries(statuses).forEach(([key, value]) => {
      const button = element('button', `color-option ${key}`, key === d.status ? '✓' : '');
      button.type = 'button';
      button.title = value.label;
      button.setAttribute('aria-label', `Демо: ${value.label}`);
      button.setAttribute('aria-pressed', String(key === d.status));
      button.addEventListener('click', () => {
        d.status = key;
        updatePaths();
        renderList();
        renderCard();
        $('selection').querySelector(`.${key}.color-option`).focus();
      });
      options.append(button);
    });
    card.append(top, element('h3', '', d.name), element('p', 'okrug-name', d.okrugName), status,
      element('p', 'demo-caption', 'Пример статуса · не реальные медицинские данные'),
      element('div', 'color-caption', 'Попробуйте изменить цвет района'), options);
    container.replaceChildren(card);
  }
  function clearSelection() {
    selectedId = null;
    updatePaths(); renderCard(); renderList();
  }
  function selectDistrict(id, focusMap = false) {
    const d = byId.get(id);
    if (!d) return;
    selectedId = id;
    if (view !== 'all' && d.zone !== view) view = d.zone;
    updatePaths(); renderCard(); renderList();
    if (focusMap) {
      resetView();
      // Keep enough context to recognize the selected neighbourhood.
      const [x1, y1, x2, y2] = d.bounds;
      const w = Math.max(baseBox[2] * .32, (x2 - x1) * 1.6, (y2 - y1) * 1.6 * baseBox[2] / baseBox[3]);
      const h = w * baseBox[3] / baseBox[2];
      setBox([(x1 + x2 - w) / 2, (y1 + y2 - h) / 2, w, h]);
    }
  }
  // The browser reports WGS84 longitude/latitude. Use the same original rings
  // from OSM as the SVG, including detached areas and inner holes.
  function pointInRing(lon, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a[1] > lat) !== (b[1] > lat)
          && lon < (b[0] - a[0]) * (lat - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }
  function districtAt(lon, lat) {
    return districts.find(d => d.polygons.some(polygon =>
      pointInRing(lon, lat, polygon[0])
      && !polygon.slice(1).some(hole => pointInRing(lon, lat, hole))));
  }
  function showLocationMessage(message, error = false) {
    locationMessage.textContent = message;
    locationMessage.classList.toggle('error', error);
    locationMessage.hidden = false;
  }
  locateButton.addEventListener('click', () => {
    if (locateButton.disabled) return;
    if (!window.isSecureContext || !navigator.geolocation) {
      showLocationMessage('Геолокация недоступна. Откройте карту через http://localhost:4173 или HTTPS.', true);
      return;
    }
    locateButton.disabled = true;
    locateButton.textContent = 'Определяем местоположение…';
    userPosition.hidden = true;
    showLocationMessage('Разрешите браузеру доступ к местоположению. Это может занять несколько секунд.');
    navigator.geolocation.getCurrentPosition(position => {
      locateButton.disabled = false;
      locateButton.innerHTML = '<span aria-hidden="true">⌖</span> Определить мой район';
      const { longitude: lon, latitude: lat, accuracy } = position.coords;
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        showLocationMessage('Браузер вернул некорректные координаты.', true);
        return;
      }
      const d = districtAt(lon, lat);
      if (!d) {
        userPosition.hidden = true;
        showLocationMessage(`Координаты ${lat.toFixed(5)}, ${lon.toFixed(5)} — за пределами районов Москвы на этой карте.`, true);
        return;
      }
      okrug.value = '';
      search.value = '';
      selectDistrict(d.id);
      resetView();
      // Same projection as scripts/build.py. 1500 map units per latitude degree.
      const x = (lon - 36.5) * Math.cos(55.7 * Math.PI / 180) * 1500;
      const y = (56.1 - lat) * 1500;
      userPosition.setAttribute('transform', `translate(${x} ${y})`);
      $('position-accuracy').setAttribute('r', Number.isFinite(accuracy) ? Math.max(0, accuracy * 1500 / 111000) : 0);
      userPosition.hidden = false;
      const width = Math.max(baseBox[2] * .35, d.bounds[2] - d.bounds[0],
        (d.bounds[3] - d.bounds[1]) * baseBox[2] / baseBox[3]);
      const height = width * baseBox[3] / baseBox[2];
      setBox([x - width / 2, y - height / 2, width, height]);
      const accuracyText = Number.isFinite(accuracy) ? ` Точность браузера: около ${Math.round(accuracy)} м.` : '';
      showLocationMessage(`Примерно ваш район: ${d.name} (${d.okrug}). Координаты: ${lat.toFixed(5)}, ${lon.toFixed(5)}.${accuracyText} Если вы у границы района, результат может быть неточным.`);
    }, error => {
      locateButton.disabled = false;
      locateButton.innerHTML = '<span aria-hidden="true">⌖</span> Определить мой район';
      const message = error.code === 1 ? 'Доступ к геолокации запрещён. Разрешите его в настройках браузера и попробуйте снова.'
        : error.code === 3 ? 'Браузер не успел определить координаты. Попробуйте ещё раз.'
          : 'Не удалось получить координаты. Проверьте службы геолокации и попробуйте ещё раз.';
      showLocationMessage(message, true);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
  $('district-list').addEventListener('click', event => {
    const button = event.target.closest('[data-id]');
    if (button) {
      selectDistrict(button.dataset.id, true);
      // The list is re-rendered on selection; preserve keyboard focus.
      $('district-list').querySelector(`[data-id="${button.dataset.id}"]`)?.focus({ preventScroll: true });
    }
  });
  search.addEventListener('input', renderList);
  search.addEventListener('keydown', event => {
    if (event.key === 'Enter') $('district-list').querySelector('button')?.click();
  });
  okrug.addEventListener('change', () => {
    if (okrug.value) view = districts.find(d => d.okrug === okrug.value).zone;
    if (selectedId && !visible(byId.get(selectedId))) selectedId = null;
    updatePaths(); renderList(); renderCard(); resetView();
  });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    view = button.dataset.view;
    okrug.value = '';
    search.value = '';
    if (selectedId && !visible(byId.get(selectedId))) selectedId = null;
    updatePaths(); renderList(); renderCard(); resetView();
  }));
  map.addEventListener('click', event => {
    if (suppressClick) return;
    const path = event.target.closest('[data-id]');
    if (path) selectDistrict(path.dataset.id);
  });
  map.addEventListener('keydown', event => {
    const path = event.target.closest('[data-id]');
    if (path && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); selectDistrict(path.dataset.id);
    }
  });
  function hideTooltip() { $('tooltip').hidden = true; }
  map.addEventListener('pointermove', event => {
    if (gesture) return;
    const path = event.target.closest('[data-id]');
    if (!path) { hideTooltip(); return; }
    const d = byId.get(path.dataset.id);
    const tooltip = $('tooltip');
    tooltip.textContent = `${d.name} · ${d.okrug}`;
    tooltip.hidden = false;
    const rect = canvas.getBoundingClientRect();
    tooltip.style.left = `${Math.max(8, Math.min(event.clientX - rect.left + 14, rect.width - tooltip.offsetWidth - 8))}px`;
    tooltip.style.top = `${Math.max(65, Math.min(event.clientY - rect.top - 40, rect.height - 35))}px`;
  });
  map.addEventListener('pointerleave', hideTooltip);
  function point(event) {
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(map.getScreenCTM().inverse());
  }
  function zoom(factor, anchor = { x: box[0] + box[2] / 2, y: box[1] + box[3] / 2 }) {
    const width = Math.max(baseBox[2] / 12, Math.min(baseBox[2] * 1.5, box[2] * factor));
    const scale = width / box[2];
    setBox([anchor.x - (anchor.x - box[0]) * scale, anchor.y - (anchor.y - box[1]) * scale, width, box[3] * scale]);
    hideTooltip();
  }
  $('zoom-in').addEventListener('click', () => zoom(.75));
  $('zoom-out').addEventListener('click', () => zoom(1 / .75));
  $('reset-view').addEventListener('click', resetView);
  map.addEventListener('wheel', event => {
    event.preventDefault();
    zoom(event.deltaY < 0 ? .9 : 1 / .9, point(event));
  }, { passive: false });
  map.addEventListener('pointerdown', event => {
    if (event.button !== 0 || gesture) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, box: box.slice(), moved: false };
    suppressClick = false;
  });
  map.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (Math.hypot(dx, dy) > 5) {
      if (!gesture.moved) map.setPointerCapture(event.pointerId);
      gesture.moved = true;
      map.classList.add('dragging');
      hideTooltip();
      const rect = map.getBoundingClientRect();
      const scale = Math.max(gesture.box[2] / rect.width, gesture.box[3] / rect.height);
      setBox([gesture.box[0] - dx * scale, gesture.box[1] - dy * scale, gesture.box[2], gesture.box[3]]);
    }
  });
  function endGesture(event) {
    if (!gesture || gesture.id !== event.pointerId) return;
    suppressClick = gesture.moved;
    gesture = null;
    map.classList.remove('dragging');
    if (map.hasPointerCapture(event.pointerId)) map.releasePointerCapture(event.pointerId);
  }
  window.addEventListener('pointerup', endGesture);
  window.addEventListener('pointercancel', endGesture);
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      event.preventDefault(); search.focus();
    }
    if (event.key === 'Escape') { search.value = ''; clearSelection(); hideTooltip(); }
  });
  $('about-button').addEventListener('click', () => {
    const expanded = $('about').hidden;
    $('about').hidden = !expanded;
    $('about-button').setAttribute('aria-expanded', String(expanded));
  });
  $('reset-colors').addEventListener('click', () => {
    districts.forEach(d => { d.status = d.initialStatus; });
    updatePaths(); renderCard(); renderList();
  });
  districts.forEach(d => { d.initialStatus = d.status; });
  let resizeFrame;
  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resetView);
  }).observe(canvas);
  updatePaths(); renderList(); resetView();
})();
