<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		href?: string;
		children?: Snippet<[]>;
	}

	let { href, children }: Props = $props();
</script>

{#if href}
	<a {href}>{@render children?.()}</a>
{:else}
	{@render children?.()}
{/if}

<style>
	a {
		display: contents;
	}
</style>
