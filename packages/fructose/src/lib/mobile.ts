import { writable } from 'svelte/store';

export const isMobile = writable(false);

export function inferIsMobile(userAgent: string) {
	return userAgent.toLowerCase().includes('mobile') || userAgent.toLowerCase().includes(' code/1.');
}
