import { pushState } from '$app/navigation';
import { page } from '$app/stores';
import type { NavigationContext } from '$lib/components/NavigationTop.svelte';
import { route } from '$lib/ROUTES';
import type { Page } from '@sveltejs/kit';
import { get } from 'svelte/store';
import IconXML from '~icons/msl/code';
import IconTrashFilled from '~icons/msl/delete';
import IconTrash from '~icons/msl/delete-outline';
import IconPen from '~icons/msl/edit-outline';
import IconCog from '~icons/msl/settings-outline';
import type { LayoutParams, LayoutRouteId } from '../routes/$types';

export function addReferrer(url: URL | string, referrer?: URL | string): string;
export function addReferrer(
	url: URL | string | undefined,
	referrer?: URL | string
): string | undefined;
export function addReferrer(
	url: URL | string | undefined,
	referrer?: URL | string
): string | undefined {
	if (!url) return undefined;
	const u = new URL(url, typeof url === 'string' ? get(page).url : undefined);
	u.searchParams.set('from', referrer?.toString() ?? get(page).url.pathname.toString());
	u.host = '';
	u.protocol = '';
	return u.toString();
}

/**
 * Just like route(...), but tacks on a ?from query param to the current pathname
 */
// @ts-expect-error can't be bothered to type that shit
export const refroute: typeof route = (...args) => addReferrer(route(...args));

export type NavigationTopActionEvent = `NAVTOP_${'COPY_ID'}`;
const navigationTopActionEventDispatcher = (eventID: NavigationTopActionEvent) => {
	window.dispatchEvent(new CustomEvent(eventID));
};

export type ModalStateKeys = ``;

export type NavigationTopStateKeys = `NAVTOP_${'DELETING'}`;

export type NavigationTopState = Partial<Record<NavigationTopStateKeys, boolean>>;

export type ModalState = {
	EDITING_GROUP_MEMBER?: string;
};

function navtopPushState(key: NavigationTopStateKeys | ModalStateKeys) {
	pushState('', {
		[key]: true
	} satisfies NavigationTopState & ModalState);
}

const commonActions = {
	delete: {
		label: 'Delete',
		icon: IconTrash,
		filledIcon: IconTrashFilled,
		do() {
			navtopPushState('NAVTOP_DELETING');
		}
	},
	edit: {
		label: 'Edit subject',
		icon: IconPen
	},
	settings: {
		label: 'Settings',
		icon: IconCog
	},
	copyID: {
		label: 'Copy ID',
		icon: IconXML,
		do() {
			navigationTopActionEventDispatcher('NAVTOP_COPY_ID');
		}
	}
} as const;

const rootPagesActions = [] as Array<NavigationContext['actions'][number]>;

export const topnavConfigs: Partial<{
	[RouteID in NonNullable<LayoutRouteId>]:
		| NavigationContext
		| ((
				// TODO Figure out a way to get PageParams of RouteID? The PageParams exported on  (app)/layout's $type is empty...
				page: Page<{ [K in keyof LayoutParams]-?: NonNullable<LayoutParams[K]> }, RouteID>
		  ) => NavigationContext);
}> = {
	'/': {
		actions: rootPagesActions
	},
	'/[account]/[mail]': {
		title: 'Email',
		actions: [commonActions.delete, commonActions.edit, commonActions.copyID]
	},
	'/[account]/screener': {
		title: 'Screener',
		actions: []
	},
	'/[account]': ({ params }) => ({
		title: params.account,
		actions: rootPagesActions
	})
};

/**
 * Like refroute("/login"), but also adds a &why=unauthorized query param to explain why the user is being redirected to the login page.
 * @param explain {boolean} - Adds &why=unauthorized to the query string.
 */
export function loginRedirection({ explain = true } = {}) {
	return refroute('/login') + (explain ? '?why=unauthorized' : '');
}
