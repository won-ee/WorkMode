// popup 로직

import { MSG, type WorkModeState } from '../utils/constants';
import { sendToBackground } from '../utils/messaging';

// DOM 요소들
const $enabled = document.getElementById('toggle-enabled') as HTMLInputElement;
const $images = document.getElementById('toggle-images') as HTMLInputElement;
const $videos = document.getElementById('toggle-videos') as HTMLInputElement;
const $emojis = document.getElementById('toggle-emojis') as HTMLInputElement;
const $tab = document.getElementById('toggle-tab') as HTMLInputElement;
const $theme = document.getElementById('select-theme') as HTMLSelectElement;
const $bossKey = document.getElementById('input-bosskey') as HTMLInputElement;
const $exclude = document.getElementById('btn-exclude') as HTMLButtonElement;
const $toggleWhitelist = document.getElementById('btn-toggle-whitelist') as HTMLElement;
const $whitelistCount = document.getElementById('whitelist-count') as HTMLSpanElement;
const $whitelistPanel = document.getElementById('whitelist-panel') as HTMLDivElement;
const $whitelistList = document.getElementById('whitelist-list') as HTMLDivElement;
const $whitelistEmpty = document.getElementById('whitelist-empty') as HTMLParagraphElement;

// UI 렌더링
function render(state: WorkModeState): void {
  document.body.classList.toggle('active', state.enabled);

  $enabled.checked = state.enabled;
  $images.checked = state.hideImages;
  $videos.checked = state.hideVideos;
  $emojis.checked = state.hideEmojis;
  $tab.checked = state.hideTab;
  $theme.value = state.theme;
  $bossKey.value = state.bossKeyUrl;

  getCurrentDomain().then((domain) => {
    if (!domain) return;
    const excluded = state.excludedDomains.includes(domain);
    $exclude.textContent = excluded
      ? '이 사이트에서 켜기'
      : '이 사이트에서 끄기';
  });

  renderWhitelist(state);
}

// 화이트리스트 렌더링
function renderWhitelist(state: WorkModeState): void {
  const domains = state.excludedDomains;
  $whitelistCount.textContent = String(domains.length);
  $whitelistList.innerHTML = '';

  if (domains.length === 0) {
    $whitelistEmpty.hidden = false;
  } else {
    $whitelistEmpty.hidden = true;
    for (const domain of domains) {
      const item = document.createElement('div');
      item.className = 'wm-excluded-item';

      const span = document.createElement('span');
      span.textContent = domain;

      const btn = document.createElement('button');
      btn.className = 'wm-excluded-remove';
      btn.innerHTML =
        '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      btn.addEventListener('click', () => removeDomain(domain));

      item.appendChild(span);
      item.appendChild(btn);
      $whitelistList.appendChild(item);
    }
  }
}

async function getCurrentDomain(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  try {
    return new URL(tab.url).hostname;
  } catch {
    return null;
  }
}

// 토글 이벤트들
$enabled.addEventListener('change', async () => {
  const state = (await sendToBackground(MSG.TOGGLE_WORKMODE)) as WorkModeState;
  render(state);
});

$images.addEventListener('change', async () => {
  const state = (await sendToBackground(MSG.TOGGLE_IMAGES)) as WorkModeState;
  render(state);
});

$videos.addEventListener('change', async () => {
  const state = (await sendToBackground(MSG.TOGGLE_VIDEOS)) as WorkModeState;
  render(state);
});

$emojis.addEventListener('change', async () => {
  const state = (await sendToBackground(MSG.TOGGLE_EMOJIS)) as WorkModeState;
  render(state);
});

$tab.addEventListener('change', async () => {
  const state = (await sendToBackground(MSG.TOGGLE_TAB)) as WorkModeState;
  render(state);
});

$theme.addEventListener('change', async () => {
  const state = (await sendToBackground(MSG.SET_THEME, {
    theme: $theme.value as WorkModeState['theme'],
  })) as WorkModeState;
  render(state);
});

$bossKey.addEventListener('change', async () => {
  const url = $bossKey.value.trim();
  if (!url) return;
  const state = (await sendToBackground(MSG.SET_BOSS_KEY_URL, {
    url,
  })) as WorkModeState;
  render(state);
});

$exclude.addEventListener('click', async () => {
  const domain = await getCurrentDomain();
  if (!domain) return;
  const current = (await sendToBackground(MSG.GET_STATE)) as WorkModeState;
  const excluded = !current.excludedDomains.includes(domain);
  const state = (await sendToBackground(MSG.SET_DOMAIN_EXCLUDED, {
    domain,
    excluded,
  })) as WorkModeState;
  render(state);
});

// 화이트리스트 패널 열기/닫기
$toggleWhitelist.addEventListener('click', () => {
  $toggleWhitelist.classList.toggle('open');
  $whitelistPanel.classList.toggle('open');
});

async function removeDomain(domain: string): Promise<void> {
  const state = (await sendToBackground(MSG.SET_DOMAIN_EXCLUDED, {
    domain,
    excluded: false,
  })) as WorkModeState;
  render(state);
}

// 초기 상태 로드
sendToBackground(MSG.GET_STATE).then((state) => {
  if (state) render(state as WorkModeState);
});
