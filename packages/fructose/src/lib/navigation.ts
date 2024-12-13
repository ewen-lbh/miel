import { goto, pushState } from '$app/navigation';
import { page } from '$app/stores';
import type {
	NavigationContext,
	NavigationQuickAction
} from '$lib/components/NavigationTop.svelte';
import { route } from '$lib/ROUTES';
import type { Page } from '@sveltejs/kit';
import IconMove from '~icons/msl/drive-file-move-outline';
import { get } from 'svelte/store';
import IconXML from '~icons/msl/code';
import IconTrashFilled from '~icons/msl/delete';
import IconMetadata from '~icons/msl/format-list-bulleted';
import IconTrash from '~icons/msl/delete-outline';
import IconPen from '~icons/msl/edit-outline';
import IconCog from '~icons/msl/settings-outline';
import IconScreener from '~icons/msl/thumbs-up-down-outline';
import type { LayoutParams, LayoutRouteId } from '../routes/$types';
import { graphql } from '$houdini';
import type { OverflowMenuAction } from '$lib/components/OverflowMenu.svelte';
import { iconinstance } from '$lib/components/IconMailboxType.svelte';
import { toasts } from '$lib/toasts';

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

export type NavigationTopActionEvent = `NAVTOP_${'COPY_ID' | 'UPDATE_TITLE'}`;
const navigationTopActionEventDispatcher = (
	eventID: NavigationTopActionEvent,
	details: unknown = undefined
) => {
	window.dispatchEvent(new CustomEvent(eventID, details));
};

export function updateTitle(newTitle: string) {
	navigationTopActionEventDispatcher('NAVTOP_UPDATE_TITLE', { detail: newTitle });
}

export type ModalStateKeys = ``;

export type NavigationTopStateKeys = `NAVTOP_${'DELETING' | 'MOVING'}`;

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

const moveMailAction = (params: { account: string; mail: string }) =>
	({
		label: 'Move to…',
		icon: IconMove,
		do: undefined,
		overflow: async () => {
			const Inboxes = await graphql(`
				query Inboxes($account: EmailAddress!) {
					account(address: $account) {
						inboxes {
							id
							name
							type
						}
					}
				}
			`).fetch({ variables: params });

			const MoveToInbox = graphql(`
				mutation MoveToInbox($mail: ID!, $inbox: ID!) {
					moveToInbox(email: $mail, inbox: $inbox) {
						...MutationErrors
						... on Email {
							inbox {
								id
							}
						}
					}
				}
			`);

			return Inboxes.data?.account?.inboxes.map(({ id, name, type }) => ({
				label: name,
				icon: iconinstance(type),
				actions: [],
				async do() {
					toasts.mutation(
						await MoveToInbox.mutate({ mail: params.mail, inbox: id }),
						'moveToInbox',
						`Moved to ${name}`,
						`Couldn't move to ${name}`,
						undefined,
						{
							labels: { action: `Go to ${name}` },
							data: { ...params, inbox: id },
							action({ data }) {
								goto(refroute('/[account]/inboxes/[inbox]', data));
							}
						}
					);
				}
			})) as OverflowMenuAction<any>[];
		}
	}) as NavigationQuickAction;

const rootPagesActions = [] as Array<NavigationContext['actions'][number]>;

const mailDetailsActions = (params: { account: string; mail: string }) =>
	({
		quickAction: moveMailAction(params),
		actions: [
			{
				icon: IconMetadata,
				label: 'See metadata',
				href: route('/[account]/[mail]/metadata', params)
			},
			commonActions.delete,
			commonActions.copyID
		]
	}) as const;

export const topnavConfigs: {
	[RouteID in NonNullable<LayoutRouteId>]:
		| NavigationContext
		| ((
				// TODO Figure out a way to get PageParams of RouteID? The PageParams exported on  (app)/layout's $type is empty...
				page: Page<{ [K in keyof LayoutParams]-?: NonNullable<LayoutParams[K]> }, RouteID>
		  ) => NavigationContext);
} = {
	'/': {
		actions: rootPagesActions
	},
	'/[account]/[mail]': ({ params }) => ({
		title: 'Email',
		back: route('/[account]', params.account),
		...mailDetailsActions(params)
	}),
	'/[account]/[mail]/metadata': ({ params }) => {
		const { quickAction, actions } = mailDetailsActions(params);
		return {
			title: 'Email Metadata',
			back: route('/[account]/[mail]', params),
			quickAction,
			actions: actions.filter((a) => a.label !== 'See metadata')
		};
	},
	'/[account]/screener': ({ params }) => ({
		title: 'Screener',
		actions: [],
		back: route('/[account]', params.account)
	}),
	'/[account]/inboxes': ({ params }) => ({
		title: 'Inboxes',
		actions: [],
		back: route('/[account]', params.account)
	}),
	'/[account]/inboxes/[inbox]': ({ params }) => ({
		title: 'Inbox',
		actions: [],
		back: route('/[account]/inboxes', params.account)
	}),
	'/[account]': ({ params }) => ({
		title: params.account,
		actions: rootPagesActions,
		quickAction: {
			icon: IconScreener,
			label: 'Screener',
			href: refroute('/[account]/screener', params.account)
		},
		back: route('/')
	}),
	'/[account]/addressbook': ({ params }) => ({
		title: 'Address book',
		actions: [],
		back: route('/[account]', params.account)
	}),
	'/[account]/from/[address]': ({ params }) => ({
		title: `Emails from ${params.address}`,
		actions: [],
		back: route('/[account]', params.account)
	}),
	'/register': {
		title: 'Add an account',
		actions: [],
		back: route('/')
	}
};

export const isRoute = (pagestore: Page, ...routeArgs: Parameters<typeof route>) =>
	pagestore.url.pathname.replace(/\/$/, '') === route(...routeArgs);
