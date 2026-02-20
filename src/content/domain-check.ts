// 도메인 화이트리스트 체크

import type { WorkModeState } from '../utils/constants';

// 제외된 도메인이면 true 리턴
export function isDomainExcluded(state: WorkModeState): boolean {
  const host = location.hostname;
  return state.excludedDomains.some(
    (domain) => host === domain || host.endsWith('.' + domain),
  );
}
