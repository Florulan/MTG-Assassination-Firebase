const KEY = 'mtg_assassin_app_code';

export function getAppCode(): string | null {
  return localStorage.getItem(KEY);
}

export function setAppCode(code: string) {
  localStorage.setItem(KEY, code.trim());
}

export function clearAppCode() {
  localStorage.removeItem(KEY);
}

export function isUnlocked(): boolean {
  const c = getAppCode();
  return !!(c && c.length > 0);
}
