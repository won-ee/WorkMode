// 이미지/동영상 숨기기
// CSS가 먼저 숨기고, JS가 못 잡는 것까지 강제 처리

// wm- 요소인지 체크
function isWmElement(el: Element): boolean {
  const cls = el.getAttribute('class');
  if (cls && cls.includes('wm-')) return true;
  const id = el.getAttribute('id');
  if (id && id.startsWith('wm-')) return true;
  return false;
}

function getOriginalSize(el: HTMLElement): { w: number; h: number } {
  const attrW = parseInt(el.getAttribute('width') || '', 10);
  const attrH = parseInt(el.getAttribute('height') || '', 10);
  if (attrW > 0 && attrH > 0) return { w: attrW, h: attrH };

  if (el instanceof HTMLImageElement && el.naturalWidth > 0) {
    return { w: el.naturalWidth, h: el.naturalHeight };
  }

  const sw = parseInt(el.style.width, 10);
  const sh = parseInt(el.style.height, 10);
  if (sw > 0 && sh > 0) return { w: sw, h: sh };

  return { w: 200, h: 120 };
}

// 이미지 숨기기

// img wrapper (alt 텍스트 표시용)
function wrapImage(img: HTMLImageElement): void {
  if (img.closest('.wm-img-wrap')) return;
  if (!img.parentNode) return;

  const wrapper = document.createElement('span');
  wrapper.className = 'wm-img-wrap';

  img.parentNode.insertBefore(wrapper, img);
  wrapper.appendChild(img);
}

function unwrapImage(wrapper: HTMLElement): void {
  const img = wrapper.querySelector('img');
  if (!img || !wrapper.parentNode) return;
  wrapper.parentNode.insertBefore(img, wrapper);
  wrapper.remove();
}

export function applyImageOverlays(): void {
  document.querySelectorAll<HTMLImageElement>(
    'img:not(.wm-img-wrap img)',
  ).forEach(wrapImage);
}

export function removeImageOverlays(): void {
  document.querySelectorAll<HTMLElement>('.wm-img-wrap').forEach(unwrapImage);
}

// background-image JS로 강제 제거
export function removeAllBackgroundImages(): void {
  const els = document.body?.querySelectorAll('*');
  if (!els) return;

  for (const el of els) {
    if (!(el instanceof HTMLElement)) continue;
    if (isWmElement(el)) continue;
    if (el === document.body) continue;
    if (el.dataset.wmBgHidden) continue;

    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg !== 'none') {
      el.dataset.wmBgHidden = '1';
      el.style.setProperty('background-image', 'none', 'important');
    }
  }
}

export function restoreBackgroundImages(): void {
  document.querySelectorAll<HTMLElement>('[data-wm-bg-hidden]').forEach((el) => {
    el.style.removeProperty('background-image');
    delete el.dataset.wmBgHidden;
  });
}

// img src를 투명 1px로 바꿔서 깨진 아이콘 안 보이게
const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export function blankImageSources(): void {
  document.querySelectorAll<HTMLImageElement>(
    'img:not([class*="wm-"])',
  ).forEach((img) => {
    if (isWmElement(img)) return;
    if (img.dataset.wmOrigSrc != null) return;

    img.dataset.wmOrigSrc = img.src || '';
    img.dataset.wmOrigSrcset = img.srcset || '';
    img.src = TRANSPARENT_PIXEL;
    img.srcset = '';
  });
}

export function restoreImageSources(): void {
  document.querySelectorAll<HTMLImageElement>(
    'img[data-wm-orig-src]',
  ).forEach((img) => {
    const src = img.dataset.wmOrigSrc;
    if (src != null) img.src = src;
    delete img.dataset.wmOrigSrc;

    const srcset = img.dataset.wmOrigSrcset;
    if (srcset != null) img.srcset = srcset;
    delete img.dataset.wmOrigSrcset;
  });
}

// 동영상 숨기기

const VIDEO_SELECTORS = [
  'video', 'embed', 'object',
  'iframe[src*="youtube"]', 'iframe[src*="youtu.be"]',
  'iframe[src*="twitch"]', 'iframe[src*="vimeo"]',
  'iframe[src*="dailymotion"]', 'iframe[src*="tiktok"]',
  'iframe[src*="chzzk"]', 'iframe[src*="afreeca"]',
  '[data-src*="youtube"]', '[data-src*="youtu.be"]',
].join(',');

// video/iframe wrapper
function wrapVideo(el: HTMLElement): void {
  if (el.closest('.wm-vid-wrap')) return;
  if (!el.parentNode) return;

  const { w, h } = getOriginalSize(el);

  const wrapper = document.createElement('div');
  wrapper.className = 'wm-vid-wrap';
  wrapper.style.width = w + 'px';
  wrapper.style.height = h + 'px';

  const overlay = document.createElement('div');
  overlay.className = 'wm-overlay';
  overlay.textContent = '회의 녹화 로딩 중...';

  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);
  wrapper.appendChild(overlay);
}

function unwrapVideo(wrapper: HTMLElement): void {
  const el = wrapper.querySelector('video, iframe');
  if (!el || !wrapper.parentNode) return;
  wrapper.parentNode.insertBefore(el, wrapper);
  wrapper.remove();
}

export function applyVideoOverlays(): void {
  document.querySelectorAll<HTMLElement>('video').forEach(wrapVideo);
  document.querySelectorAll<HTMLElement>(
    'iframe[src*="youtube"], iframe[src*="youtu.be"], iframe[src*="vimeo"], iframe[src*="dailymotion"], iframe[src*="twitch"], iframe[src*="tiktok"]',
  ).forEach(wrapVideo);
}

export function removeVideoOverlays(): void {
  document.querySelectorAll<HTMLElement>('.wm-vid-wrap').forEach(unwrapVideo);
}

// CSS로 안 잡히는 동적 요소 JS로 강제 숨김
export function forceHideVideos(): void {
  document.querySelectorAll<HTMLElement>(VIDEO_SELECTORS).forEach((el) => {
    if (isWmElement(el)) return;
    const wmAnc = el.closest('[class*="wm-"], [id^="wm-"]');
    if (wmAnc && wmAnc !== document.documentElement) return;
    if (el.dataset.wmVidHidden) return;

    el.dataset.wmVidHidden = '1';
    el.style.setProperty('display', 'none', 'important');
  });
}

export function restoreVideos(): void {
  document.querySelectorAll<HTMLElement>('[data-wm-vid-hidden]').forEach((el) => {
    el.style.removeProperty('display');
    delete el.dataset.wmVidHidden;
  });
}
