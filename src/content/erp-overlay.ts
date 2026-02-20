// ERP 테마 오버레이
// 상단 바 + 필터 + 사이드 메뉴 + 열 헤더 + 행 번호 + 하단 탭 + 테이블 헤더

const TOPBAR_ID = 'wm-erp-topbar';
const FILTERBAR_ID = 'wm-erp-filterbar';
const SIDEMENU_ID = 'wm-erp-sidemenu';
const COL_HEADERS_ID = 'wm-erp-col-headers';
const ROW_NUMBERS_ID = 'wm-erp-row-numbers';
const TABS_ID = 'wm-erp-tabs';
const TABLE_HEADER_ID = 'wm-erp-table-header';
const ROW_COUNT = 50;

let applied = false;

// 상단 바
function createTopbar(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = TOPBAR_ID;
  bar.className = 'wm-erp-topbar';

  const logo = document.createElement('span');
  logo.className = 'wm-erp-logo';
  logo.textContent = 'Smart HR';

  const sep = document.createElement('span');
  sep.className = 'wm-erp-sep';
  sep.textContent = '|';

  const breadcrumb = document.createElement('span');
  breadcrumb.className = 'wm-erp-breadcrumb';
  breadcrumb.textContent = '인사관리 > 근태관리 > 출퇴근현황';

  bar.appendChild(logo);
  bar.appendChild(sep);
  bar.appendChild(breadcrumb);
  return bar;
}

// 필터 바
function createFilterbar(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = FILTERBAR_ID;
  bar.className = 'wm-erp-filterbar';

  const label = document.createElement('span');
  label.className = 'wm-erp-filter-label';
  label.textContent = '검색조건:';

  const dept = document.createElement('span');
  dept.className = 'wm-erp-filter-label';
  dept.textContent = '부서';

  const deptSel = document.createElement('span');
  deptSel.className = 'wm-erp-filter-select';
  deptSel.textContent = '경영지원팀 ▼';

  const period = document.createElement('span');
  period.className = 'wm-erp-filter-label';
  period.textContent = '기간';

  const periodSel = document.createElement('span');
  periodSel.className = 'wm-erp-filter-select';
  periodSel.textContent = '2025.01.01 ~ 2025.02.19';

  const btn = document.createElement('span');
  btn.className = 'wm-erp-filter-btn';
  btn.textContent = '조회';

  bar.appendChild(label);
  bar.appendChild(dept);
  bar.appendChild(deptSel);
  bar.appendChild(period);
  bar.appendChild(periodSel);
  bar.appendChild(btn);

  return bar;
}

// 좌측 트리 메뉴
type MenuItem = {
  label: string;
  active?: boolean;
  badge?: string;
  badgeColor?: 'red' | 'blue';
  children?: { label: string; badge?: string; badgeColor?: 'red' | 'blue'; active?: boolean }[];
};

function createSidemenu(): HTMLElement {
  const nav = document.createElement('div');
  nav.id = SIDEMENU_ID;
  nav.className = 'wm-erp-sidemenu';

  const items: MenuItem[] = [
    { label: '조직관리' },
    {
      label: '인사관리',
      active: true,
      children: [
        { label: '근태관리', active: true },
        { label: '인사발령' },
        { label: '인사평가' },
        { label: '직원조회' },
        { label: '증명서발급' },
      ],
    },
    {
      label: '급여관리',
      children: [
        { label: '급여명세서' },
        { label: '연말정산' },
      ],
    },
    { label: '회계관리' },
    {
      label: '전자결재',
      children: [
        { label: '결재대기', badge: '3', badgeColor: 'red' },
        { label: '결재완료' },
      ],
    },
    { label: '게시판', badge: 'NEW', badgeColor: 'blue' },
    { label: '공지사항' },
  ];

  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'wm-erp-menu-item';
    if (item.active) row.classList.add('wm-erp-menu-open');

    const arrow = document.createElement('span');
    arrow.className = 'wm-erp-menu-arrow';
    arrow.textContent = item.children ? (item.active ? '▾' : '▸') : ' ';

    const label = document.createElement('span');
    label.textContent = item.label;

    row.appendChild(arrow);
    row.appendChild(label);

    // 부모 메뉴에도 뱃지 붙일 수 있음
    if (item.badge) {
      const badge = document.createElement('span');
      badge.className = 'wm-erp-menu-badge';
      if (item.badgeColor === 'red') badge.classList.add('wm-erp-menu-badge-red');
      if (item.badgeColor === 'blue') badge.classList.add('wm-erp-menu-badge-blue');
      badge.textContent = item.badge;
      badge.style.cssText = 'margin-left:auto !important;';
      row.appendChild(badge);
    }

    nav.appendChild(row);

    // 하위 메뉴 펼치기
    if (item.children && item.active) {
      for (const child of item.children) {
        const sub = document.createElement('div');
        sub.className = 'wm-erp-menu-sub';
        if (child.active) sub.classList.add('wm-erp-menu-active');

        const subLabel = document.createElement('span');
        subLabel.textContent = child.label;
        sub.appendChild(subLabel);

        if (child.badge) {
          const badge = document.createElement('span');
          badge.className = 'wm-erp-menu-badge';
          if (child.badgeColor === 'red') badge.classList.add('wm-erp-menu-badge-red');
          if (child.badgeColor === 'blue') badge.classList.add('wm-erp-menu-badge-blue');
          badge.textContent = child.badge;
          sub.appendChild(badge);
        }

        nav.appendChild(sub);
      }
    }
  }

  return nav;
}

// 열 헤더
function createColHeaders(): HTMLElement {
  const row = document.createElement('div');
  row.id = COL_HEADERS_ID;
  row.className = 'wm-erp-col-headers';

  const headers = ['No.', '사번', '이름', '부서', '직급', '출근', '퇴근', '상태'];
  const widths = [40, 90, 80, 100, 80, 110, 110, 80];

  for (let i = 0; i < headers.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'wm-erp-col-header';
    cell.style.cssText = `width:${widths[i]}px !important; min-width:${widths[i]}px !important;`;
    cell.textContent = headers[i];
    row.appendChild(cell);
  }

  return row;
}

// 행 번호
function createRowNumbers(): HTMLElement {
  const col = document.createElement('div');
  col.id = ROW_NUMBERS_ID;
  col.className = 'wm-erp-row-numbers';

  for (let i = 1; i <= ROW_COUNT; i++) {
    const cell = document.createElement('div');
    cell.className = 'wm-erp-row-num';
    cell.textContent = String(i);
    col.appendChild(cell);
  }

  return col;
}

// 하단 탭 + 페이지네이션
function createTabs(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = TABS_ID;
  bar.className = 'wm-erp-tabs';

  const tabs = ['근태현황', '연차관리', '초과근무'];
  for (let i = 0; i < tabs.length; i++) {
    const tab = document.createElement('span');
    tab.className = 'wm-erp-tab';
    if (i === 0) tab.classList.add('wm-erp-tab-active');
    tab.textContent = tabs[i];
    bar.appendChild(tab);
  }

  const pagination = document.createElement('span');
  pagination.className = 'wm-erp-pagination';

  const info = document.createElement('span');
  info.className = 'wm-erp-page-info';
  info.textContent = '총 142건 | 1/15 페이지 | ';
  pagination.appendChild(info);

  const prev = document.createElement('span');
  prev.className = 'wm-erp-page-arrow';
  prev.textContent = '◀';
  pagination.appendChild(prev);

  for (let i = 1; i <= 5; i++) {
    const num = document.createElement('span');
    num.className = 'wm-erp-page-num';
    if (i === 1) num.classList.add('wm-erp-page-active');
    num.textContent = String(i);
    pagination.appendChild(num);
  }

  const next = document.createElement('span');
  next.className = 'wm-erp-page-arrow';
  next.textContent = '▶';
  pagination.appendChild(next);

  bar.appendChild(pagination);

  return bar;
}

// 가짜 테이블 헤더 (콘텐츠 위에 살짝 깔림)
function createTableHeader(): HTMLElement {
  const row = document.createElement('div');
  row.id = TABLE_HEADER_ID;
  row.className = 'wm-erp-table-header';

  const headers = ['번호', '제목', '작성자', '작성일', '결재상태'];
  const widths = [60, 0, 80, 100, 80]; // 0이면 flex

  for (let i = 0; i < headers.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'wm-erp-table-header-cell';
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

// 적용 / 해제

const ALL_IDS = [TOPBAR_ID, FILTERBAR_ID, SIDEMENU_ID, COL_HEADERS_ID, ROW_NUMBERS_ID, TABS_ID, TABLE_HEADER_ID] as const;

const CREATORS: Record<string, () => HTMLElement> = {
  [TOPBAR_ID]: createTopbar,
  [FILTERBAR_ID]: createFilterbar,
  [SIDEMENU_ID]: createSidemenu,
  [COL_HEADERS_ID]: createColHeaders,
  [ROW_NUMBERS_ID]: createRowNumbers,
  [TABS_ID]: createTabs,
  [TABLE_HEADER_ID]: createTableHeader,
};

export function applyErpOverlay(): void {
  if (applied) return;
  applied = true;

  for (const id of ALL_IDS) {
    document.documentElement.appendChild(CREATORS[id]());
  }
}

export function removeErpOverlay(): void {
  if (!applied) return;
  applied = false;

  for (const id of ALL_IDS) {
    document.getElementById(id)?.remove();
  }
}

export function ensureErpOverlay(): void {
  if (!applied) return;
  for (const id of ALL_IDS) {
    if (!document.getElementById(id)) {
      document.documentElement.appendChild(CREATORS[id]());
    }
  }
}
