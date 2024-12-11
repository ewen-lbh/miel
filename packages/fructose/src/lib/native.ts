import { browser } from '$app/environment';
import { open } from '@tauri-apps/plugin-shell';

interface Window {
	__TAURI_INTERNALS__?: unknown;
}

export function isTauri() {
	return browser && Boolean((window as Window).__TAURI_INTERNALS__);
}

export async function openExternal(url: string) {
	if (isTauri()) {
		await open(url);
	} else {
		window.open(url, '_blank');
	}
}

export const handleExternalHref = (node: HTMLElement) => {
	const href = node.getAttribute('href');
	if (!href) return;
	const isExternal = /https?:\/\//.test(href);
	if (isExternal) {
		node.addEventListener('click', (event) => {
			event.preventDefault();
			openExternal(href);
		});
	}
};
