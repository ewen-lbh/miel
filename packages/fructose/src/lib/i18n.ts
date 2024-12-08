import { loading, type MaybeLoading } from '$lib/loading';

const SENTENCE_JOINS = {
	fr: {
		and: 'et',
		or: 'ou'
	},
	en: {
		and: 'and',
		or: 'or'
	}
};

// TODO
const LOCALE = 'en';

export function sentenceJoin(
	strings: string[],
	last: keyof (typeof SENTENCE_JOINS)[keyof typeof SENTENCE_JOINS] = 'and'
): string {
	const join = SENTENCE_JOINS[LOCALE][last];
	if (strings.length <= 1) return strings[0] || '';
	if (strings.length === 2) return strings.join(` ${join} `);
	return `${strings.slice(0, -1).join(', ')} ${join} ${strings.at(-1)}`;
}

/**
 * Pluralize a word or noun phrase
 * @param singular singular form
 * @param count count of objects
 * @param plural plural form - default is to add 's' to every word of the singular form
 * @returns the singular or plural form, depending on count's value
 */
export function pluralize(singular: string, count: number, plural?: string): string {
	if (LOCALE === 'en') {
		plural ??= singular
			.split(' ')
			.map((word) => `${word}${word.endsWith('s') ? 'es' : 's'}`)
			.join(' ');
		return count > 1 || count === 0 ? plural : singular;
	}
	return singular;
}

/**
 * Display an amount of things
 * @param thing the thing to count
 * @param count the amount of things there is
 * @returns a sentence part that says how many things there are
 */
export function countThing(thing: string, count: MaybeLoading<number>): string {
	const _count = loading(count, 3);
	return `${_count} ${pluralize(thing, _count)}`;
}

export function ellipsis(subject: MaybeLoading<string>, maxlength: number): string {
	const _subject = loading(subject, '');
	if (_subject.length <= maxlength) return _subject;
	return `${_subject.slice(0, maxlength - 1)}…`;
}
