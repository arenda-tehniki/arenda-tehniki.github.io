// Аренда спецтехники: каталог, предварительный расчёт и готовая заявка в мессенджер владельца.
// Данные компании лежат на странице в <script id="company"> — их готовит scripts/build.mjs из companies/<адрес>/company.json.
;(() => {
  'use strict'

  const C = JSON.parse(document.getElementById('company').textContent)
  const ASSETS = document.documentElement.dataset.assets
  const KEY = `spectech:${C.slug}:v1`
  const app = document.getElementById('app')
  const SAMPLE = C.status !== 'live'

  const STATUS = { free: 'Свободна', busy: 'Занята', confirm: 'Требует подтверждения' }
  // Образец с настоящими данными компании (facts): на странице только то, что есть в её карточке и на её сайте.
  const FACTS = Boolean(C.facts)
  const RANGE = C.rangePct ?? (FACTS ? 0 : 15) // на сколько процентов верхняя граница выше расчёта

  // ---------- данные: настройки из файла + правки владельца, сохранённые в этом браузере ----------

  function readSaved() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {}
    } catch {
      return {}
    }
  }
  let saved = readSaved()

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(saved))
    } catch {
      // частный режим браузера: правки живут до закрытия страницы
    }
  }

  const fleet = () => C.fleet.map((m) => ({ ...m, ...(saved.fleet?.[m.id] || {}) }))
  const zones = () => C.zones.map((z) => ({ ...z, ...(saved.zones?.[z.id] || {}) }))
  const contact = () => ({ telegram: C.telegram || '', whatsapp: C.whatsapp || '', ...(saved.contact || {}) })

  // ---------- мелочи ----------

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const money = (n) => `${Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' ')} ₽`
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100
    const b = a % 10
    return a > 10 && a < 20 ? many : b === 1 ? one : b > 1 && b < 5 ? few : many
  }
  const hoursText = (n) => `${n} ${plural(n, 'час', 'часа', 'часов')}`
  const photo = (m) => (m.photo ? m.photo : m.type ? `${ASSETS}/photos/${m.type}.webp` : '')
  const picture = (m, attrs) => (photo(m) ? `<img src="${esc(photo(m))}" alt="${esc(m.name)}" ${attrs} />` : `<span class="nopic">${I.truck}</span>`)
  const rateText = (m) => (m.rate ? `${m.rateFrom ? 'от ' : ''}${money(m.rate)}` : '')
  const pad = (n) => String(n).padStart(2, '0')
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const ruDate = (iso) => iso.split('-').reverse().join('.')

  const I = {
    truck: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 17V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1"/><path d="M14 9h4l4 4v3a1 1 0 0 1-1 1h-1"/><path d="M9 17h6"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
    pin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    cal: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3 10 14"/><path d="m21 3-7 19-4-8-8-4 19-7Z"/></svg>',
    calc: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>',
    note: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4Z"/><path d="M8 9h8M8 12h5"/></svg>',
    down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    timer: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>',
    helmet: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18M5 18v-3a7 7 0 0 1 14 0v3M10 8V5h4v3"/></svg>',
    rub: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 20V4h5.5a4.5 4.5 0 0 1 0 9H6M6 17h8"/></svg>',
  }

  // ---------- куда уходит заявка ----------

  /** Мессенджер владельца: Telegram, если указан, иначе WhatsApp; у образца без контактов — окно «поделиться» Telegram. */
  function channels() {
    const list = []
    const { telegram, whatsapp } = contact()
    const tg = telegram.trim().replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '')
    if (tg) {
      const phone = /^\+?[\d\s()-]{10,}$/.test(tg)
      // Чат открывается сразу в приложении Telegram: сайт t.me отвечает ошибкой, когда в адресе длинный текст заявки.
      const address = phone ? 'phone=' + tg.replace(/\D/g, '') : 'domain=' + encodeURIComponent(tg)
      list.push({ kind: 'telegram', label: 'Telegram', handle: phone ? '' : '@' + tg, link: (text) => `tg://resolve?${address}&text=${encodeURIComponent(text)}` })
    }
    const wa = whatsapp.replace(/\D/g, '')
    if (wa) list.push({ kind: 'whatsapp', label: 'WhatsApp', handle: '', link: (text) => `https://wa.me/${wa}?text=${encodeURIComponent(text)}` })
    if (list.length) return list
    return [{
      kind: 'share',
      label: 'Telegram',
      handle: '',
      link: (text) => `tg://msg_url?url=${encodeURIComponent(location.origin + location.pathname)}&text=${encodeURIComponent(text)}`,
    }]
  }
  const channel = () => channels()[0]

  /**
   * Открывает чат. На телефоне и во встроенных браузерах мессенджеров новое окно часто не открывается совсем,
   * поэтому там переходим в этой же вкладке; на компьютере — в новой, а если её заблокировали, то в этой.
   */
  function go(link) {
    const phone = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    if (phone || link.startsWith('tg:')) {
      location.href = link
      return
    }
    const win = window.open(link, '_blank')
    if (win) win.opener = null
    else location.href = link
  }

  // ---------- заявка клиента ----------

  const tomorrow = new Date(Date.now() + 864e5)
  const order = { machine: '', address: '', date: isoDate(tomorrow), time: '09:00', hours: '', zone: C.zones[0]?.id ?? '', comment: '', photos: false }

  /** «17 200 ₽ – 19 800 ₽», «от 16 000 ₽» или пусто, когда цены у техники нет. */
  function totalText(q) {
    if (q.low == null) return ''
    if (q.high > q.low) return `${money(q.low)} – ${money(q.high)}`
    return `${q.m.rateFrom || !q.z ? 'от ' : ''}${money(q.low)}`
  }
  let touched = false // показывать ли незаполненные поля красным

  function quote() {
    const m = fleet().find((x) => x.id === order.machine)
    const z = zones().find((x) => x.id === order.zone) || zones()[0] || null
    if (!m) return { m: null, z }
    const asked = Math.round(Number(order.hours)) > 0 ? Math.round(Number(order.hours)) : m.minHours || 0
    const billed = Math.max(asked, m.minHours || 0)
    if (!m.rate || !billed) return { m, z, asked, billed, rent: null, low: null, high: null }
    const rent = billed * m.rate
    const low = rent + (z ? z.price : 0)
    const high = RANGE ? Math.ceil((low * (1 + RANGE / 100)) / 100) * 100 : low
    return { m, z, asked, billed, rent, low, high }
  }

  function problems() {
    const q = quote()
    const out = {}
    if (!q.m) out.machine = 'Выберите технику'
    else if (q.m.status === 'busy') out.machine = 'Эта техника сейчас занята — выберите другую'
    if (order.address.trim().length < 4) out.address = 'Укажите адрес объекта'
    if (!order.date) out.date = 'Укажите дату'
    return out
  }

  function message() {
    const q = quote()
    const lines = [
      `Здравствуйте! Заявка на технику с сайта «${C.name}».`,
      '',
      `Техника: ${q.m.name}`,
      `Адрес объекта: ${order.address.trim()}`,
      `Дата и время подачи: ${ruDate(order.date)}, ${order.time || 'время уточню'}`,
      `Продолжительность: ${q.asked ? hoursText(q.asked) : 'уточню'}${q.billed > q.asked && q.asked ? ` (минимальная смена — ${hoursText(q.billed)})` : ''}`,
    ]
    if (q.z) lines.push(`Доставка: ${q.z.name}`)
    if (q.low != null) lines.push(`Предварительная стоимость: ${totalText(q)}${q.z ? '' : ' без доставки'}`)
    if (q.m.status === 'confirm') lines.push('Наличие техники нужно подтвердить.')
    if (order.comment.trim()) lines.push(`Комментарий: ${order.comment.trim()}`)
    if (order.photos) lines.push('Фото объекта пришлю следующим сообщением.')
    return lines.join('\n').replace(/ /g, ' ')
  }

  // ---------- страница клиента ----------

  function cardHtml(m) {
    const on = m.id === order.machine
    const button =
      m.status === 'busy'
        ? '<button class="btn wide" disabled>Сейчас занята</button>'
        : on
          ? `<button class="btn wide dark" data-pick="${esc(m.id)}">Техника выбрана ${I.check}</button>`
          : `<button class="btn wide" data-pick="${esc(m.id)}">Выбрать ${I.check}</button>`
    return `<article class="card ${on ? 'on' : ''} ${m.status === 'busy' ? 'busy' : ''}">
      <div class="pic">${picture(m, 'loading="lazy" width="720" height="480"')}${on ? `<span class="picked">${I.check} Выбрано</span>` : ''}${FACTS && !m.photo && m.type ? '<span class="stock">Фото для примера</span>' : ''}</div>
      <div class="body">
        <div class="title"><h3>${esc(m.name)}</h3><span class="badge ${m.status}">${STATUS[m.status]}</span></div>
        ${m.purpose ? `<p class="purpose">${esc(m.purpose)}</p>` : ''}
        <p class="price">${m.rate ? `<b>${rateText(m)}</b><span>/час</span>` : '<b class="ask">Цена по запросу</b>'}${m.minHours ? `<span>· мин. смена — ${hoursText(m.minHours)}</span>` : ''}</p>
        ${button}
      </div>
    </article>`
  }

  function sumHtml() {
    const q = quote()
    const ch = channel()
    if (!q.m) {
      return `<div class="cap"><i>${I.calc}</i><div><small>Расчёт заказа</small><b>Предварительная стоимость</b></div></div>
        <p class="fine" style="margin-top:18px;font-size:15px">Выберите технику в каталоге — здесь появится расчёт аренды и доставки.</p>
        <a class="btn wide" href="#fleet">К каталогу ${I.down}</a>`
    }
    return `<div class="cap"><i>${I.calc}</i><div><small>Расчёт заказа</small><b>Предварительная стоимость</b></div></div>
      <dl>
        <div><dt>Техника</dt><dd>${esc(q.m.name)}</dd></div>
        <div><dt>Продолжительность</dt><dd>${q.asked ? hoursText(q.asked) : 'не указана'}${q.billed > q.asked && q.asked ? `<small>К расчёту: ${hoursText(q.billed)}</small>` : ''}</dd></div>
        ${q.rent != null ? `<div><dt>Аренда${q.m.rateFrom ? ', от' : ''}</dt><dd>${money(q.rent)}</dd></div>` : ''}
        <div><dt>Доставка${q.z ? ': ' + esc(q.z.name.toLowerCase()) : ''}</dt><dd>${q.z ? money(q.z.price) : 'уточнит диспетчер'}</dd></div>
      </dl>
      ${
        q.low != null
          ? `<div class="total"><span>Ориентировочно${q.z ? '' : ', без доставки'}</span><b>${totalText(q)}</b></div>
      <p class="fine">Это не итоговая цена: точную сумму назовём после проверки адреса и условий подъезда.</p>`
          : `<div class="total"><span>Стоимость</span><b class="ask">${q.m.rate ? 'Укажите часы' : 'По запросу'}</b></div>
      <p class="fine">${q.m.rate ? 'Введите количество часов — посчитаем аренду.' : 'Цену на эту технику назовёт диспетчер — в заявке уже будут все детали.'}</p>`
      }
      <button class="btn wide" data-send="0">${I.send} Отправить заявку в ${ch.label}</button>
      ${channels()
        .slice(1)
        .map((other, i) => `<button class="btn wide onDark" data-send="${i + 1}">${I.send} Отправить в ${other.label}</button>`)
        .join('')}
      <div class="alt"><button data-copy>Скопировать заявку</button>${C.phone ? `<a href="tel:${esc(C.phone.replace(/[^\d+]/g, ''))}">Позвонить</a>` : ''}</div>`
  }

  function barHtml() {
    const q = quote()
    const ch = channel()
    if (!q.m) return `<div><small>Аренда спецтехники</small><b>Выберите технику</b></div><a class="btn small" href="#fleet">Каталог</a>`
    return `<div><small>${esc(q.m.name)}${q.billed ? ' · ' + hoursText(q.billed) : ''}</small><b>${q.low != null ? 'от ' + money(q.low) : q.m.rate ? rateText(q.m) + '/час' : 'Цена по запросу'}</b></div><button class="btn small" data-send>${I.send} В ${ch.label}</button>`
  }

  function noticeHtml() {
    const q = quote()
    const bad = touched ? problems() : {}
    let html = ''
    if (bad.machine) html += `<p class="err">${bad.machine}</p>`
    if (q.m && q.asked && q.billed > q.asked) {
      html += `<div class="note">${I.info}<span><b>Минимальная смена для этой техники — ${hoursText(q.m.minHours)}.</b> Расчёт выполнен с учётом минимальной смены.</span></div>`
    }
    if (q.m && q.m.status === 'confirm') {
      html += `<div class="note">${I.info}<span><b>Наличие нужно подтвердить.</b> Диспетчер ответит, свободна ли машина на вашу дату.</span></div>`
    }
    return html
  }

  function clientHtml() {
    const list = fleet()
    const ch = channel()
    const zs = zones()
    const write = ch.kind === 'share' ? '#calc' : ch.link(`Здравствуйте! Пишу с сайта «${C.name}».`)
    return `
    ${SAMPLE ? `<div class="sample"><div class="wrap"><b>Образец для «${esc(C.name)}».</b> ${FACTS ? esc(C.sampleNote || 'Техника и контакты взяты из открытых источников — поправим по вашему слову.') : 'Цены и список техники примерные — заменим на ваши.'}</div></div>` : ''}
    <header class="top"><div class="wrap">
      <a class="brand" href="#top"><span class="tile">${C.logo ? `<img src="${esc(C.logo)}" alt="" />` : I.truck}</span><span><b>${esc(C.name)}</b><small>${esc(C.tagline)}</small></span></a>
      <div class="meta"><span>${I.pin}${esc(C.city)}</span>${C.hours ? `<span><i class="dot"></i>${esc(C.hours)}</span>` : ''}${ch.handle ? `<span>${I.send}${esc(ch.handle)}</span>` : ''}</div>
      <a class="btn small ghost calc" href="#calc">${I.calc} Рассчитать стоимость</a>
      <a class="btn small" href="${esc(write)}" ${ch.kind === 'share' ? '' : 'data-write'}>${I.send} <span>Написать</span></a>
    </div></header>

    <main id="top">
      <div class="wrap">
        <section class="hero">
          <div class="pic"><img src="${esc(C.hero || `${ASSETS}/photos/hero.webp`)}" alt="" width="1280" height="800" />${FACTS && !C.hero ? '<span class="stock">Фото для примера</span>' : ''}${FACTS ? '' : '<span class="ready"><small>Готовы к работе</small>Проверенная техника</span>'}</div>
          <div class="text">
            <span class="where">${I.pin} Спецтехника в ${esc(C.cityIn || C.city)}</span>
            <h1>${FACTS ? `Аренда спецтехники <em>в ${esc(C.cityIn || C.city)}</em>` : 'Спецтехника на вашем объекте <em>точно в срок</em>'}</h1>
            <p class="lead">${FACTS ? `Выберите технику, укажите адрес и время — заявка уйдёт в ${ch.label} уже заполненной.` : 'Выберите технику, укажите адрес и получите предварительный расчёт аренды — заявка уйдёт диспетчеру уже заполненной.'}</p>
            <div class="actions"><a class="btn" href="#fleet">Подобрать технику ${I.down}</a><a class="btn onDark" href="#calc">${I.calc} Рассчитать стоимость</a></div>
            <div class="stats"><div><b>${list.length}</b><span>${FACTS ? plural(list.length, 'вид', 'вида', 'видов') : plural(list.length, 'единица', 'единицы', 'единиц')} техники</span></div>${FACTS ? (C.rating ? `<div><b>${esc(String(C.rating).replace('.', ','))}</b><span>оценка в 2ГИС${C.reviews ? ` · ${C.reviews} ${plural(C.reviews, 'отзыв', 'отзыва', 'отзывов')}` : ''}</span></div>` : '') : `<div><b>от ${C.leadHours ?? 2} ч</b><span>подача на объект</span></div>`}</div>
          </div>
        </section>

        ${FACTS ? '<!--' : ''}<div class="perks">
          <div><i>${I.timer}</i><p><b>Подача от ${C.leadHours ?? 2} ${(C.leadHours ?? 2) === 1 ? 'часа' : 'часов'}</b><span>По городу и пригороду</span></p></div>
          <div><i>${I.helmet}</i><p><b>Техника с оператором</b><span>Опытные машинисты</span></p></div>
          <div><i>${I.rub}</i><p><b>Цена до звонка</b><span>Расчёт сразу на странице</span></p></div>
        </div>${FACTS ? '-->' : ''}

        <section class="section" id="fleet">
          <p class="eyebrow">Наш парк</p>
          <div class="head"><h2>Выберите технику под задачу</h2><p>${FACTS ? esc(C.fleetNote || 'Свободна ли машина на вашу дату, подтвердит диспетчер.') : 'Вся техника обслужена, укомплектована и подаётся на объект с опытным оператором.'}</p></div>
          <div class="fleet" data-fleet>${list.map(cardHtml).join('')}</div>
        </section>

        <section class="section" id="calc">
          <p class="eyebrow">Расчёт аренды</p>
          <div class="head"><h2>Укажите детали работы</h2><p>Заполните параметры объекта — сумма пересчитается автоматически.</p></div>
          <div class="calcGrid">
            <form class="panel form" data-form novalidate>
              <div><label class="lbl" for="f-machine">Выбранная техника</label>
                <span class="ctl">${I.truck.replace('width="24" height="24"', 'width="18" height="18"')}<select class="field" id="f-machine" name="machine"></select></span></div>
              <div><label class="lbl" for="f-address">Адрес объекта</label>
                <span class="ctl">${I.pin}<input class="field" id="f-address" name="address" autocomplete="street-address" placeholder="${esc(C.city)}, улица, дом" /></span><p class="err" data-err="address" hidden></p></div>
              <div class="row2">
                <div><label class="lbl" for="f-date">Дата начала работ</label><span class="ctl">${I.cal}<input class="field" id="f-date" name="date" type="date" min="${isoDate(new Date())}" /></span><p class="err" data-err="date" hidden></p></div>
                <div><label class="lbl" for="f-time">Желаемое время подачи</label><span class="ctl">${I.clock}<input class="field" id="f-time" name="time" type="time" step="900" /></span></div>
              </div>
              <div class="row2">
                <div><label class="lbl" for="f-hours">Количество часов</label><span class="ctl">${I.clock}<input class="field" id="f-hours" name="hours" type="number" inputmode="numeric" min="1" max="240" placeholder="Например, 8" /></span></div>
                ${zs.length ? `<div><label class="lbl" for="f-zone">Зона доставки</label><select class="field plain" id="f-zone" name="zone">${zs.map((z) => `<option value="${esc(z.id)}">${esc(z.name)} — ${money(z.price)}</option>`).join('')}</select></div>` : ''}
              </div>
              <div data-notice></div>
              <div><label class="lbl" for="f-comment">Комментарий</label>
                <span class="ctl">${I.note}<textarea class="field" id="f-comment" name="comment" placeholder="Что нужно сделать: выкопать траншею, разгрузить плиты…"></textarea></span></div>
              <label class="check"><input type="checkbox" name="photos" /><span>Пришлю фото объекта<small>Фотографии подъезда и места работ можно отправить в том же чате сразу после заявки.</small></span></label>
            </form>
            <aside class="sum" data-sum></aside>
          </div>
        </section>

        <section class="section">
          <p class="eyebrow">Как это работает</p>
          <div class="steps">
            <div><b>Выбираете технику</b><span>${FACTS ? 'В каталоге — техника компании и цена за час там, где она известна.' : 'В каталоге видно, что свободно, сколько стоит час и какая минимальная смена.'}</span></div>
            <div><b>Указываете объект</b><span>${FACTS ? 'Адрес, дата и часы — страница считает примерную сумму аренды.' : 'Адрес, дата, часы и зона доставки — страница сразу считает примерную сумму.'}</span></div>
            <div><b>Отправляете заявку</b><span>Откроется ${ch.label} с готовым текстом. Диспетчер подтвердит машину и точную цену.</span></div>
          </div>
        </section>
      </div>
    </main>

    <footer class="foot"><div class="wrap">
      <div class="cols">
        <p><b>${esc(C.name)}</b>${esc(C.tagline)}</p>
        <p><b>Контакты</b>${C.phone ? `<a href="tel:${esc(C.phone.replace(/[^\d+]/g, ''))}">${esc(C.phone)}</a><br />` : ''}${esc(C.city)}${C.address ? ', ' + esc(C.address) : ''}</p>
        <p><b>Режим работы</b>${esc(C.hours || 'Уточняйте по телефону')}</p>
      </div>
      <p class="tiny">Стоимость на странице предварительная и не является публичной офертой. <a href="#owner">Панель владельца</a></p>
    </div></footer>

    <div class="bar" data-bar></div>`
  }

  function fillMachineSelect(select) {
    select.innerHTML =
      '<option value="">Не выбрана</option>' +
      fleet()
        .map((m) => `<option value="${esc(m.id)}" ${m.status === 'busy' ? 'disabled' : ''}>${esc(m.name)}${m.rate ? ` · ${rateText(m)}/ч` : ''}${m.status === 'busy' ? ' — занята' : ''}</option>`)
        .join('')
    select.value = order.machine
  }

  /** Перерисовывает только то, что зависит от заявки: поля ввода остаются на месте и не теряют курсор. */
  function refresh() {
    const $ = (sel) => app.querySelector(sel)
    $('[data-fleet]').innerHTML = fleet().map(cardHtml).join('')
    $('[data-sum]').innerHTML = sumHtml()
    $('[data-bar]').innerHTML = barHtml()
    $('[data-notice]').innerHTML = noticeHtml()
    fillMachineSelect($('#f-machine'))
    const bad = touched ? problems() : {}
    for (const name of ['address', 'date']) {
      const el = $(`[data-err="${name}"]`)
      el.hidden = !bad[name]
      el.textContent = bad[name] || ''
      $(`#f-${name}`).classList.toggle('bad', Boolean(bad[name]))
    }
    $('#f-machine').classList.toggle('bad', Boolean(bad.machine))
  }

  function toast(text) {
    document.querySelector('.toast')?.remove()
    const el = document.createElement('div')
    el.className = 'toast'
    el.setAttribute('role', 'status')
    el.textContent = text
    document.body.append(el)
    setTimeout(() => el.remove(), 2600)
  }

  function send(index = 0) {
    touched = true
    const bad = problems()
    refresh()
    const first = ['machine', 'address', 'date'].find((name) => bad[name])
    if (first) {
      const el = app.querySelector(`#f-${first}`)
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      el.focus({ preventScroll: true })
      toast(bad[first])
      return
    }
    go((channels()[index] || channel()).link(message()))
  }

  async function copy() {
    touched = true
    const bad = problems()
    refresh()
    if (Object.keys(bad).length) return toast(Object.values(bad)[0])
    try {
      await navigator.clipboard.writeText(message())
      toast('Текст заявки скопирован')
    } catch {
      toast('Не получилось скопировать — отправьте заявку кнопкой')
    }
  }

  function showClient() {
    app.innerHTML = clientHtml()
    const form = app.querySelector('[data-form]')
    form.address.value = order.address
    form.date.value = order.date
    form.time.value = order.time
    form.hours.value = order.hours
    if (form.zone) form.zone.value = order.zone
    form.comment.value = order.comment
    form.photos.checked = order.photos
    refresh()

    form.addEventListener('input', (event) => {
      const el = event.target
      order[el.name] = el.type === 'checkbox' ? el.checked : el.value
      refresh()
    })
    form.addEventListener('submit', (event) => event.preventDefault())
  }

  app.addEventListener('click', (event) => {
    const pick = event.target.closest('[data-pick]')
    if (pick) {
      const same = order.machine === pick.dataset.pick
      order.machine = pick.dataset.pick
      refresh()
      // первый выбор сразу ведёт к расчёту; повторное нажатие на выбранную — тоже
      if (!same || pick.classList.contains('dark')) document.getElementById('calc').scrollIntoView({ behavior: 'smooth' })
      return
    }
    const sender = event.target.closest('[data-send]')
    if (sender) return send(Number(sender.dataset.send) || 0)
    if (event.target.closest('[data-copy]')) return copy()
    const write = event.target.closest('[data-write]')
    if (write) {
      event.preventDefault()
      go(write.getAttribute('href'))
    }
  })

  // ---------- панель владельца ----------

  function ownerHtml() {
    const c = contact()
    return `<div class="wrap owner">
      <a class="back" href="#top">${I.back} На сайт</a>
      <h1>Панель владельца</h1>
      ${SAMPLE ? `<div class="note hint">${I.info}<span><b>Это образец.</b> Правки сохраняются только в этом браузере — так удобно попробовать. В рабочей версии цены и статусы хранятся в общей базе и сразу видны всем клиентам.</span></div>` : ''}

      <h2>Настройки техники</h2>
      <div class="ogrid">${fleet()
        .map(
          (m) => `<section class="ocard" data-machine="${esc(m.id)}">
          <div class="ohead">${photo(m) ? `<img src="${esc(photo(m))}" alt="" loading="lazy" />` : ''}<div><small>Техника</small><b>${esc(m.name)}</b></div></div>
          <div class="obody">
            <div class="pair">
              <label><span class="lbl">Цена за час, ₽</span><input class="field plain" type="number" inputmode="numeric" min="0" step="100" data-set="rate" value="${m.rate || ''}" placeholder="по запросу" /></label>
              <label><span class="lbl">Мин. смена, часов</span><input class="field plain" type="number" inputmode="numeric" min="1" max="24" data-set="minHours" value="${m.minHours || ''}" placeholder="нет" /></label>
            </div>
            <div><span class="lbl">Статус техники</span><div class="seg">${Object.entries(STATUS)
              .map(([key, label]) => `<button type="button" class="${key} ${m.status === key ? 'on' : ''}" data-status="${key}" aria-pressed="${m.status === key}">${label}</button>`)
              .join('')}</div></div>
          </div>
        </section>`,
        )
        .join('')}</div>

      <h2>Доставка</h2>
      <div class="panel form">${zones().length ? '' : '<p style="color:var(--ink-2)">Цены доставки не заданы — клиенту показывается «уточнит диспетчер».</p>'}${zones()
        .map((z) => `<label data-zone="${esc(z.id)}"><span class="lbl">${esc(z.name)}, ₽</span><input class="field plain" type="number" inputmode="numeric" min="0" step="500" value="${z.price}" /></label>`)
        .join('')}</div>

      <h2>Куда приходят заявки</h2>
      <div class="panel form">
        <label><span class="lbl">Telegram: имя пользователя или номер</span><input class="field plain" data-contact="telegram" placeholder="@vasha_tehnika" value="${esc(c.telegram)}" autocapitalize="off" autocomplete="off" /></label>
        <label><span class="lbl">WhatsApp: номер (если Telegram не указан)</span><input class="field plain" data-contact="whatsapp" inputmode="tel" placeholder="+7 900 000-00-00" value="${esc(c.whatsapp)}" /></label>
      </div>

      <div class="reset"><p>Вернуть цены, статусы и контакты к исходным значениям.</p><button class="btn ghost" data-reset>Сбросить демонстрационные данные</button></div>
    </div>`
  }

  function showOwner() {
    app.innerHTML = ownerHtml()
    window.scrollTo(0, 0)
    const root = app.querySelector('.owner')

    root.addEventListener('change', (event) => {
      const el = event.target
      const machine = el.closest('[data-machine]')
      const zone = el.closest('[data-zone]')
      if (machine && el.dataset.set) {
        const value = Math.max(0, Math.round(Number(el.value) || 0)) || null // пусто — «по запросу» / «без минимальной смены»
        el.value = value ?? ''
        ;((saved.fleet ??= {})[machine.dataset.machine] ??= {})[el.dataset.set] = value
      } else if (zone) {
        const value = Math.max(0, Math.round(Number(el.value) || 0))
        el.value = value
        ;((saved.zones ??= {})[zone.dataset.zone] ??= {}).price = value
      } else if (el.dataset.contact) {
        ;(saved.contact ??= contact())[el.dataset.contact] = el.value.trim()
      } else return
      save()
      toast('Сохранено')
    })

    root.addEventListener('click', (event) => {
      const status = event.target.closest('[data-status]')
      if (status) {
        const id = status.closest('[data-machine]').dataset.machine
        ;((saved.fleet ??= {})[id] ??= {}).status = status.dataset.status
        save()
        for (const b of status.parentElement.children) {
          b.classList.toggle('on', b === status)
          b.setAttribute('aria-pressed', b === status)
        }
        if (order.machine === id && status.dataset.status === 'busy') order.machine = ''
        return toast('Сохранено')
      }
      if (event.target.closest('[data-reset]')) {
        saved = {}
        try {
          localStorage.removeItem(KEY)
        } catch {
          // нечего удалять
        }
        showOwner()
        toast('Данные сброшены')
      }
    })
  }

  // ---------- переключение страниц ----------

  let view = ''
  function route() {
    const next = location.hash === '#owner' ? 'owner' : 'client'
    if (next === view) return
    view = next
    if (view === 'owner') showOwner()
    else {
      showClient()
      if (location.hash.length > 1) document.getElementById(location.hash.slice(1))?.scrollIntoView()
    }
  }
  window.addEventListener('hashchange', route)
  // Правки владельца из другой вкладки этого же браузера подхватываются без перезагрузки.
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY) return
    saved = readSaved()
    if (view === 'client') refresh()
  })
  route()
})()
