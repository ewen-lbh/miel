import { browser } from '$app/environment';
import { syncToSessionStorage } from 'svelte-store2storage';
import { writable } from 'svelte/store';

export const debugging = writable(false);

export const themeDebugger = writable(false);

if (browser) syncToSessionStorage(debugging, 'debugging');
if (browser) syncToSessionStorage(themeDebugger, 'themeDebugger');
