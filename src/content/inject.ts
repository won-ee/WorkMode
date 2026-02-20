// content script 메인
// document_start에서 실행돼서 body가 아직 없을 수도 있음

import {
  STORAGE_KEY,
  DEFAULT_STATE,
  MSG,
  type WorkModeState,
  type Message,
} from '../utils/constants';
import { isDomainExcluded } from './domain-check';
import { applyDisguise, removeDisguise, enforceFavicon } from './tab-disguise';
import { startObserver, stopObserver } from './observer';
import {
  applyImageOverlays,
  removeImageOverlays,
  removeAllBackgroundImages,
  restoreBackgroundImages,
  blankImageSources,
  restoreImageSources,
  applyVideoOverlays,
  removeVideoOverlays,
  forceHideVideos,
  restoreVideos,
} from './media-hider';
import {
  applySpreadsheetOverlay,
  removeSpreadsheetOverlay,
  ensureSpreadsheetOverlay,
} from './spreadsheet-overlay';
import {
  applyErpOverlay,
  removeErpOverlay,
  ensureErpOverlay,
} from './erp-overlay';
import {
  applyEmailOverlay,
  removeEmailOverlay,
  ensureEmailOverlay,
} from './email-overlay';

let lastState: WorkModeState | null = null;

// 색상 무채색화 처리
// CSS !important 싸움 안 하려고 인라인 스타일로 덮어씀

const WM_NEUTRAL_ATTR = 'data-wm-neutralized';
const BORDER_PROPS = [
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
] as const;

// 유채색인지 체크 (투명이나 무채색이면 false)
function isChromatic(color: string): boolean {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return false;
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return false;
  const [r, g, b] = [+m[1], +m[2], +m[3]];
  if (r === g && g === b) return false;
  return true;
}

// 이미 괜찮은 배경색인지 (흰색, 투명 등)
function isSafeBg(color: string): boolean {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return true;
  if (color === 'rgb(255, 255, 255)') return true;
  if (color === 'rgb(248, 248, 248)') return true;
  if (color === 'rgb(243, 243, 243)') return true;
  if (color === 'rgb(240, 240, 240)') return true;
  return false;
}

function toCssName(prop: string): string {
  return prop.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
}

function neutralizeColors(): void {
  const els = document.body?.querySelectorAll('*');
  if (!els) return;

  for (const el of els) {
    if (!(el instanceof HTMLElement)) continue;
    const wmEl = el.closest('[class*="wm-"], [id^="wm-"]');
    if (wmEl && wmEl !== document.documentElement) continue;
    if (el.tagName === 'BODY' || el.tagName === 'HTML') continue;
    if (el.hasAttribute(WM_NEUTRAL_ATTR)) continue;

    const s = getComputedStyle(el);
    let touched = false;

    // border 색상 처리
    for (const prop of BORDER_PROPS) {
      if (isChromatic(s[prop])) {
        el.style.setProperty(toCssName(prop), '#d0d0d0', 'important');
        touched = true;
      }
    }

    // background-color 투명으로 바꿔서 격자 배경 보이게
    if (!isSafeBg(s.backgroundColor)) {
      el.style.setProperty('background-color', 'transparent', 'important');
      touched = true;
    }

    // 텍스트 색상 유채색만 덮어씀
    if (isChromatic(s.color)) {
      el.style.setProperty('color', '#333', 'important');
      touched = true;
    }

    if (touched) el.setAttribute(WM_NEUTRAL_ATTR, '');
  }
}

function restoreColors(): void {
  document.querySelectorAll<HTMLElement>(
    `[${WM_NEUTRAL_ATTR}]`,
  ).forEach((el) => {
    for (const prop of BORDER_PROPS) {
      el.style.removeProperty(toCssName(prop));
    }
    el.style.removeProperty('background-color');
    el.style.removeProperty('color');
    el.removeAttribute(WM_NEUTRAL_ATTR);
  });
}

// 이모지 제거 (TreeWalker로 텍스트 노드만 건드림)

// 허용할 문자들 — 한글, 영문, 숫자, 일본어, 중국어, 기본 문장부호
const ALLOWED_CHAR = /[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s.,;:!?'"()\[\]{}\-_=+/@#$%^&*<>~`\\|₩€£¥°·…\n\r\t]/;

// WeakMap으로 원본 텍스트 저장 (노드 사라지면 자동으로 GC됨)
const emojiOriginals = new WeakMap<Text, string>();

function removeEmojis(): void {
  if (!document.body) return;
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
  );
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const wmAncestor = node.parentElement?.closest('[class*="wm-"], [id^="wm-"]');
    if (wmAncestor && wmAncestor !== document.documentElement) continue;
    const original = node.textContent!;
    const cleaned = [...original].filter((ch) => ALLOWED_CHAR.test(ch)).join('');
    if (cleaned !== original) {
      if (!emojiOriginals.has(node)) {
        emojiOriginals.set(node, original);
      }
      node.textContent = cleaned;
    }
  }
}

function restoreEmojis(): void {
  if (!document.body) return;
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
  );
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const original = emojiOriginals.get(node);
    if (original != null) {
      node.textContent = original;
      emojiOriginals.delete(node);
    }
  }
}

// Phase 1: DOM 렌더링 전에 클래스부터 바로 적용

function applyClassesImmediate(state: WorkModeState): void {
  const excluded = isDomainExcluded(state);
  const active = state.enabled && !excluded;
  const root = document.documentElement;
  root.classList.toggle('wm-active', active);
  root.classList.toggle('wm-hide-images', active && state.hideImages);
  root.classList.toggle('wm-hide-videos', active && state.hideVideos);
  root.classList.toggle('wm-theme-spreadsheet', active && state.theme === 'spreadsheet');
  root.classList.toggle('wm-theme-erp', active && state.theme === 'erp');
  root.classList.toggle('wm-theme-email', active && state.theme === 'email');
  root.classList.toggle('wm-theme-minimal', active && state.theme === 'minimal');
}

// Phase 0: FOUC 방지
// sessionStorage를 캐시로 써서 WorkMode ON일 때만 페이지 숨김
const _wmCached = sessionStorage.getItem('wm-enabled');
if (_wmCached === 'true') {
  document.documentElement.setAttribute('data-wm-loading', '');
}

chrome.storage.local.get(STORAGE_KEY).then((result) => {
  const saved = (result[STORAGE_KEY] ?? {}) as Partial<WorkModeState>;
  const state: WorkModeState = { ...DEFAULT_STATE, ...saved };
  lastState = state;
  // 다음 로드를 위해 캐시 갱신
  const excluded = isDomainExcluded(state);
  const active = state.enabled && !excluded;
  sessionStorage.setItem('wm-enabled', active ? 'true' : 'false');
  // 클래스 적용
  applyClassesImmediate(state);
  // loading 해제
  document.documentElement.removeAttribute('data-wm-loading');
  // body 로드되면 나머지 처리
  onReady(() => applyFull(state));
}).catch(() => {
  // storage 실패해도 페이지는 보여야 함
  document.documentElement.removeAttribute('data-wm-loading');
});

// Phase 2: body 로드 후 전체 적용

function onReady(fn: () => void): void {
  if (document.body) {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  }
}

function applyFull(state: WorkModeState): void {
  lastState = state;
  const excluded = isDomainExcluded(state);
  const active = state.enabled && !excluded;

  // 혹시 모르니 클래스 한번 더
  applyClassesImmediate(state);

  // 이미지 숨기기
  if (active && state.hideImages) {
    applyImageOverlays();
    removeAllBackgroundImages();
    blankImageSources();
  } else {
    removeImageOverlays();
    restoreBackgroundImages();
    restoreImageSources();
  }

  // 동영상 숨기기
  if (active && state.hideVideos) {
    applyVideoOverlays();
    forceHideVideos();
  } else {
    removeVideoOverlays();
    restoreVideos();
  }

  // 이모지 제거
  if (active && state.hideEmojis) {
    removeEmojis();
  } else {
    restoreEmojis();
  }

  // 색상 무채색화
  if (active) {
    neutralizeColors();
  } else {
    restoreColors();
  }

  // 테마 오버레이 (이전꺼 지우고 새로 적용)
  removeSpreadsheetOverlay();
  removeErpOverlay();
  removeEmailOverlay();
  if (active) {
    switch (state.theme) {
      case 'spreadsheet': applySpreadsheetOverlay(); break;
      case 'erp': applyErpOverlay(); break;
      case 'email': applyEmailOverlay(); break;
      case 'minimal': break;
    }
  }

  // 탭 위장 (hideTab 토글)
  if (active && state.hideTab) {
    applyDisguise(state.theme);
  } else {
    removeDisguise();
  }

  // observer (SPA 대응)
  if (active) {
    startObserver(
      () => {
        if (lastState?.hideTab) enforceFavicon();
        switch (lastState?.theme) {
          case 'spreadsheet': ensureSpreadsheetOverlay(); break;
          case 'erp': ensureErpOverlay(); break;
          case 'email': ensureEmailOverlay(); break;
          case 'minimal': break;
        }
        if (lastState?.hideEmojis) {
          removeEmojis();
        }
        neutralizeColors();
        if (lastState?.hideImages) {
          applyImageOverlays();
          removeAllBackgroundImages();
          blankImageSources();
        }
        if (lastState?.hideVideos) {
          applyVideoOverlays();
          forceHideVideos();
        }
      },
      state,
      excluded,
    );
  } else {
    stopObserver();
  }
}

// background에서 상태 변경 메시지 받으면 다시 적용
chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type === MSG.STATE_CHANGED) {
    const state = (message as Message<typeof MSG.STATE_CHANGED>).payload;
    applyClassesImmediate(state);
    onReady(() => applyFull(state));
  }
});
