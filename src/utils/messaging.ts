// 메시지 전송 유틸

import type { MsgType, MsgPayloadMap, Message } from './constants';

// 메시지 객체 만들어주는 헬퍼
function buildMessage<T extends MsgType>(
  type: T,
  ...args: MsgPayloadMap[T] extends undefined ? [] : [MsgPayloadMap[T]]
): Message<T> {
  if (args.length === 0) return { type } as Message<T>;
  return { type, payload: args[0] } as Message<T>;
}

// background로 메시지 보내기
export async function sendToBackground<T extends MsgType>(
  type: T,
  ...args: MsgPayloadMap[T] extends undefined ? [] : [MsgPayloadMap[T]]
): Promise<unknown> {
  return chrome.runtime.sendMessage(buildMessage(type, ...args));
}

// 특정 탭으로 메시지 보내기
export async function sendToTab<T extends MsgType>(
  tabId: number,
  type: T,
  ...args: MsgPayloadMap[T] extends undefined ? [] : [MsgPayloadMap[T]]
): Promise<unknown> {
  try {
    return await chrome.tabs.sendMessage(tabId, buildMessage(type, ...args));
  } catch {
    // content script가 아직 안 들어간 탭이면 에러남
    console.warn(`[WorkMode] tab ${tabId}에 메시지 전송 실패`);
  }
}

// 모든 탭에 브로드캐스트
export async function broadcast<T extends MsgType>(
  type: T,
  ...args: MsgPayloadMap[T] extends undefined ? [] : [MsgPayloadMap[T]]
): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const msg = buildMessage(type, ...args);
  for (const tab of tabs) {
    if (tab.id == null) continue;
    chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
  }
}
