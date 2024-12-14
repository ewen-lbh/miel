import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { get, writable } from 'svelte/store';

export type KeybindContext = Items<typeof CONTEXTS>

export function keybind(node: HTMLElement, expr: undefined | KeybindExpression) {
	if (!expr) return;
	node.dataset.keybind = expr;
	return {
		update(expr: undefined | KeybindExpression) {
			if (!expr) {
				delete node.dataset.keybind;
			} else {
				node.dataset.keybind = expr;
			}
		},
		destroy() {
			delete node.dataset.keybind;
		}
	};
}

export function setupKeybindsListener() {
	if (!browser) return;
	console.log(get(keymap));
	document.addEventListener('keypress', (event) => {
		const currentContext = currentKeybindContext();
		const currentKeymap = get(keymap);
		let contextOfKey = currentContext;
		let actionOfKey = Object.entries(currentKeymap[currentContext]).find(([_, keystring]) =>
			activatesKeystring(keystring, event)
		)?.[0] as ValidActionInContext<typeof currentContext | 'global'>;
		if (!actionOfKey) {
			contextOfKey = 'global';
			actionOfKey = Object.entries(currentKeymap.global).find(([_, keystring]) =>
				activatesKeystring(keystring, event)
			)?.[0] as ValidActionInContext<'global'>;
		}
		if (!actionOfKey) {
			console.log('no keybind found for', event);
		}
		const nodeToClick = document.querySelector(
			(
				[
					[contextOfKey, actionOfKey],
					['global', actionOfKey]
				] as const
			)
				.map(([ctx, action]) => `[data-keybind="${keybindExpression(ctx, action)}"]`)
				.join(', ')
		);
		if (!nodeToClick) {
			console.log(
				'did not find anything for keybind',
				keybindExpression(contextOfKey, actionOfKey)
			);
			return;
		}
		event.preventDefault();
		console.log('clicking', nodeToClick);
		if (nodeToClick instanceof HTMLAnchorElement) {
			goto(nodeToClick.href.replace(window.location.origin, ''));
		} else {
			nodeToClick.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		}
	});
}

function currentKeybindContext(): Items<typeof CONTEXTS> {
	if (!browser) return 'global';
	return (document.head.querySelector('meta[name=keybinds-context]')?.getAttribute('content') ??
		'global') as Items<typeof CONTEXTS>;
}

function metaIsCtrl() {
	if (!browser) return false;
	return navigator.platform.includes('Mac');
}

function activatesKeystring(keystring: Keystring, event: KeyboardEvent) {
	const actual = {
		modifiers: activeModifiers(event),
		key: event.key.toLowerCase()
	};

	const [expectedModifiers, expectedKey] = parseKeystring(keystring);

	return (
		actual.key === expectedKey &&
		expectedModifiers.every((modifier) => actual.modifiers.includes(modifier))
	);
}

function activeModifiers(event: KeyboardEvent): ModifierKey[] {
	const modifiers: ModifierKey[] = [];
	if (event.shiftKey) modifiers.push('shift');
	if (event.ctrlKey) modifiers.push(metaIsCtrl() ? 'meta' : 'ctrl');
	if (event.altKey) modifiers.push('alt');
	if (event.getModifierState('AltGraph')) modifiers.push('alt');
	if (event.metaKey) modifiers.push(metaIsCtrl() ? 'ctrl' : 'meta');
	return modifiers;
}

function parseKeystring(keystring: Keystring): [ModifierKey[], Key] {
	const keys = keystring.split('+');
	const key = keys.pop() as Key;
	return [keys as ModifierKey[], key];
}

function keybindExpression<C extends Items<typeof CONTEXTS>>(
	...params: [C, ValidActionInContext<NoInfer<C>>] | [ValidActionInContext<'global'>]
): KeybindExpression {
	if (is1Uple(params)) return `global.${params[0]}`;
	return `${params[0]}.${params[1]}` as KeybindExpression;
}

function is1Uple<A, B, C>(value: [A] | [B, C]): value is [A] {
	return value.length === 1;
}

export type KeybindExpression = {
	[C in Items<typeof CONTEXTS>]: `${C}.${ValidActionInContext<C>}`;
}[Items<typeof CONTEXTS>];

const PREDEFINED_KEYMAPS: Record<string, Keymap> = {
	default: {
		account_list: {
			see_details: 'enter',
			select_down: 'j',
			select_up: 'k'
		},
		email: {
			reply: 'r',
			see_details: '$',
			to_feed: 'f',
			to_trash: 'd',
			to_inbox: 'i',
			to_other: 'o',
			peek_spam_report: 's',
			see_sender: 'a',
			unsubscribe: 'shift+u',
			next_link: 'shift+j',
			previous_link: 'shift+k'
		},
		email_list: {
			select_down: 'j',
			select_up: 'k',
			open_screener: 'shift+s'
		},
		screener: {
			select_down: 'j',
			select_up: 'k',
			to_feed: 'f',
			to_trash: 'd',
			to_inbox: 'i',
			to_other: 'o',
			see_first_email: 't',
			see_second_email: 'y',
			see_third_email: 'u'
		},
		global: {
			back: 'esc',
			compose: 'shift+c',
			next_account: 'ctrl+j',
			previous_account: 'ctrl+k',
			open_accounts: 'shift+a',
			open_inboxes: 'shift+i',
			open_keyboard_shortcuts: '?'
		}
	}
} as const;

const keymap = writable<Keymap>(PREDEFINED_KEYMAPS.default);

type Keymap = {
	[context in Items<typeof CONTEXTS>]: {
		[action in ValidActionInContext<context>]: Keystring;
	};
};

export type ValidActionInContext<C extends Items<typeof CONTEXTS>> = Items<
	(typeof VALID_ACTIONS_IN_CONTEXT)[C]
>;

const ACTIONS = [
	'select_down',
	'select_up',
	'reply',
	'see_details',
	'next_thread',
	'previous_thread',
	'move_to',
	'open_screener',
	'next_account',
	'previous_account',
	'open_keyboard_shortcuts',
	'open_accounts',
	'open_inboxes',
	'compose',
	'back',
	'see_email',
	'to_inbox',
	'to_feed',
	'to_trash',
	'to_other',
	'see_first_email',
	'see_second_email',
	'see_third_email',
	'unsubscribe',
	'see_sender',
	'peek_spam_report',
	'next_link',
	'previous_link'
] as const;

const CONTEXTS = ['screener', 'email', 'email_list', 'account_list', 'global'] as const;

type Items<T extends readonly any[]> = T[number];

const VALID_ACTIONS_IN_CONTEXT = {
	account_list: ['select_up', 'select_down', 'see_details'],
	email_list: ['select_down', 'select_up', 'open_screener'],
	screener: [
		'select_down',
		'select_up',
		'to_feed',
		'to_trash',
		'to_other',
		'to_inbox',
		'see_first_email',
		'see_second_email',
		'see_third_email'
	],
	email: [
		'reply',
		'see_details',
		'to_inbox',
		'to_feed',
		'to_trash',
		'to_other',
		'unsubscribe',
		'see_sender',
		'peek_spam_report',
		'next_link',
		'previous_link'
	],
	global: [
		'previous_account',
		'next_account',
		'open_accounts',
		'open_inboxes',
		'open_keyboard_shortcuts',
		'compose',
		'back'
	]
} as const satisfies { [C in Items<typeof CONTEXTS>]: Array<Items<typeof ACTIONS>> };

type Keystring =
	| Key
	| `${ModifierKey}+${Key}`
	| `${ModifierKey}+${ModifierKey}+${Key}`
	| `${ModifierKey}+${ModifierKey}+${ModifierKey}+${Key}`;

const MODIFIER_KEYS = ['shift', 'ctrl', 'alt', 'meta'] as const;
const UNPRINTABLE_KEYS = [
	'space',
	'tab',
	'enter',
	'escape',
	'backspace',
	'delete',
	'insert',
	'home',
	'end',
	'pageup',
	'pagedown',
	'up',
	'down',
	'left',
	'right',
	'esc'
] as const;

const PRINTABLE_KEYS = [
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l',
	'm',
	'n',
	'o',
	'p',
	'q',
	'r',
	's',
	't',
	'u',
	'v',
	'w',
	'x',
	'y',
	'z',
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'<',
	'>',
	'.',
	',',
	';',
	"'",
	'[',
	']',
	'\\',
	'/',
	'-',
	'=',
	'`',
	'!',
	'@',
	'#',
	'$',
	'%',
	'^',
	'&',
	'*',
	'(',
	')',
	'_',
	'+',
	'~',
	'{',
	'}',
	'|',
	':',
	'"',
	'?'
] as const;

export type ModifierKey = (typeof MODIFIER_KEYS)[number];
export type UnprintableKey = (typeof UNPRINTABLE_KEYS)[number];
export type PrintableKey = (typeof PRINTABLE_KEYS)[number];
export type Key = UnprintableKey | PrintableKey;
