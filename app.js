const firebaseConfig = {
  apiKey: "AIzaSyBrtXBFmtWdUBf9e__ihXbuzEmesZZzV-o",
  authDomain: "project-9010060494549576974.firebaseapp.com",
  projectId: "project-9010060494549576974",
  storageBucket: "project-9010060494549576974.firebasestorage.app",
  messagingSenderId: "449222114949",
  appId: "1:449222114949:web:88827ceac03ac9270873ec"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 레이아웃: 'h'=가로 슬라이드(index.html), 'v'=세로 연속 스크롤(index-v.html)
const LAYOUT = document.documentElement.dataset.layout || 'h';
const IS_V = LAYOUT === 'v';

// ─── DEFAULT CONFIG ───────────────────────────────────
const DEFAULT = {
  header: {
    tag:    'Wedding Invitation',
    title:  '우리의 결혼식',
    ogDesc: '저희의 결혼식에 초대합니다.',
    ogImage: '',
    footer: '2027. 01. 17',
    photo:  '',
  },
  headerStyle: {
    tag:   { fontSize: '', color: '', fontFamily: '', textAlign: 'center' },
    names: { fontSize: '', color: '', fontFamily: '', textAlign: 'center' },
    ko:    { fontSize: '', color: '', fontFamily: '', textAlign: 'center' },
    date:  { fontSize: '', color: '', fontFamily: '', textAlign: 'center' },
    venue: { fontSize: '', color: '', fontFamily: '', textAlign: 'center' },
  },
  groom: { name: '신랑', engName: 'GROOM', phone: '' },
  bride: { name: '신부', engName: 'BRIDE', phone: '' },
  wedding: {
    date: '2027. 01. 17 (일)',
    dateISO: '2027-01-17',
    time: '오후 2시',
    venue: '예식장',
    venueAddr: '주소를 입력해주세요',
    venueDetail: '',
    mapEmbedUrl: '',
    kakaoLink: '', naverLink: '', tmapLink: '',
    closing: '',
    directions: { car: '', subway: '', bus: '', outer: '' },
  },
  greeting: {
    title: '결혼합니다',
    message: '서로가 마주보며 다져온 사랑을\n이제 함께 걸어갈 큰 사랑으로 키우고자 합니다.\n저희 두 사람이 사랑의 결실을 맺는 자리에\n오셔서 축복해 주시면 감사하겠습니다.',
    groom: { fatherName: '', motherName: '', relation: '의 아들' },
    bride: { fatherName: '', motherName: '', relation: '의 딸' },
  },
  gallery: { images: [] },
  film:    { images: [] },
  intro:   { photo: '' },
  schedule: {
    meal: '예식 후 식사를 함께 합니다.',
    parking: '주차 정보를 입력해주세요.',
    shuttle: '셔틀버스 정보를 입력해주세요.',
  },
  accounts: [
    { group: '신랑 측', who: '신랑', name: '예금주', bank: '은행', number: '계좌번호' },
    { group: '신랑 측', who: '신랑 아버지', name: '예금주', bank: '은행', number: '계좌번호' },
    { group: '신부 측', who: '신부', name: '예금주', bank: '은행', number: '계좌번호' },
    { group: '신부 측', who: '신부 아버지', name: '예금주', bank: '은행', number: '계좌번호' },
  ],
  rsvp: { enabled: true, deadline: '2026년 12월 31일' },
  flowers: {
    enabled: true,
    url: '',
    text: '화환은 정중히 사양합니다.\n마음만 감사히 받겠습니다.',
  },
  couple: {
    groom: { photo: '', intro: '', mbti: '' },
    bride: { photo: '', intro: '', mbti: '' },
  },
  parents: {
    groom: { father: { name: '', photo: '' }, mother: { name: '', photo: '' } },
    bride:  { father: { name: '', photo: '' }, mother: { name: '', photo: '' } },
  },
  lovestory: {
    items: [{ date: '', title: '첫 만남', desc: '' }],
  },
  sections: [
    { id: 'header',    enabled: true,  order: 0 },
    { id: 'intro',     enabled: true,  order: 0.5 },
    { id: 'greeting',  enabled: true,  order: 1 },
    { id: 'couple',    enabled: false, order: 2 },
    { id: 'parents',   enabled: false, order: 3 },
    { id: 'lovestory', enabled: false, order: 4 },
    { id: 'gallery',   enabled: true,  order: 5 },
    { id: 'dday',      enabled: true,  order: 6 },
    { id: 'schedule',  enabled: true,  order: 7 },
    { id: 'location',  enabled: true,  order: 8 },
    { id: 'accounts',  enabled: true,  order: 9 },
    { id: 'rsvp',      enabled: true,  order: 10 },
    { id: 'flowers',   enabled: true,  order: 11 },
    { id: 'guestbook', enabled: true,  order: 12 },
  ],
};

const SECTION_NAV = {
  header:    null,
  intro:     '인트로',
  greeting:  '초대장',
  couple:    '신랑신부',
  parents:   '부모님',
  lovestory: '스토리',
  gallery:   '오늘의 주인공',
  dday:      'D-DAY',
  schedule:  '예식안내',
  location:  '오시는길',
  accounts:  '마음전달',
  rsvp:      '참석여부',
  flowers:   '화환',
  guestbook: '방명록',
};

// 가로 버전: 합쳐지는 섹션의 nav 타깃을 대표 페이지로 돌린다
// (마음전달·참석여부·방명록 → 한 페이지(accounts), D-DAY는 마지막 단독 마무리)
const NAV_TARGET = { rsvp: 'accounts', guestbook: 'accounts' };

const GALLERY_THUMBS = 9; // 3×3

// ─── RENDERERS ────────────────────────────────────────

function renderHeader(c) {
  const hs = c.headerStyle || {};
  const photo = c.header?.photo;
  const customEls = hs.custom || [];
  const hasDrag = customEls.length > 0;

  const inner = customEls.map(cu =>
    `<div class="fadein"${buildStyle(cu)}>${esc(cu.text || '')}</div>`
  ).join('');

  const hint = `<div class="h-next-hint" aria-hidden="true">&gt;</div>`;

  if (photo) {
    const overlayStyle = hasDrag ? ' style="position:absolute;inset:0;padding:0;"' : '';
    return `
<section id="sec-header" class="has-photo${hasDrag?' drag-mode':''}">
  <div class="header-photo" style="background-image:url('${esc(photo)}')">
    <div class="header-photo-overlay"${overlayStyle}>${inner}
    </div>
  </div>
  ${hint}
</section>`;
  }

  return `
<section id="sec-header"${hasDrag?' class="drag-mode"':''}>
  ${inner}
  ${hint}
</section>`;
}

// 필름 흐름(옛날 사진) — 좌→우 / 우→좌 방향 스트립
function filmStrip(images, dir) {
  if (!images.length) return '';
  const frames = images
    .map(u => `<div class="film-frame"><img src="${esc(u)}" alt="" loading="lazy"></div>`)
    .join('');
  // 무한 루프를 위해 프레임을 두 벌 이어붙임
  return `<div class="film-strip film-${dir}" aria-hidden="true"><div class="film-track">${frames}${frames}</div></div>`;
}

// 인트로: 메인 다음 화면(사진 + 필름 흐름)
function renderIntro(c) {
  const film = c.film?.images || [];
  const photo = c.intro?.photo || c.header?.photo || '';
  return `
<section id="sec-intro" class="fadein h-intro${film.length ? ' has-film' : ''}">
  <div class="intro-photo"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}></div>
  ${filmStrip(film, 'ltr')}
</section>`;
}

function renderGreeting(c) {
  const g  = c.greeting;
  const film = c.film?.images || [];
  return `
<section id="sec-greeting" class="fadein h-greeting${film.length ? ' has-film' : ''}">
  <div class="sec">
    <div class="sec-title">${esc(g.title || '결혼합니다')}</div>
    <div class="sec-divider"></div>
    <p class="greeting-message">${esc(g.message || '').replace(/\n/g,'<br>')}</p>
  </div>
  ${filmStrip(film, 'ltr')}
</section>`;
}

function renderCouple(c) {
  const g = c.couple?.groom || {};
  const b = c.couple?.bride || {};
  function card(role, name, d) {
    const photo = d.photo
      ? `<img class="couple-photo" src="${esc(d.photo)}" alt="${esc(name)}">`
      : `<div class="couple-photo-placeholder">사진 준비 중</div>`;
    return `
    <div class="couple-card fadein">
      ${photo}
      <div class="couple-info">
        <div class="couple-role">${role}</div>
        <div class="couple-name">${esc(name)}</div>
        ${d.mbti ? `<div class="couple-mbti">${esc(d.mbti)}</div>` : ''}
        ${d.intro ? `<div class="couple-intro">${esc(d.intro)}</div>` : ''}
      </div>
    </div>`;
  }
  return `
<section id="sec-couple">
  <div class="sec">
    <div class="sec-label">The Couple</div>
    <div class="sec-title">신랑 · 신부</div>
    <div class="sec-divider"></div>
    <div class="couple-grid">
      ${card('신 랑', c.groom.name, g)}
      ${card('신 부', c.bride.name, b)}
    </div>
  </div>
</section>`;
}

function renderParents(c) {
  const gp = c.parents?.groom || {};
  const bp = c.parents?.bride || {};
  function side(title, data) {
    return `
    <div>
      <div class="parents-side-title">${title}</div>
      <div class="parents-cards">
        ${['father','mother'].map(k => {
          const p = data[k] || {};
          const name = p.name || (k === 'father' ? '아버지' : '어머니');
          const photo = p.photo
            ? `<img class="parents-photo" src="${esc(p.photo)}" alt="${esc(name)}">`
            : `<div class="parents-photo" style="background:var(--bg3);border-radius:50%;"></div>`;
          return `<div class="parents-card">${photo}<div class="parents-role">${k==='father'?'부':'모'}</div><div class="parents-name">${esc(name)}</div></div>`;
        }).join('')}
      </div>
    </div>`;
  }
  return `
<section id="sec-parents">
  <div class="sec">
    <div class="sec-label">Family</div>
    <div class="sec-title">부모님</div>
    <div class="sec-divider"></div>
    <div class="parents-grid">
      ${side('신랑 측', gp)}
      ${side('신부 측', bp)}
    </div>
  </div>
</section>`;
}

function renderLovestory(c) {
  const items = c.lovestory?.items || [];
  return `
<section id="sec-lovestory">
  <div class="sec">
    <div class="sec-label">Our Story</div>
    <div class="sec-title">스토리</div>
    <div class="sec-divider"></div>
    <div class="timeline">
      ${items.map(it => `
      <div class="timeline-item fadein">
        <div class="timeline-dot"></div>
        ${it.date ? `<div class="timeline-date">${esc(it.date)}</div>` : ''}
        <div class="timeline-title">${esc(it.title || '')}</div>
        ${it.desc ? `<div class="timeline-desc">${esc(it.desc)}</div>` : ''}
      </div>`).join('')}
    </div>
  </div>
</section>`;
}

function renderGallery(c) {
  const g  = c.greeting;
  const gp = g.groom || {};
  const bp = g.bride || {};
  const showParents = gp.fatherName || gp.motherName || bp.fatherName || bp.motherName;
  const images = c.gallery?.images || [];
  const shown = images.slice(0, GALLERY_THUMBS);
  const content = images.length
    ? shown.map((url,i) => `<div class="gallery-cell" data-idx="${i}"><img src="${esc(url)}" alt="사진 ${i+1}" loading="lazy"></div>`).join('')
    : `<div class="gallery-empty">사진을 준비 중입니다</div>`;
  const moreBtn = images.length
    ? `<button class="gallery-more" id="galleryMore">+ 더보기</button>`
    : '';
  const couple = `
    <div class="stars-grid">
      <div class="greeting-family">
        <div class="greeting-family-role">신랑</div>
        ${showParents ? `<p class="greeting-parents-line">${gp.fatherName ? esc(gp.fatherName) + ' · ' : ''}${esc(gp.motherName || '')}${esc(gp.relation || '')}</p>` : ''}
        <div class="greeting-person-name">${esc(c.groom.name)}</div>
      </div>
      <div class="greeting-family">
        <div class="greeting-family-role">신부</div>
        ${showParents ? `<p class="greeting-parents-line">${bp.fatherName ? esc(bp.fatherName) + ' · ' : ''}${esc(bp.motherName || '')}${esc(bp.relation || '')}</p>` : ''}
        <div class="greeting-person-name">${esc(c.bride.name)}</div>
      </div>
    </div>`;
  return `
<section id="sec-gallery" class="fadein">
  <div class="sec">
    <div class="sec-label">Today</div>
    <div class="sec-title">오늘의 주인공</div>
    <div class="sec-divider"></div>
    ${couple}
    <div class="gallery-grid h-gallery-grid" id="galleryGrid">${content}</div>
    ${moreBtn}
  </div>
</section>`;
}

function renderDday(c) {
  const w = c.wedding;
  const closing = w.closing || '';
  return `
<section id="sec-dday" class="fadein h-finale">
  <div class="sec">
    <div class="sec-label">Countdown</div>
    <div class="sec-title">D-DAY</div>
    <div class="sec-divider"></div>
    <div class="dday-wrapper">
      <div class="dday-count" id="ddayCount">···</div>
      <div class="dday-tag">DAYS TO GO</div>
      <div class="dday-clock">
        <div class="dday-unit"><span class="dday-num" id="ddayH">··</span><span class="dday-unit-lbl">HOURS</span></div>
        <div class="dday-unit"><span class="dday-num" id="ddayM">··</span><span class="dday-unit-lbl">MIN</span></div>
        <div class="dday-unit"><span class="dday-num" id="ddayS">··</span><span class="dday-unit-lbl">SEC</span></div>
      </div>
      <div class="dday-wedding-date">${esc(w.date)}　${esc(w.time)}</div>
    </div>
    ${closing ? `<p class="dday-closing">${esc(closing).replace(/\n/g,'<br>')}</p>` : ''}
  </div>
</section>`;
}

function renderSchedule(c) {
  const s = c.schedule || {};
  const items = [
    { icon: '🍽', label: '식 사', text: s.meal },
    { icon: '🅿', label: '주 차', text: s.parking },
    { icon: '🚌', label: '셔 틀', text: s.shuttle },
  ].filter(it => it.text);
  return `
<section id="sec-schedule" class="fadein">
  <div class="sec">
    <div class="sec-label">Schedule</div>
    <div class="sec-title">예식 안내</div>
    <div class="sec-divider"></div>
    <div class="schedule-list">
      ${items.map(it => `
      <div class="schedule-item">
        <div class="schedule-body">
          <div class="schedule-label">${it.label}</div>
          <div class="schedule-text">${esc(it.text)}</div>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>`;
}

// 교통안내 서식: **굵게**, {{색상|글자}} 지원 후 줄바꿈
function fmtRich(s) {
  let t = esc(s);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\{\{([^|}]+)\|([^}]+)\}\}/g, (_m, col, txt) => `<span style="color:${col.trim()}">${txt}</span>`);
  return t.replace(/\n/g, '<br>');
}

function renderLocation(c) {
  const w = c.wedding;
  const mapContent = `<div id="mapEmbedSlot">${w.mapEmbedUrl ? '' : '<div class="location-map-placeholder">지도 준비 중</div>'}</div>`;
  const dir = w.directions || {};
  const hasDetail = ['car','subway','bus','outer'].some(k => (dir[k] || '').trim());
  const navBtns = [
    w.kakaoLink && `<a href="${esc(w.kakaoLink)}" class="location-btn loc-kakao" target="_blank" rel="noopener">카카오맵</a>`,
    w.naverLink && `<a href="${esc(w.naverLink)}" class="location-btn loc-naver" target="_blank" rel="noopener">네이버지도</a>`,
    w.tmapLink  && `<a href="${esc(w.tmapLink)}"  class="location-btn loc-tmap"  target="_blank" rel="noopener">T맵</a>`,
    hasDetail   && `<button type="button" class="location-btn loc-detail" id="transportOpenBtn">상세 안내</button>`,
  ].filter(Boolean);
  return `
<section id="sec-location" class="fadein">
  <div class="sec">
    <div class="sec-label">Location</div>
    <div class="sec-title">오시는 길</div>
    <div class="sec-divider"></div>
    <div class="location-map">${mapContent}</div>
    <div class="location-info">
      <div class="location-venue">${esc(w.venue)}${w.venueDetail ? ' ' + esc(w.venueDetail) : ''}</div>
      <div class="location-addr">${esc(w.venueAddr)}</div>
    </div>
    ${navBtns.length ? `<div class="location-btns">${navBtns.join('')}</div>` : ''}
  </div>
</section>`;
}

function renderAccounts(c) {
  const accounts = c.accounts || [];
  const groups = {};
  accounts.forEach(a => {
    const g = a.group || '계좌번호';
    if (!groups[g]) groups[g] = [];
    groups[g].push(a);
  });
  const html = Object.entries(groups).map(([title, items]) => `
  <div class="account-group" data-group="${esc(title)}">
    <div class="account-group-head">
      <span class="account-group-title">${esc(title)}</span>
    </div>
    <div class="account-body">
      ${items.map(a => {
        const side = title.includes('신랑') ? '신랑' : title.includes('신부') ? '신부' : '';
        const who = (side && a.who && !a.who.startsWith(side)) ? `${side} ${a.who}` : a.who;
        return `
      <div class="account-item account-copy-btn"
        data-number="${esc(a.number)}"
        data-bank="${esc(a.bank)}"
        data-name="${esc(a.name)}">
        <span class="account-who">${esc(who)}</span>
        <span class="account-holder-name">${esc(a.name)}</span>
      </div>`;
      }).join('')}
    </div>
  </div>`).join('');
  return `
<section id="sec-accounts" class="fadein">
  <div class="sec">
    <div class="sec-label">Gift</div>
    <div class="sec-title">마음 전달</div>
    <div class="sec-divider"></div>
    <div class="accounts-list">${html}</div>
    <p class="accounts-hint">* 이름을 누르시면 계좌번호가 복사됩니다</p>
  </div>
</section>`;
}

function renderFlowers(c) {
  const f = c.flowers || {};
  return `
<section id="sec-flowers" class="fadein">
  <div class="sec">
    <div class="sec-label">Flowers</div>
    <div class="sec-title">화환 안내</div>
    <div class="sec-divider"></div>
    <p class="flowers-text">${esc(f.text || '').replace(/\n/g,'<br>')}</p>
    ${f.url ? `<div class="flowers-link"><a href="${esc(f.url)}" target="_blank" rel="noopener" class="flowers-btn">화환 보내기</a></div>` : ''}
  </div>
</section>`;
}

// 참석여부 & 방명록 (한 섹션, 버튼 반반 · 참석=모달, 방명록=아래 가로흐름)
function renderRsvpGuestbook(c, withRsvp, withGuestbook) {
  const deadline = c.rsvp?.deadline || '';
  const btns = `
    <div class="rsvp-gb-btns">
      ${withRsvp ? `<button class="rsvp-open-btn half" id="rsvpOpenBtn">참석 여부</button>` : ''}
      ${withGuestbook ? `<button class="gb-open-btn half" id="gbOpenBtn">방명록 남기기</button>` : ''}
    </div>`;
  const gbList = withGuestbook ? `
    <div class="gb-hwrap">
      <div class="gb-hlist" id="gbList"><div class="gb-empty">첫 번째 메시지를 남겨주세요</div></div>
      <div style="text-align:center"><button class="gb-more gb-more-h" id="gbMore" style="display:none">더 보기</button></div>
    </div>` : '';
  return `
<section id="sec-rsvp" class="fadein">
  <div class="sec">
    <div class="sec-label">RSVP</div>
    <div class="sec-title">참석 여부 &amp; 방명록</div>
    <div class="sec-divider"></div>
    ${btns}
    ${gbList}
  </div>
</section>`;
}

const RENDERERS = {
  header:    renderHeader,
  intro:     renderIntro,
  greeting:  renderGreeting,
  couple:    renderCouple,
  parents:   renderParents,
  lovestory: renderLovestory,
  gallery:   renderGallery,
  dday:      renderDday,
  schedule:  renderSchedule,
  location:  renderLocation,
  accounts:  renderAccounts,
  flowers:   renderFlowers,
};

// ─── UTILITIES ────────────────────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function buildStyle(s) {
  if (!s) return '';
  const p = [];
  if (s.fontSize)                              p.push(`font-size:${s.fontSize}`);
  if (s.color)                                 p.push(`color:${s.color}`);
  if (s.fontFamily)                            p.push(`font-family:${s.fontFamily}`);
  if (s.textAlign && s.textAlign !== 'center') p.push(`text-align:${s.textAlign}`);
  if (s.x != null && s.y != null) {
    p.push(`position:absolute;left:${s.x}%;top:${s.y}%;transform:translate(-50%,-50%);white-space:nowrap;max-width:92%;margin:0`);
  } else if (s.marginTop && s.marginTop !== '0') {
    p.push(`margin-top:${s.marginTop}`);
  }
  return p.length ? ` style="${p.join(';')}"` : '';
}
function showToast(msg, ms = 2400) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), ms);
}
function deepMerge(target, source) {
  const out = Object.assign({}, target);
  for (const k of Object.keys(source)) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
      out[k] = deepMerge(target[k] || {}, source[k]);
    } else {
      out[k] = source[k];
    }
  }
  return out;
}

// ─── GITHUB 이미지 자동 로딩 ───────────────────────────
// images 폴더 번호 규칙:
//   0.jpg            → 준비중(로딩) 사진
//   1.jpg            → 메인(표지) 사진
//   2.jpg            → 인트로 사진
//   01.jpg,02.jpg…   → 웨딩(오늘의 주인공 썸네일) 사진
//   001.jpg,002.jpg… → 필름 사진
const GH_IMG_BASE = 'https://raw.githubusercontent.com/hoseong911/270117/main/images/';

function imgExists(url) {
  return new Promise(res => {
    const im = new Image();
    im.onload  = () => res(true);
    im.onerror = () => res(false);
    im.src = url;
  });
}

// pad 자리수(2=웨딩,3=필름)로 1번부터 순서대로 탐색. 한 묶음(10장)이 전부 없으면 종료.
async function probeSeries(pad) {
  const out = [];
  const BATCH = 10;
  for (let start = 1; start <= 90; start += BATCH) {
    const idxs = [];
    for (let i = start; i < start + BATCH; i++) idxs.push(i);
    const res = await Promise.all(idxs.map(async i => {
      const url = GH_IMG_BASE + String(i).padStart(pad, '0') + '.jpg';
      return { i, url, ok: await imgExists(url) };
    }));
    const found = res.filter(r => r.ok);
    found.forEach(r => out.push(r.url));
    if (found.length === 0) break;   // 빈 묶음이면 더 없다고 보고 종료
  }
  return out;
}

// 깃허브 이미지가 있으면 config 를 덮어씀(없으면 기존 파이어스토어 값 유지)
async function applyGithubImages(config) {
  try {
    const [coverOk, wedding, film, introOk] = await Promise.race([
      Promise.all([ imgExists(GH_IMG_BASE + '1.jpg'), probeSeries(2), probeSeries(3), imgExists(GH_IMG_BASE + '2.jpg') ]),
      new Promise(r => setTimeout(() => r([false, [], [], false]), 7000)),
    ]);
    if (coverOk)        config.header  = { ...(config.header || {}), photo: GH_IMG_BASE + '1.jpg' };
    if (wedding.length) config.gallery = { images: wedding };
    if (film.length)    config.film    = { images: film };
    if (introOk)        config.intro   = { ...(config.intro || {}), photo: GH_IMG_BASE + '2.jpg' };
  } catch (e) {
    console.warn('github 이미지 로딩 실패:', e);
  }
}

// ─── HORIZONTAL DECK ──────────────────────────────────
function initHDeck() {
  const deck    = document.getElementById('hDeck');
  const pages   = [...deck.querySelectorAll('.h-page')];
  const hasCover = document.body.classList.contains('has-cover');
  const navItems = () => document.querySelectorAll('.nav-item');

  let cur = 0;
  const pageW = () => deck.clientWidth || window.innerWidth;

  function goto(i) {
    i = Math.max(0, Math.min(pages.length - 1, i));
    deck.scrollTo({ left: i * pageW(), behavior: 'smooth' });
  }
  function gotoPage(pageId) {
    const idx = pages.findIndex(p => p.dataset.page === pageId);
    if (idx >= 0) goto(idx);
  }
  window.__hGoto = gotoPage;

  function setActive(i) {
    cur = i;
    const activePage = pages[i]?.dataset.page;
    const onHeader = activePage === 'header';
    if (hasCover) {
      document.body.classList.toggle('nav-opaque', !onHeader);
      document.body.classList.toggle('h-cover-active', onHeader);
    }
    // 첫 화면에서만 넘김 힌트 표시
    document.body.classList.toggle('h-past-first', i !== 0);
    // 상단 메뉴 active 표시
    navItems().forEach(b => {
      const t = b.dataset.target;
      b.classList.toggle('active', t === activePage || NAV_TARGET[t] === activePage);
    });
  }

  // 책장 넘기듯: 스크롤 중에만 3D 회전, 정지(스냅)되면 완전히 원상복귀
  function applyFlip() {
    const w = pageW();
    const sl = deck.scrollLeft;
    for (let i = 0; i < pages.length; i++) {
      const d = (i * w - sl) / w;                 // 현재 페이지 기준 0
      const p = pages[i];
      if (Math.abs(d) <= 0.04) {                  // 거의 정렬됨 → 변형 제거(정렬 어긋남 방지)
        p.style.transform = 'none';
        p.style.zIndex = '2';
        continue;
      }
      const c = Math.max(-1, Math.min(1, d));
      p.style.transform = `rotateY(${c * -22}deg)`;
      p.style.zIndex = '1';
    }
  }

  let raf = null;
  deck.addEventListener('scroll', () => {
    if (!raf) {
      raf = requestAnimationFrame(() => {
        raf = null;
        applyFlip();
        const i = Math.round(deck.scrollLeft / pageW());
        if (i !== cur) setActive(i);
      });
    }
    // 스크롤이 멈춘 뒤 한 번 더 정렬 확정
    clearTimeout(deck._settleT);
    deck._settleT = setTimeout(applyFlip, 160);
  }, { passive: true });

  // 메인(표지)에서 아무 곳이나 탭/클릭하면 다음 페이지로
  const headerIdx = pages.findIndex(p => p.dataset.page === 'header');
  if (headerIdx >= 0) {
    pages[headerIdx].addEventListener('click', (e) => {
      if (e.target.closest('#menuBtn, #mainNav, #bgmBtn, a, button')) return;
      goto(headerIdx + 1);
    });
  }

  document.addEventListener('keydown', e => {
    if (document.querySelector('.wedding-modal.show, #galleryModal.show')) return;
    if (e.key === 'ArrowRight') { goto(cur + 1); }
    if (e.key === 'ArrowLeft')  { goto(cur - 1); }
  });

  window.addEventListener('resize', () => {
    deck.scrollTo({ left: cur * pageW() });
    applyFlip();
  });

  setActive(0);
  applyFlip();
}

// ─── 세로(연속 스크롤) ─────────────────────────────────
function initVScroll() {
  const hasCover = document.body.classList.contains('has-cover');
  const header = document.querySelector('.h-page[data-page="header"]');
  if (hasCover && header) {
    new IntersectionObserver(([e]) => {
      document.body.classList.toggle('nav-opaque', !e.isIntersecting);
      document.body.classList.toggle('h-cover-active', e.isIntersecting);
    }, { threshold: 0.4 }).observe(header);
  }
  // 상단 메뉴 active 표시(현재 보이는 섹션)
  const navItems = () => document.querySelectorAll('.nav-item');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const pid = e.target.dataset.page;
      navItems().forEach(b => {
        const t = b.dataset.target;
        b.classList.toggle('active', t === pid || NAV_TARGET[t] === pid);
      });
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.h-page').forEach(p => obs.observe(p));
}

// ─── INIT FUNCTIONS ───────────────────────────────────
function initNav(sections) {
  const inner   = document.getElementById('navInner');
  const menuBtn = document.getElementById('menuBtn');
  const drawer  = document.getElementById('menuDrawer');

  inner.innerHTML = sections
    .filter(s => s.enabled && SECTION_NAV[s.id])
    .sort((a,b) => (a.id === 'dday' ? 999 : a.order) - (b.id === 'dday' ? 999 : b.order))
    .map(s => `<button class="nav-item" data-target="${NAV_TARGET[s.id] || s.id}">${SECTION_NAV[s.id]}</button>`)
    .join('');

  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('open');
    drawer.classList.toggle('open');
  });

  inner.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (IS_V) {
        const el = document.querySelector(`.h-page[data-page="${target}"]`) || document.getElementById('sec-' + target);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.__hGoto?.(target);
      }
      menuBtn.classList.remove('open');
      drawer.classList.remove('open');
    });
  });
}

function initFadeIn() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fadein').forEach(el => obs.observe(el));
}

function initDday(c) {
  const dateISO = c.wedding?.dateISO || '2027-01-17';
  const timeStr = c.wedding?.time || '오후 2시';
  const rawHour = parseInt((timeStr.match(/\d+/) || ['14'])[0]);
  const hour = timeStr.includes('오후') && rawHour < 12 ? rawHour + 12 : rawHour;
  const target = new Date(`${dateISO}T${String(hour).padStart(2,'0')}:00:00+09:00`).getTime();
  function update() {
    const diff = target - Date.now();
    const el   = document.getElementById('ddayCount');
    const hEl  = document.getElementById('ddayH');
    const mEl  = document.getElementById('ddayM');
    const sEl  = document.getElementById('ddayS');
    if (!el) return;
    if (diff <= 0) {
      el.textContent = 'D+' + Math.abs(Math.floor(diff / 86400000));
      [hEl,mEl,sEl].forEach(e => e && (e.textContent='00'));
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = 'D-' + d;
    if (hEl) hEl.textContent = String(h).padStart(2,'0');
    if (mEl) mEl.textContent = String(m).padStart(2,'0');
    if (sEl) sEl.textContent = String(s).padStart(2,'0');
  }
  update();
  setInterval(update, 1000);
}

function initMapEmbed(config) {
  const slot = document.getElementById('mapEmbedSlot');
  if (!slot) return;
  const embed = (config.wedding?.mapEmbedUrl || '').trim();
  if (!embed) return;

  // 순수 URL → 바로 iframe 임베드
  if (/^https?:\/\//.test(embed)) {
    const iframe = document.createElement('iframe');
    iframe.src = embed;
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    slot.innerHTML = '';
    slot.appendChild(iframe);
    return;
  }

  // 카카오맵 '지도 퍼가기' HTML → 로더를 본문(현재 도메인)에 직접 주입해 렌더.
  // (srcdoc/iframe 방식은 about:srcdoc 오리진이라 카카오 도메인 제한에 걸려 타일이 안 뜨는 문제가 있어 변경)
  const box = slot.closest('.location-map') || slot;
  const w = Math.max(200, Math.round(box.clientWidth || 400));
  const h = Math.max(160, Math.round(box.clientHeight || Math.round(w * 0.625)));

  const idMatch  = embed.match(/id="(daumRoughmapContainer\d+)"/);
  const tsMatch  = embed.match(/"timestamp"\s*:\s*"?(\d+)"?/);
  const keyMatch = embed.match(/"key"\s*:\s*"([^"]+)"/);

  // 파싱 실패 시(형식이 다르면) 예전 srcdoc 방식으로 폴백
  if (!idMatch || !tsMatch || !keyMatch) {
    const html = embed
      .replace(/"mapWidth"\s*:\s*"?\d+"?/,  `"mapWidth" : "${w}"`)
      .replace(/"mapHeight"\s*:\s*"?\d+"?/, `"mapHeight" : "${h}"`);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('title', '오시는 길 지도');
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.srcdoc =
      '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<style>html,body{margin:0;padding:0;overflow:hidden;background:#e2e9f2}' +
      '.root_daum_roughmap,.root_daum_roughmap .wrap_map{width:100%!important}</style>' +
      '</head><body>' + html + '</body></html>';
    slot.innerHTML = '';
    slot.appendChild(iframe);
    return;
  }

  const cid = idMatch[1];
  slot.innerHTML = `<div id="${cid}" class="root_daum_roughmap root_daum_roughmap_landing" style="width:100%"></div>`;

  const render = () => {
    try {
      new daum.roughmap.Lander({
        timestamp: tsMatch[1],
        key: keyMatch[1],
        mapWidth: String(w),
        mapHeight: String(h),
      }).render();
    } catch (e) { console.warn('roughmap render 실패', e); }
  };

  if (window.daum?.roughmap?.Lander) { render(); return; }

  if (!document.querySelector('script.daum_roughmap_loader_script')) {
    const script = document.createElement('script');
    script.className = 'daum_roughmap_loader_script';
    script.charset = 'UTF-8';
    script.src = 'https://ssl.daumcdn.net/dmaps/map_js_init/roughmapLoader.js';
    document.head.appendChild(script);
  }
  // 로더가 준비될 때까지 폴링 후 렌더
  const iv = setInterval(() => {
    if (window.daum?.roughmap?.Lander) { clearInterval(iv); render(); }
  }, 100);
  setTimeout(() => clearInterval(iv), 8000);
}

function initGallery(c) {
  const images = c.gallery?.images || [];
  if (!images.length) return;
  let current = 0;
  const modal = document.getElementById('galleryModal');
  const img   = document.getElementById('galleryImg');
  const open  = idx => {
    current = ((idx % images.length) + images.length) % images.length;
    img.src = images[current];
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');   // 뒤 덱 스크롤 고정
  };
  const close = () => {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    img.src = '';
  };
  document.getElementById('galleryGrid')?.addEventListener('click', e => {
    const cell = e.target.closest('.gallery-cell');
    if (cell) open(+cell.dataset.idx);
  });
  document.getElementById('galleryMore')?.addEventListener('click', () => open(0));
  document.getElementById('modalClose')?.addEventListener('click', close);
  document.getElementById('modalPrev')?.addEventListener('click', () => open(current - 1));
  document.getElementById('modalNext')?.addEventListener('click', () => open(current + 1));
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('show')) return;
    if (e.key === 'ArrowLeft')  open(current - 1);
    if (e.key === 'ArrowRight') open(current + 1);
    if (e.key === 'Escape')     close();
  });

  // 모달 좌우 스와이프
  let sx = 0, sy = 0;
  img.addEventListener('touchstart', e => {
    sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY;
  }, { passive: true });
  img.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      open(dx < 0 ? current + 1 : current - 1);
    }
  }, { passive: true });
}

function initBgm() {
  const audio = document.getElementById('bgm');
  const btn = document.getElementById('bgmBtn');
  if (!audio || !btn) return;

  audio.loop = true;
  const sync = () => btn.classList.toggle('playing', !audio.paused);
  ['play', 'pause', 'ended'].forEach(ev => audio.addEventListener(ev, sync));

  const tryPlay = () => { const p = audio.play(); if (p) p.catch(() => {}); };

  // 로드 직후 자동재생 시도(카톡 인앱 등 허용 환경에서 바로 재생)
  tryPlay();

  // 첫 사용자 제스처에서 재생 시작(버튼 탭은 버튼 핸들러가 처리)
  let started = false;
  const onGesture = (e) => {
    if (started) return;
    if (e && e.target && e.target.closest && e.target.closest('#bgmBtn')) return;
    started = true;
    tryPlay();
  };
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev =>
    window.addEventListener(ev, onGesture, { capture: true, passive: true })
  );

  // 버튼: 재생 / 일시정지
  btn.addEventListener('click', () => {
    started = true;
    if (audio.paused) tryPlay(); else audio.pause();
  });

  // 홈화면으로 나가거나 화면을 끄면(탭 숨김) 음악 정지, 돌아오면 재생 중이던 경우만 재개
  let wasPlaying = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { wasPlaying = !audio.paused; audio.pause(); }
    else if (wasPlaying) { tryPlay(); }
  });
  window.addEventListener('pagehide', () => audio.pause());
}

function initTransportDetail(config) {
  const modal   = document.getElementById('transportModal');
  const openBtn = document.getElementById('transportOpenBtn');
  const body    = document.getElementById('transportBody');
  if (!modal || !openBtn || !body) return;
  const dir = config.wedding?.directions || {};
  const cats = [
    { label: '자차 이용',   text: dir.car },
    { label: '지하철 이용', text: dir.subway },
    { label: '버스 이용',   text: dir.bus },
    { label: '타지 이용',   text: dir.outer },
  ].filter(x => x.text && x.text.trim());
  body.innerHTML = cats.map(x => `
    <div class="transport-cat">
      <div class="transport-cat-title">${esc(x.label)}</div>
      <div class="location-detail-inner">${fmtRich(x.text)}</div>
    </div>`).join('');
  const open  = () => { modal.classList.add('show'); document.body.style.overflow = 'hidden'; document.body.classList.add('modal-open'); };
  const close = () => { modal.classList.remove('show'); document.body.style.overflow = ''; document.body.classList.remove('modal-open'); };
  openBtn.addEventListener('click', open);
  document.getElementById('transportModalClose')?.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
}

function initAccounts() {
  document.querySelectorAll('.account-copy-btn').forEach(item => {
    const nameEl = item.querySelector('.account-holder-name');
    if (!nameEl) return;
    nameEl.addEventListener('click', () => {
      const text = `${item.dataset.bank} ${item.dataset.number} ${item.dataset.name}`;
      navigator.clipboard.writeText(text).then(() => {
        nameEl.classList.add('copied');
        showToast('계좌번호가 복사되었습니다');
        setTimeout(() => nameEl.classList.remove('copied'), 2000);
      }).catch(() => showToast('클립보드 복사에 실패했습니다'));
    });
  });
}

function initRsvp() {
  const modal    = document.getElementById('rsvpModal');
  const openBtn  = document.getElementById('rsvpOpenBtn');
  const closeBtn = document.getElementById('rsvpModalClose');
  const form     = document.getElementById('rsvpForm');
  if (!modal || !openBtn) return;

  let rsvpCount = 1;

  const getAttendance = () => document.querySelector('input[name="attendance"]:checked')?.value || '참석';

  const resetModal = () => {
    form.reset();
    rsvpCount = 1;
    document.getElementById('rsvpCountVal').textContent = '1';
    document.getElementById('rsvpCountField').style.display = '';
    document.getElementById('rsvpAttYes').classList.add('selected');
    document.getElementById('rsvpAttNo').classList.remove('selected');
    document.getElementById('rsvpSubmit').textContent = '참석 의사 전달하기';
  };

  const openModal  = () => { modal.classList.add('show'); document.body.style.overflow = 'hidden'; };
  const closeModal = () => { modal.classList.remove('show'); document.body.style.overflow = ''; resetModal(); };

  openBtn.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  document.querySelectorAll('.rsvp-radio-opt').forEach(label => {
    label.addEventListener('click', () => {
      document.querySelectorAll('.rsvp-radio-opt').forEach(l => l.classList.remove('selected'));
      label.classList.add('selected');
      const attending = label.querySelector('input').value === '참석';
      document.getElementById('rsvpCountField').style.display = attending ? '' : 'none';
      document.getElementById('rsvpSubmit').textContent = attending ? '참석 의사 전달하기' : '불참 의사 전달하기';
    });
  });

  document.getElementById('rsvpCountDn')?.addEventListener('click', () => {
    if (rsvpCount > 1) { rsvpCount--; document.getElementById('rsvpCountVal').textContent = rsvpCount; }
  });
  document.getElementById('rsvpCountUp')?.addEventListener('click', () => {
    if (rsvpCount < 20) { rsvpCount++; document.getElementById('rsvpCountVal').textContent = rsvpCount; }
  });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('rsvpName').value.trim();
    if (!name) { showToast('이름을 입력해주세요'); return; }
    const attendance = getAttendance();
    const count = attendance === '참석' ? rsvpCount : 0;
    const btn = document.getElementById('rsvpSubmit');
    btn.disabled = true; btn.textContent = '전송 중...';
    try {
      await db.collection('rsvp').add({
        name, attendance, count,
        createdAt: new Date().toISOString(),
      });
      closeModal();
      showToast(`${name}님의 ${attendance} 의사가 전달되었습니다`);
    } catch(err) {
      showToast('전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      console.error(err);
    }
    btn.disabled = false; btn.textContent = attendance === '참석' ? '참석 의사 전달하기' : '불참 의사 전달하기';
  });
}

let gbLastDoc = null;
const GB_PER_PAGE = 10;

// 방명록: 필름처럼 천천히 연속으로 흐르는 마퀴(끊김 없이 루프)
function maybeStartGbTicker() {
  const list = document.getElementById('gbList');
  if (!list || list._track) return;
  const items = [...list.querySelectorAll('.gb-item')];
  if (items.length < 2) return;   // 2장 이상일 때만 흐름
  const track = document.createElement('div');
  track.className = 'gb-track';
  items.forEach(it => track.appendChild(it));
  items.forEach(it => track.appendChild(it.cloneNode(true)));   // 이음새 없는 루프용 복제
  list.innerHTML = '';
  list.appendChild(track);
  list._track = track;
  requestAnimationFrame(() => {
    const oneSet = track.scrollWidth / 2;
    const speed = 26;   // px/초 (천천히)
    track.style.animationDuration = Math.max(12, oneSet / speed) + 's';
  });
}

async function loadGuestbook(append = false) {
  const list = document.getElementById('gbList');
  const more = document.getElementById('gbMore');
  if (!list) return;
  try {
    let q = db.collection('guestbook').where('status','==','approved').orderBy('createdAt','desc').limit(GB_PER_PAGE);
    if (append && gbLastDoc) q = q.startAfter(gbLastDoc);
    const snap = await q.get();
    if (!append) { list.innerHTML = ''; list._track = null; }
    if (more) more.style.display = 'none';   // 흐름 방식이라 더보기 미사용
    if (snap.empty && !append) {
      list.innerHTML = '<div class="gb-empty">첫 번째 메시지를 남겨주세요</div>';
      return;
    }
    snap.docs.forEach(d => {
      const data = d.data();
      const el = document.createElement('div');
      el.className = 'gb-item';
      const dateStr = data.createdAt ? new Date(data.createdAt).toLocaleDateString('ko-KR') : '';
      el.innerHTML = `
        <div class="gb-name">${esc(data.name)}</div>
        <div class="gb-msg">${esc(data.message)}</div>
        ${dateStr ? `<div class="gb-date">${dateStr}</div>` : ''}`;
      list.appendChild(el);
    });
    gbLastDoc = snap.docs[snap.docs.length - 1];
    setTimeout(maybeStartGbTicker, 300);
  } catch(err) { console.error('guestbook load error', err); }
}

function initGuestbook() {
  if (!document.getElementById('gbList')) return;
  loadGuestbook();
  document.getElementById('gbMore')?.addEventListener('click', () => loadGuestbook(true));

  const modal   = document.getElementById('gbModal');
  const openBtn = document.getElementById('gbOpenBtn');
  const closeBtn = document.getElementById('gbModalClose');

  if (modal && openBtn) {
    const openModal  = () => { modal.classList.add('show'); document.body.style.overflow = 'hidden'; };
    const closeModal = () => { modal.classList.remove('show'); document.body.style.overflow = ''; };
    openBtn.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  }

  document.getElementById('gbSubmit')?.addEventListener('click', async () => {
    const name = document.getElementById('gbName').value.trim();
    const msg  = document.getElementById('gbMsg').value.trim();
    if (!name) { showToast('이름을 입력해주세요'); return; }
    if (!msg)  { showToast('메시지를 입력해주세요'); return; }
    const btn = document.getElementById('gbSubmit');
    btn.disabled = true; btn.textContent = '전송 중...';
    try {
      await db.collection('guestbook').add({
        name, message: msg,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      document.getElementById('gbName').value = '';
      document.getElementById('gbMsg').value  = '';
      document.getElementById('gbModal')?.classList.remove('show');
      document.body.style.overflow = '';
      showToast('등록되었습니다. 검토 후 게시됩니다.');
    } catch(err) {
      showToast('등록에 실패했습니다');
      console.error(err);
    }
    btn.disabled = false; btn.textContent = '방명록 남기기';
  });
}

// ─── PAGE BUILDER ─────────────────────────────────────
function wrapPage(id, html) {
  const cls = id === 'header' ? 'h-page h-page--header' : 'h-page';
  return `<div class="${cls}" data-page="${id}"><div class="h-page-inner">${html}</div></div>`;
}

function buildPages(config, sections) {
  const enabled = sections.filter(s => s.enabled).sort((a,b) => a.order - b.order);
  const has = id => enabled.some(s => s.id === id);
  const ddayEnabled = has('dday');
  const accEnabled  = has('accounts');
  const rsvpEnabled = has('rsvp');
  const gbEnabled   = has('guestbook');
  const out = [];

  // 마음전달(위) + 참석여부&방명록(아래) 한 페이지
  let comboDone = false;
  const emitCombo = () => {
    if (comboDone) return;
    comboDone = true;
    let html = '';
    if (accEnabled) html += renderAccounts(config);
    if (rsvpEnabled || gbEnabled) html += renderRsvpGuestbook(config, rsvpEnabled, gbEnabled);
    if (html) out.push(wrapPage('accounts', html));
  };

  for (const s of enabled) {
    if (s.id === 'dday') continue;   // 맨 마지막 마무리 페이지로 별도 배치
    if (s.id === 'accounts' || s.id === 'rsvp' || s.id === 'guestbook') { emitCombo(); continue; }
    const html = RENDERERS[s.id]?.(config);
    if (html) out.push(wrapPage(s.id, html));
  }
  emitCombo();   // 세 섹션 중 하나만 켜진 경우 등 안전 처리

  // D-DAY = 마지막 마무리(카운트다운 + 마무리 멘트)
  if (ddayEnabled) out.push(wrapPage('dday', renderDday(config)));

  return out.join('');
}

// ─── MAIN ─────────────────────────────────────────────
async function init() {
  let config = JSON.parse(JSON.stringify(DEFAULT));
  try {
    const snap = await Promise.race([
      db.collection('wedding_config').doc('main').get(),
      new Promise((_,rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
    ]);
    if (snap.exists) config = deepMerge(config, snap.data());
  } catch(e) {
    console.warn('Config load failed, using defaults:', e.message);
  }

  // 깃허브 images 폴더의 사진(번호 규칙)이 있으면 우선 사용
  await applyGithubImages(config);

  const h = config.header || {};
  if (h.title) {
    document.title = h.title;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', h.title);
  }
  if (h.ogDesc)  document.querySelector('meta[property="og:description"]')?.setAttribute('content', h.ogDesc);
  if (h.ogImage) document.querySelector('meta[property="og:image"]')?.setAttribute('content', h.ogImage);

  const sections = (config.sections || DEFAULT.sections).slice().sort((a,b) => a.order - b.order);

  // 인트로는 섹션 설정과 무관하게 항상 노출(메인 다음 페이지)
  if (!sections.some(s => s.id === 'intro')) {
    sections.push({ id: 'intro', enabled: true, order: 0.5 });
  }

  if (config.header?.photo) document.body.classList.add('has-cover');

  const deck = document.getElementById('hDeck');
  deck.innerHTML = buildPages(config, sections);

  initNav(sections);
  if (IS_V) initVScroll(); else initHDeck();
  initFadeIn();
  initDday(config);
  initMapEmbed(config);
  initTransportDetail(config);
  initGallery(config);
  initAccounts();
  initRsvp();
  initGuestbook();

  initBgm();

  // 준비중(0.jpg) ~1초 노출 → 흰색으로 밝아짐 → 흰화면에서 1.5초 페이드인
  const loading = document.getElementById('loadingScreen');
  const wash = document.getElementById('whiteWash');
  setTimeout(() => {
    if (wash) wash.classList.add('white');        // 0.5초 동안 흰색으로
    setTimeout(() => {
      if (loading) loading.remove();
      if (wash) {
        wash.classList.add('reveal');             // 흰화면에서 1.5초 페이드인
        setTimeout(() => wash.remove(), 1700);
      }
    }, 500);
  }, 1000);
}

init().catch(console.error);
