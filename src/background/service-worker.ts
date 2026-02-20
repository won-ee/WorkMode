// background service worker

import { MSG, type Message } from '../utils/constants';
import { getState, setState } from '../utils/storage';
import { broadcast } from '../utils/messaging';

// 상태 바뀌면 모든 탭한테 알려주기
async function notifyAll(): Promise<void> {
  const state = await getState();
  await broadcast(MSG.STATE_CHANGED, state);
}

// 단축키 처리
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-workmode') {
    const state = await getState();
    await setState({ enabled: !state.enabled });
    await notifyAll();
  }

  if (command === 'boss-key') {
    const state = await getState();
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id != null) {
      await chrome.tabs.update(tab.id, { url: state.bossKeyUrl });
    }
  }
});

// popup이나 content script에서 오는 메시지 처리
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // 비동기 응답 쓰려면 true 리턴해야됨
});

async function handleMessage(message: Message): Promise<unknown> {
  switch (message.type) {
    case MSG.GET_STATE: {
      return getState();
    }

    case MSG.TOGGLE_WORKMODE: {
      const state = await getState();
      await setState({ enabled: !state.enabled });
      await notifyAll();
      return getState();
    }

    case MSG.TOGGLE_IMAGES: {
      const state = await getState();
      await setState({ hideImages: !state.hideImages });
      await notifyAll();
      return getState();
    }

    case MSG.TOGGLE_VIDEOS: {
      const state = await getState();
      await setState({ hideVideos: !state.hideVideos });
      await notifyAll();
      return getState();
    }

    case MSG.TOGGLE_EMOJIS: {
      const state = await getState();
      await setState({ hideEmojis: !state.hideEmojis });
      await notifyAll();
      return getState();
    }

    case MSG.TOGGLE_TAB: {
      const state = await getState();
      await setState({ hideTab: !state.hideTab });
      await notifyAll();
      return getState();
    }

    case MSG.SET_DOMAIN_EXCLUDED: {
      const { domain, excluded } = (message as Message<typeof MSG.SET_DOMAIN_EXCLUDED>).payload;
      const state = await getState();
      const domains = new Set(state.excludedDomains);
      if (excluded) {
        domains.add(domain);
      } else {
        domains.delete(domain);
      }
      await setState({ excludedDomains: [...domains] });
      await notifyAll();
      return getState();
    }

    case MSG.SET_THEME: {
      const { theme } = (message as Message<typeof MSG.SET_THEME>).payload;
      await setState({ theme });
      await notifyAll();
      return getState();
    }

    case MSG.SET_BOSS_KEY_URL: {
      const { url } = (message as Message<typeof MSG.SET_BOSS_KEY_URL>).payload;
      await setState({ bossKeyUrl: url });
      await notifyAll();
      return getState();
    }

    default:
      console.warn('[WorkMode] 모르는 메시지:', (message as Message).type);
      return null;
  }
}
