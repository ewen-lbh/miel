<script lang="ts" generics="Value extends MaybeLoading<boolean> | boolean">
	import InputToggle from '$lib/components/InputToggle.svelte';
	import { LoadingText, type MaybeLoading } from '$lib/loading';
	import { isSnippet } from '$lib/typing';
	import type { Snippet } from 'svelte';

	interface Props {
		value: Value;
		label: MaybeLoading<string> | Snippet<[]>;
	}

	let { value = $bindable(), label }: Props = $props();
</script>

<label class="switch-container">
	{#if isSnippet(label)}
		{@render label()}
	{:else}
		<LoadingText value={label}></LoadingText>
	{/if}
	<InputToggle twoway bind:value on:change />
</label>

<style>
	.switch-container {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		justify-content: space-between;
	}
</style>
