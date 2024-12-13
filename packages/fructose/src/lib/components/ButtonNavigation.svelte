<script lang="ts">
	import { page } from '$app/stores';
	import { isMobile } from '$lib/mobile';
	import { scrollableContainer } from '$lib/scroll';
	import { tooltip } from '$lib/tooltip';
	import type { Page } from '@sveltejs/kit';
	import { createEventDispatcher, type Component, type Snippet } from 'svelte';
	import type { LayoutRouteId } from '../../routes/$types';
	import { isSnippet } from '$lib/typing';

	const dispatch = createEventDispatcher<{ click: undefined }>();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Props {
		href: string;
		/** If null, only highlighted when current page is href. */
		routeID: LayoutRouteId | null;
		label?: string | undefined;
		icon?: Snippet | Component | undefined;
		iconFilled?: Snippet | Component | undefined;
		tooltipsOn?: 'left' | 'right' | 'top' | 'bottom';
		children?: Snippet;
	}

	let {
		href,
		routeID,
		label = undefined,
		icon: Icon = undefined,
		iconFilled: IconFilled = Icon,
		tooltipsOn = 'top',
		children
	}: Props = $props();

	const mobile = $derived($isMobile);

	function isPathwiseEqual(a: URL, b: URL) {
		return a.pathname.replace(/\/$/, '') === b.pathname.replace(/\/$/, '');
	}

	function isCurrent(route: LayoutRouteId | null, href: string, page: Page) {
		if (route) return page.route.id === route;
		return isPathwiseEqual(new URL(href, page.url), page.url);
	}
</script>

{#snippet snippetOrComponent(o: Snippet | Component)}
	{#if isSnippet(o)}
		{@render o()}
	{:else}
		{@const O = o}
		<O />
	{/if}
{/snippet}

<svelte:element
	this={isCurrent(routeID, href, $page) ? 'button' : 'a'}
	{href}
	class="button-navigation"
	role={isCurrent(routeID, href, $page) ? 'button' : 'link'}
	class:current={isCurrent(routeID, href, $page)}
	use:tooltip={label ? { content: label, placement: tooltipsOn } : undefined}
	onclick={isCurrent(routeID, href, $page)
		? () => {
				scrollableContainer(mobile).scrollTo({ top: 0, behavior: 'smooth' });
				dispatch('click');
			}
		: undefined}
>
	{#if children}{@render children()}{:else if isCurrent(routeID, href, $page) && (IconFilled ?? Icon)}
		{@render snippetOrComponent(IconFilled ?? Icon)}
	{:else if Icon}
		{@render snippetOrComponent(Icon)}
	{/if}
</svelte:element>

<style>
	.current {
		color: var(--primary);
	}

	.button-navigation {
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			color 0.25s ease,
			transform 0.5s ease;
	}

	.button-navigation:active {
		transform: scale(0.5);
	}

	button {
		padding: 0;
		font-size: 1em;
		cursor: pointer;
	}
</style>
