<script lang="ts">
	import { LoadingText, type MaybeLoading } from '$lib/loading';
	import type { Component, Snippet } from 'svelte';

	type Props = {
		class: 'success' | 'warning' | 'error' | 'primary';
		href: string;
		icon?: Component;
		children?: Snippet<[]>;
		text?: MaybeLoading<string>;
	};

	let { children, text, class: klass, href, icon: Icon }: Props = $props();
</script>

<svelte:element this={href ? 'a' : 'div'} class="pill {klass}" {href}>
	{#if Icon}
		<div class="icon"><Icon /></div>
	{/if}
	{#if children}
		{@render children()}
	{:else}
		<LoadingText value={text} />
	{/if}
</svelte:element>

<style>
	.pill {
		display: inline-flex;
		padding: 0.125em 0.75em;
		border-radius: 10000px;
		background-color: var(--bg);
		border: var(--border-block) solid transparent;
		transition: border 0.2s ease;
	}

	.pill:hover,
	.pill:focus-visible {
		border-color: var(--color);
	}

	.icon {
		font-size: 0.85em;
		margin-right: 0.75ch;
		display: flex;
		justify-content: center;
		align-items: center;
		align-self: center;
	}
</style>
