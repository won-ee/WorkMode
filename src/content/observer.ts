// MutationObserver로 SPA 동적 콘텐츠 대응

import type { WorkModeState } from '../utils/constants';

let domObserver: MutationObserver | null = null;
let domTimer: ReturnType<typeof setTimeout> | null = null;

const DEBOUNCE_MS = 200;

// html 클래스 방어용
let htmlObserver: MutationObserver | null = null;
let guardedClasses: string[] = [];

// 지금 지켜야 할 클래스 목록 세팅
function updateGuardedClasses(state: WorkModeState, excluded: boolean): void {
  const active = state.enabled && !excluded;
  guardedClasses = [];
  if (active) {
    guardedClasses.push('wm-active');
    if (state.hideImages) guardedClasses.push('wm-hide-images');
    if (state.hideVideos) guardedClasses.push('wm-hide-videos');
  }
}

// SPA가 html 클래스를 지워버리면 다시 붙여주기
function enforceHtmlClasses(): void {
  const root = document.documentElement;
  for (const cls of guardedClasses) {
    if (!root.classList.contains(cls)) {
      root.classList.add(cls);
    }
  }
}

function startHtmlObserver(): void {
  stopHtmlObserver();

  htmlObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName === 'class') {
        enforceHtmlClasses();
      }
    }
  });

  htmlObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}

function stopHtmlObserver(): void {
  if (htmlObserver) {
    htmlObserver.disconnect();
    htmlObserver = null;
  }
  guardedClasses = [];
}

// DOM 변경 감시 시작
export function startObserver(
  callback: () => void,
  state: WorkModeState,
  excluded: boolean,
): void {
  stopObserver();

  // DOM 변경 시 콜백 호출 (debounce)
  domObserver = new MutationObserver(() => {
    if (domTimer) clearTimeout(domTimer);
    domTimer = setTimeout(callback, DEBOUNCE_MS);
  });

  domObserver.observe(document.documentElement, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  // html 클래스 방어
  updateGuardedClasses(state, excluded);
  startHtmlObserver();
}

// 전부 정지
export function stopObserver(): void {
  if (domTimer) {
    clearTimeout(domTimer);
    domTimer = null;
  }
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }
  stopHtmlObserver();
}
