const STORAGE_KEY = 'components-dataviz:recent-colour';

/** Storage can throw (private windows, blocked site data) or be absent (SSR), so failures are ignored. */
export const loadRecentColour = (): string =>
	(() => {
		try {
			return localStorage.getItem(STORAGE_KEY) ?? '';
		} catch {
			return '';
		}
	})();

export const saveRecentColour = (hex: string) => {
	try {
		localStorage.setItem(STORAGE_KEY, hex);
	} catch {
		// Remembering is a convenience only.
	}
};
