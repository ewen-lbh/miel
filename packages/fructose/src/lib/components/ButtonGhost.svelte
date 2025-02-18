<script lang="ts">
	import { umamiAttributes } from '$lib/analytics';
	import type { KeybindExpression } from '$lib/keyboard';
	import { tooltip } from '$lib/tooltip';

	export let track = '';
	export let trackData: Record<string, string | number> = {};

	export let type: 'button' | 'reset' | 'submit' = 'button';
	export let keybind: KeybindExpression | undefined = undefined;
	export let help = '';
	export let danger = false;
	export let success = false;
	export let disabled = false;
	export let href = '';
	export let tight = false;
	export let inline = false;
	export let loading = false;
	export let hovering = false;
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	{...umamiAttributes(track, trackData)}
	role="button"
	tabindex="0"
	title={help}
	{...$$restProps}
	class:disabled
	class:inline
	class:tight
	class:danger
	data-keybind={keybind}
	class:success
	on:mouseenter={() => {
		hovering = true;
	}}
	on:mouseleave={() => {
		hovering = false;
	}}
	on:focus={() => {
		hovering = true;
	}}
	on:blur={() => {
		hovering = false;
	}}
	{disabled}
	{type}
	{href}
	use:tooltip={help}
	class="button-ghost {$$restProps.class}"
	class:has-hover-content={$$slots.hovering}
	on:click
	on:mousedown
	class:skeleton-effect-wave={loading}
>
	{#if loading}
		<div class="loading-blackout"><slot /></div>
	{:else if hovering}
		<slot name="hovering">
			<slot></slot>
		</slot>
	{:else}
		<slot />
	{/if}
</svelte:element>

<style>
	.button-ghost.skeleton-effect-wave {
		background: var(--skeleton-ui-bg);
	}

	.loading-blackout {
		opacity: 0;
	}

	.button-ghost {
		--bg: transparent;

		flex-shrink: 0;
		width: max-content;
		padding: 0.25em;
		font-size: 1em;
		color: var(--text);
		word-wrap: break-word;
		white-space: normal;
		background: var(--bg);
		border: var(--border-inline) solid transparent;
		border-radius: var(--radius-inline);
		outline: 0 solid var(--fg);
	}

	.tight {
		padding: 0;
	}

	:not(.inline) {
		display: flex;
	}

	.disabled {
		cursor: not-allowed;
		opacity: 0.75;
	}

	:not(.disabled) {
		cursor: pointer;
	}

	:not(.disabled):focus-visible {
		outline-width: 1px;
	}

	:not(.disabled):hover:not(.has-hover-content) {
		color: var(--shy);
	}
</style>
