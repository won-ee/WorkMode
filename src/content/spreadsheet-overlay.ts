// 스프레드시트 테마 오버레이
// 메뉴바 + 열 헤더 + 시트탐색 + 행 번호 + 시트 탭

const MENUBAR_ID = 'wm-menubar';
const COL_HEADERS_ID = 'wm-col-headers';
const SHEETNAV_ID = 'wm-sheet-nav';
const ROW_NUMBERS_ID = 'wm-row-numbers';
const SHEET_TABS_ID = 'wm-sheet-tabs';
const ROW_COUNT = 50;
const COL_COUNT = 26; // A~Z

let applied = false;

function colName(index: number): string {
  return String.fromCharCode(65 + index);
}

// 상단 메뉴바
function createMenubar(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = MENUBAR_ID;
  bar.className = 'wm-menubar';

  const menuRow = document.createElement('div');
  menuRow.className = 'wm-menubar-row';
  const menus = ['파일', '편집', '보기', '삽입', '서식', '데이터', '도구', '확장 프로그램', '도움말'];
  for (const label of menus) {
    const item = document.createElement('span');
    item.className = 'wm-menu-item';
    item.textContent = label;
    menuRow.appendChild(item);
  }
  bar.appendChild(menuRow);

  const formulaRow = document.createElement('div');
  formulaRow.className = 'wm-formula-row';

  const cellAddr = document.createElement('span');
  cellAddr.className = 'wm-cell-addr';
  cellAddr.textContent = 'D7';

  const fx = document.createElement('span');
  fx.className = 'wm-fx-label';
  fx.textContent = 'fx';

  const formulaInput = document.createElement('span');
  formulaInput.className = 'wm-formula-input';
  formulaInput.textContent = '=VLOOKUP(B2,시트2!A:D,3,FALSE)';

  formulaRow.appendChild(cellAddr);
  formulaRow.appendChild(fx);
  formulaRow.appendChild(formulaInput);
  bar.appendChild(formulaRow);

  return bar;
}

// 열 헤더 (A, B, C ...)
function createColumnHeaders(): HTMLElement {
  const row = document.createElement('div');
  row.id = COL_HEADERS_ID;
  row.className = 'wm-col-headers';

  for (let i = 0; i < COL_COUNT; i++) {
    const cell = document.createElement('div');
    cell.className = 'wm-col-header';
    if (i === 3) cell.classList.add('wm-col-header-selected'); // D열 선택됨
    cell.textContent = colName(i);
    row.appendChild(cell);
  }

  return row;
}

// 좌측 시트 탐색 패널
function createSheetNav(): HTMLElement {
  const nav = document.createElement('div');
  nav.id = SHEETNAV_ID;
  nav.className = 'wm-sheet-nav';

  const header = document.createElement('div');
  header.className = 'wm-sheet-nav-header';
  header.textContent = '내 드라이브';
  nav.appendChild(header);

  const files = [
    { name: '2025_예산계획_v3', active: true },
    { name: 'Q1_매출분석' },
    { name: '인원현황' },
    { name: '프로젝트일정' },
    { name: '거래처목록' },
    { name: '재고관리_0201' },
  ];

  for (const file of files) {
    const row = document.createElement('div');
    row.className = 'wm-sheet-nav-item';
    if (file.active) row.classList.add('wm-sheet-nav-active');

    const icon = document.createElement('span');
    icon.className = 'wm-sheet-nav-icon';
    icon.textContent = '☷';

    const label = document.createElement('span');
    label.className = 'wm-sheet-nav-label';
    label.textContent = file.name;

    row.appendChild(icon);
    row.appendChild(label);
    nav.appendChild(row);
  }

  // 저장소 사용량
  const storage = document.createElement('div');
  storage.className = 'wm-sheet-storage';

  const storageText = document.createElement('div');
  storageText.className = 'wm-sheet-storage-text';
  storageText.textContent = '15.2GB / 30GB 사용 중';

  const barWrap = document.createElement('div');
  barWrap.className = 'wm-sheet-storage-bar';
  const barFill = document.createElement('div');
  barFill.className = 'wm-sheet-storage-fill';
  barWrap.appendChild(barFill);

  storage.appendChild(storageText);
  storage.appendChild(barWrap);
  nav.appendChild(storage);

  return nav;
}

// 행 번호
function createRowNumbers(): HTMLElement {
  const col = document.createElement('div');
  col.id = ROW_NUMBERS_ID;
  col.className = 'wm-row-numbers';

  for (let i = 1; i <= ROW_COUNT; i++) {
    const cell = document.createElement('div');
    cell.className = 'wm-row-num';
    cell.textContent = String(i);
    col.appendChild(cell);
  }

  return col;
}

// 하단 시트 탭
function createSheetTabs(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = SHEET_TABS_ID;
  bar.className = 'wm-sheet-tabs';

  const tabs = ['Sheet1', 'Sheet2', 'Sheet3'];
  for (let i = 0; i < tabs.length; i++) {
    const tab = document.createElement('span');
    tab.className = 'wm-sheet-tab';
    if (i === 0) tab.classList.add('wm-sheet-tab-active');
    tab.textContent = tabs[i];
    bar.appendChild(tab);
  }

  const addBtn = document.createElement('span');
  addBtn.className = 'wm-sheet-tab wm-sheet-tab-add';
  addBtn.textContent = '+';
  bar.appendChild(addBtn);

  return bar;
}

// 적용 / 해제

const ALL_IDS = [MENUBAR_ID, COL_HEADERS_ID, SHEETNAV_ID, ROW_NUMBERS_ID, SHEET_TABS_ID] as const;

const CREATORS: Record<string, () => HTMLElement> = {
  [MENUBAR_ID]: createMenubar,
  [COL_HEADERS_ID]: createColumnHeaders,
  [SHEETNAV_ID]: createSheetNav,
  [ROW_NUMBERS_ID]: createRowNumbers,
  [SHEET_TABS_ID]: createSheetTabs,
};

export function applySpreadsheetOverlay(): void {
  if (applied) return;
  applied = true;

  for (const id of ALL_IDS) {
    document.documentElement.appendChild(CREATORS[id]());
  }
}

export function removeSpreadsheetOverlay(): void {
  if (!applied) return;
  applied = false;

  for (const id of ALL_IDS) {
    document.getElementById(id)?.remove();
  }
}

export function ensureSpreadsheetOverlay(): void {
  if (!applied) return;
  for (const id of ALL_IDS) {
    if (!document.getElementById(id)) {
      document.documentElement.appendChild(CREATORS[id]());
    }
  }
}
