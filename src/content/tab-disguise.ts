// 탭 제목 + 파비콘 위장

import type { WorkModeState } from '../utils/constants';

const LOG = '[WM]';

const DISGUISE_TITLES: Record<WorkModeState['theme'], string[]> = {
  spreadsheet: [
    '2025년 Q1 매출분석.xlsx - Google Sheets',
    '2025_예산계획_v3.xlsx - Google Sheets',
    '월별 KPI 대시보드.xlsx - Google Sheets',
  ],
  erp: [
    '근태관리 - Smart HR',
    '인사관리 - Smart HR',
    '출퇴근현황 - Smart HR',
  ],
  email: [
    '받은편지함 (3) - Outlook',
    'RE: 주간업무보고 - Outlook',
    '회의록 검토 요청 - Outlook',
  ],
  minimal: [
    '제목 없는 문서 - Google Docs',
    '회의록 정리 - Google Docs',
    '업무 메모 - Google Docs',
  ],
};

// SVG 파비콘 만드는 함수
function makeSvgFavicon(bg: string, letter: string): string {
  return 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">` +
    `<rect width="16" height="16" rx="3" fill="${bg}"/>` +
    `<text x="8" y="12" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#fff">${letter}</text>` +
    `</svg>`
  );
}

const DISGUISE_FAVICONS: Record<WorkModeState['theme'], string> = {
  spreadsheet: makeSvgFavicon('#217346', 'X'),
  erp:         makeSvgFavicon('#1B3A5C', 'H'),
  email:       makeSvgFavicon('#0078D4', 'M'),
  minimal:     makeSvgFavicon('#4285F4', 'D'),
};

// 파비콘 셀렉터들
const FAVICON_SELECTOR = 'link[rel*="icon"]';
const OUR_FAVICON_SELECTOR = 'link[data-wm]';
const ALIEN_FAVICON_SELECTOR = 'link[rel*="icon"]:not([data-wm])';

// 상태 변수들
let originalTitle = '';
let lastSiteTitle = '';
let originalFavicons: HTMLLinkElement[] = [];
let disguised = false;
let currentTheme: WorkModeState['theme'] | null = null;
let fakeTitle = '';
let currentFavicon = '';
let headObserver: MutationObserver | null = null;
let titleObserver: MutationObserver | null = null;
let isApplyingFavicon = false;
let isApplyingTitle = false;

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// title 방어

// <title> 태그 텍스트를 우리 타이틀로 강제 설정
function forceTitleElement(): void {
  if (!fakeTitle) return;
  isApplyingTitle = true;
  try {
    const titleEl = document.querySelector('title');
    if (titleEl && titleEl.textContent !== fakeTitle) {
      titleEl.textContent = fakeTitle;
    }
  } finally {
    isApplyingTitle = false;
  }
}

// <title> 태그 감시 — 사이트가 바꾸면 바로 덮어쓰기
function watchTitleElement(el: HTMLTitleElement): void {
  titleObserver?.disconnect();

  titleObserver = new MutationObserver(() => {
    if (isApplyingTitle || !disguised) return;
    if (el.textContent !== fakeTitle) {
      console.log(LOG, 'title 변경 감지, 덮어쓰기:', el.textContent?.substring(0, 30));
      lastSiteTitle = el.textContent || '';
      forceTitleElement();
    }
  });

  titleObserver.observe(el, {
    childList: true,
    characterData: true,
    subtree: true,
  });
}

// <title> 태그 찾아서 감시 시작
function startTitleDefense(): void {
  const titleEl = document.querySelector('title');
  if (titleEl) {
    forceTitleElement();
    watchTitleElement(titleEl as HTMLTitleElement);
    return;
  }
  // title 아직 없으면 headObserver에서 처리함
}

function stopTitleDefense(): void {
  titleObserver?.disconnect();
  titleObserver = null;
}

// favicon 방어

function insertOurFavicon(): void {
  if (!document.head) return;
  try {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = currentFavicon;
    link.setAttribute('data-wm', '');
    document.head.appendChild(link);
  } catch (e) {
    console.error(LOG, 'favicon 삽입 에러:', e);
  }
}

function enforceOurFavicon(): void {
  if (isApplyingFavicon) return;
  isApplyingFavicon = true;
  try {
    // 사이트꺼 지우기
    const aliens = document.querySelectorAll<HTMLLinkElement>(ALIEN_FAVICON_SELECTOR);
    aliens.forEach((el) => el.remove());

    // 우리꺼 없으면 넣고, href 다르면 갱신
    const ours = document.querySelector<HTMLLinkElement>(OUR_FAVICON_SELECTOR);
    if (!ours) {
      insertOurFavicon();
    } else if (ours.href !== currentFavicon) {
      ours.href = currentFavicon;
    }
  } finally {
    isApplyingFavicon = false;
  }
}

// head observer (favicon + title 통합 감시)

function startHeadObserver(): void {
  if (headObserver) return;

  headObserver = new MutationObserver((mutations) => {
    let faviconDirty = false;

    for (const m of mutations) {
      for (const node of m.addedNodes) {
        // 새 <link> 들어오면 favicon 체크
        if (node instanceof HTMLLinkElement && !node.hasAttribute('data-wm')) {
          faviconDirty = true;
        }
        // 새 <title> 생기면 바로 덮어쓰기
        if (node instanceof HTMLTitleElement) {
          console.log(LOG, '새 <title> 태그 감지');
          forceTitleElement();
          watchTitleElement(node);
        }
      }

      // link 속성 변경 감지
      if (m.type === 'attributes' && m.target instanceof HTMLLinkElement) {
        const link = m.target;
        if (!link.hasAttribute('data-wm') && link.rel && link.rel.includes('icon')) {
          faviconDirty = true;
        }
      }
    }

    if (faviconDirty) {
      enforceOurFavicon();
    }
  });

  const tryObserve = () => {
    if (document.head) {
      headObserver!.observe(document.head, {
        childList: true,
        attributes: true,
        attributeFilter: ['rel', 'href', 'type'],
        subtree: true,
      });
    } else {
      // head 아직 없으면 생길 때까지 기다림
      const docObserver = new MutationObserver(() => {
        if (document.head) {
          docObserver.disconnect();
          headObserver!.observe(document.head, {
            childList: true,
            attributes: true,
            attributeFilter: ['rel', 'href', 'type'],
            subtree: true,
          });
          enforceOurFavicon();
          startTitleDefense();
        }
      });
      docObserver.observe(document.documentElement, { childList: true });
    }
  };
  tryObserve();
}

function stopHeadObserver(): void {
  headObserver?.disconnect();
  headObserver = null;
}

// 외부에서 쓰는 함수들

export function applyDisguise(theme: WorkModeState['theme']): void {
  if (disguised && currentTheme === theme) return;
  if (disguised) removeDisguise();

  disguised = true;
  currentTheme = theme;
  currentFavicon = DISGUISE_FAVICONS[theme];

  // title 위장
  originalTitle = document.title;
  fakeTitle = pickRandom(DISGUISE_TITLES[theme]);

  // document.title 프로퍼티 오버라이드 (JS로 바꾸는거 방어)
  document.title = fakeTitle;
  Object.defineProperty(document, 'title', {
    configurable: true,
    get() { return fakeTitle; },
    set(v: string) { lastSiteTitle = v; },
  });

  // <title> 태그 직접 수정 + 감시 (React/Next.js 같은 거 방어)
  forceTitleElement();
  startTitleDefense();

  // favicon 위장
  originalFavicons = [];
  document.querySelectorAll<HTMLLinkElement>(FAVICON_SELECTOR).forEach((el) => {
    originalFavicons.push(el);
    el.remove();
  });
  insertOurFavicon();

  // head 감시 시작
  startHeadObserver();

  // 혹시 몰라서 나중에 한번 더 체크
  setTimeout(() => {
    if (!disguised) return;
    enforceOurFavicon();
    forceTitleElement();
  }, 1000);
  setTimeout(() => {
    if (!disguised) return;
    enforceOurFavicon();
    forceTitleElement();
  }, 3000);
}

export function removeDisguise(): void {
  if (!disguised) return;
  disguised = false;
  currentTheme = null;

  // 감시 먼저 끄기
  stopTitleDefense();
  stopHeadObserver();

  // title 복원
  delete (document as unknown as Record<string, unknown>)['title'];
  document.title = lastSiteTitle || originalTitle;
  lastSiteTitle = '';

  // favicon 복원
  document.querySelectorAll<HTMLLinkElement>(OUR_FAVICON_SELECTOR)
    .forEach((el) => el.remove());
  if (document.head) {
    originalFavicons.forEach((el) => document.head.appendChild(el));
  }
  originalFavicons = [];
}

export function enforceFavicon(): void {
  if (!disguised) return;
  enforceOurFavicon();
}
