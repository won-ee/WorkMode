// 이메일(Outlook) 테마 오버레이
// 상단 바 + 툴바 + 폴더 + 열 헤더 + 메일 목록 + 하단

const TOPBAR_ID = 'wm-email-topbar';
const TOOLBAR_ID = 'wm-email-toolbar';
const SIDEMENU_ID = 'wm-email-sidemenu';
const COL_HEADERS_ID = 'wm-email-col-headers';
const MAIL_LIST_ID = 'wm-email-mail-list';
const FOOTER_ID = 'wm-email-footer';

let applied = false;

// 상단 바
function createTopbar(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = TOPBAR_ID;
  bar.className = 'wm-email-topbar';

  const logo = document.createElement('span');
  logo.className = 'wm-email-logo';
  logo.textContent = 'Outlook';

  const sep = document.createElement('span');
  sep.className = 'wm-email-sep';
  sep.textContent = '|';

  const title = document.createElement('span');
  title.className = 'wm-email-title';
  title.textContent = '받은편지함 (3)';

  bar.appendChild(logo);
  bar.appendChild(sep);
  bar.appendChild(title);
  return bar;
}

// 툴바
function createToolbar(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = TOOLBAR_ID;
  bar.className = 'wm-email-toolbar';

  const addBtn = (text: string) => {
    const btn = document.createElement('span');
    btn.className = 'wm-email-toolbar-btn';
    btn.textContent = text;
    bar.appendChild(btn);
  };

  const addSep = () => {
    const sep = document.createElement('span');
    sep.className = 'wm-email-toolbar-sep';
    bar.appendChild(sep);
  };

  addBtn('새 메일');
  addSep();
  addBtn('삭제');
  addBtn('보관');
  addBtn('이동');
  addBtn('분류');
  addSep();
  addBtn('회신');
  addBtn('전체 회신');
  addBtn('전달');

  // 우측 검색창
  const search = document.createElement('span');
  search.className = 'wm-email-toolbar-search';
  search.textContent = '메일 검색...';
  bar.appendChild(search);

  return bar;
}

// 좌측 폴더 목록
function createSidemenu(): HTMLElement {
  const nav = document.createElement('div');
  nav.id = SIDEMENU_ID;
  nav.className = 'wm-email-sidemenu';

  type FolderItem = { label: string; count?: number; active?: boolean; indent?: boolean; dot?: string };
  type SectionItem = { type: 'separator' } | { type: 'header'; label: string } | ({ type: 'folder' } & FolderItem);

  const items: SectionItem[] = [
    { type: 'folder', label: '받은편지함', count: 3, active: true },
    { type: 'folder', label: '중요' },
    { type: 'folder', label: '별표' },
    { type: 'folder', label: '보낸편지함' },
    { type: 'folder', label: '임시보관함', count: 1 },
    { type: 'folder', label: '휴지통' },
    { type: 'separator' },
    { type: 'header', label: '프로젝트' },
    { type: 'folder', label: '2025 Q1 기획', indent: true },
    { type: 'folder', label: '마케팅 캠페인', indent: true },
    { type: 'folder', label: '개발팀 회의', indent: true },
    { type: 'header', label: '라벨' },
    { type: 'folder', label: '긴급', indent: true, dot: '#e74c3c' },
    { type: 'folder', label: '검토필요', indent: true, dot: '#f39c12' },
    { type: 'folder', label: '참조', indent: true, dot: '#3498db' },
  ];

  for (const item of items) {
    if (item.type === 'separator') {
      const hr = document.createElement('div');
      hr.className = 'wm-email-sep-line';
      nav.appendChild(hr);
      continue;
    }

    if (item.type === 'header') {
      const hdr = document.createElement('div');
      hdr.className = 'wm-email-section-header';
      hdr.textContent = item.label;
      nav.appendChild(hdr);
      continue;
    }

    const row = document.createElement('div');
    row.className = 'wm-email-folder';
    if (item.active) row.classList.add('wm-email-folder-active');
    if (item.indent) row.classList.add('wm-email-folder-indent');

    // 라벨 컬러 도트 (CSS로 그림)
    if (item.dot) {
      const dot = document.createElement('span');
      dot.className = 'wm-email-label-dot';
      dot.style.cssText = `background:${item.dot} !important;`;
      row.appendChild(dot);
    }

    const label = document.createElement('span');
    label.className = 'wm-email-folder-label';
    label.textContent = item.label;
    row.appendChild(label);

    if (item.count != null) {
      const badge = document.createElement('span');
      badge.className = 'wm-email-folder-badge';
      badge.textContent = String(item.count);
      row.appendChild(badge);
    }

    nav.appendChild(row);
  }

  return nav;
}

// 열 헤더
function createColHeaders(): HTMLElement {
  const row = document.createElement('div');
  row.id = COL_HEADERS_ID;
  row.className = 'wm-email-col-headers';

  const headers = ['보낸 사람', '제목', '받은 날짜'];
  const widths = [160, 0, 130]; // 0이면 flex

  for (let i = 0; i < headers.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'wm-email-col-header';
    if (widths[i] > 0) {
      cell.style.cssText = `width:${widths[i]}px !important; min-width:${widths[i]}px !important; flex:none !important;`;
    } else {
      cell.style.cssText = 'flex:1 !important;';
    }
    cell.textContent = headers[i];
    row.appendChild(cell);
  }

  return row;
}

// 메일 미리보기 목록
function createMailList(): HTMLElement {
  const list = document.createElement('div');
  list.id = MAIL_LIST_ID;
  list.className = 'wm-email-mail-list';

  const mails = [
    { sender: 'IT지원팀', subject: '[공지] 2월 정기 보안패치 안내', time: '14:30', unread: true },
    { sender: '경영지원팀', subject: 'RE: 견적서 수정본 첨부드립니다', time: '13:15', unread: false },
    { sender: '경영지원팀', subject: '2월 법인카드 사용내역 확인 요청', time: '11:42', unread: true },
    { sender: '인사팀', subject: 'FW: 거래처 미팅 일정 변경', time: '어제', unread: false },
    { sender: 'no-reply@workplus.co.kr', subject: '비밀번호 변경 완료 알림', time: '어제', unread: false },
    { sender: '인사팀', subject: '2025년 상반기 교육일정 안내', time: '2/17', unread: false },
  ];

  for (let i = 0; i < mails.length; i++) {
    const mail = mails[i];
    const item = document.createElement('div');
    item.className = 'wm-email-mail-item';
    if (mail.unread) item.classList.add('wm-email-mail-unread');
    if (i === 0) item.classList.add('wm-email-mail-selected');

    const line1 = document.createElement('div');
    line1.className = 'wm-email-mail-line1';

    const sender = document.createElement('span');
    sender.className = 'wm-email-mail-sender';
    sender.textContent = mail.sender;

    const time = document.createElement('span');
    time.className = 'wm-email-mail-time';
    time.textContent = mail.time;

    line1.appendChild(sender);
    line1.appendChild(time);

    const subject = document.createElement('div');
    subject.className = 'wm-email-mail-subject';
    subject.textContent = mail.subject;

    item.appendChild(line1);
    item.appendChild(subject);
    list.appendChild(item);
  }

  return list;
}

// 하단 메일 수
function createFooter(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = FOOTER_ID;
  bar.className = 'wm-email-footer';

  const text = document.createElement('span');
  text.className = 'wm-email-footer-text';
  text.textContent = '1-50 / 128개 메일';
  bar.appendChild(text);

  return bar;
}

// 적용 / 해제

const ALL_IDS = [TOPBAR_ID, TOOLBAR_ID, SIDEMENU_ID, COL_HEADERS_ID, MAIL_LIST_ID, FOOTER_ID] as const;

const CREATORS: Record<string, () => HTMLElement> = {
  [TOPBAR_ID]: createTopbar,
  [TOOLBAR_ID]: createToolbar,
  [SIDEMENU_ID]: createSidemenu,
  [COL_HEADERS_ID]: createColHeaders,
  [MAIL_LIST_ID]: createMailList,
  [FOOTER_ID]: createFooter,
};

export function applyEmailOverlay(): void {
  if (applied) return;
  applied = true;

  for (const id of ALL_IDS) {
    document.documentElement.appendChild(CREATORS[id]());
  }
}

export function removeEmailOverlay(): void {
  if (!applied) return;
  applied = false;

  for (const id of ALL_IDS) {
    document.getElementById(id)?.remove();
  }
}

export function ensureEmailOverlay(): void {
  if (!applied) return;
  for (const id of ALL_IDS) {
    if (!document.getElementById(id)) {
      document.documentElement.appendChild(CREATORS[id]());
    }
  }
}
