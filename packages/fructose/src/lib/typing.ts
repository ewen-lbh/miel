import type { PendingValue, VariableFunction } from '$houdini';
import type { Component, Snippet } from 'svelte';

export function hasNoUndefineds<T>(items: T[]): items is NonNullable<T>[] {
	return items.every(Boolean);
}

export function notNull<T>(value: T | null): value is T {
	return value !== null;
}

export function notUndefined<T>(value: T | undefined): value is T {
	return value !== undefined;
}

// Infers LoadingNode to Node on calls... can't use this yet.
export function edges<LoadingNode, Node>({
	edges
}:
	| { edges: Array<{ node: Node } | null> }
	| { edges: Array<{ node: LoadingNode; cursor: typeof PendingValue }> }): Array<
	Node | LoadingNode
> {
	return edges.map((edge) => edge?.node ?? null).filter(notNull);
}

export type WithoutRuntimeScalars<T> = Omit<T, 'loggedIn'>;

/**
 * See https://github.com/HoudiniGraphQL/houdini/issues/1308
 */
export type VariableFunctionFixed<Params extends Record<string, string>, Input> = VariableFunction<
	Params,
	WithoutRuntimeScalars<Input>
>;

// See https://github.com/microsoft/TypeScript/issues/38520
export function entries<K extends string | number, V>(obj: Record<K, V>): [K, V][] {
	return Object.entries(obj) as [K, V][];
}

// Turn an iterable into a interator that has access to the previous value
export function* withPrevious<T>(iterable: Iterable<T>): Generator<[T, T | undefined]> {
	let previous: T | undefined = undefined;
	for (const current of iterable) {
		yield [current, previous];
		previous = current;
	}
}

/**
 * Prevent throwing and killing the whole app
 * @param closure the closure to run
 * @returns the closure's return value, or undefined if it throws
 */
export function safeValue<T>(closure: () => T): T | undefined {
	try {
		return closure();
	} catch {
		return undefined;
	}
}

export const isComponent = (value: any): value is Component =>
	value instanceof Function && value.length === 2;

export const isSnippet = (value: any): value is Snippet =>
	value instanceof Function && value.length === 1;

export async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
