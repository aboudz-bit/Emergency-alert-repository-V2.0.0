let _historyIdCounter = 0;

export function nextHistoryId(): number {
  return Date.now() * 1000 + (++_historyIdCounter % 1000);
}
