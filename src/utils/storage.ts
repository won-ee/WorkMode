// chrome.storage 래퍼

import { STORAGE_KEY, DEFAULT_STATE, type WorkModeState } from './constants';

// 저장된 상태 가져오기
export async function getState(): Promise<WorkModeState> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const saved = (result[STORAGE_KEY] ?? {}) as Partial<WorkModeState>;
  return { ...DEFAULT_STATE, ...saved };
}

// 상태 업데이트
export async function setState(
  partial: Partial<WorkModeState>,
): Promise<WorkModeState> {
  const current = await getState();
  const next = { ...current, ...partial };
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}
