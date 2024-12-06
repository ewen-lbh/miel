<script lang="ts">
	import { fragment, graphql, type FromHeader, type FromHeader$data } from '$houdini';
	import Avatar from '$lib/components/Avatar.svelte';
	import { allLoaded, LoadingText } from '$lib/loading';
	import type { Snippet } from 'svelte';

	interface Props {
		address: FromHeader | null;
		title: Snippet<[FromHeader$data]>;
		subtitle?: Snippet<[FromHeader$data]>;
	}

	let { address, title, subtitle }: Props = $props();
	const Address = $derived(
		fragment(
			address,
			graphql`
				fragment FromHeader on Address {
					name
					address
					...Avatar
				}
			`
		)
	);
</script>

<header>
	<div class="avatar">
		<Avatar address={$Address} />
	</div>
	<div class="text">
		<h2>
			{#if !$Address || !allLoaded($Address)}
				<LoadingText />
			{:else}
				{@render title($Address)}
			{/if}
		</h2>
		<div class="subtitle">
			{#if !$Address || !allLoaded($Address)}
				<LoadingText />
			{:else if subtitle}
				{@render subtitle($Address)}
			{:else}
				<small>{$Address.address}</small>
			{/if}
		</div>
	</div>
</header>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 1em 2em;
	}

	header .avatar {
		font-size: 3em;
		flex-shrink: 0;
	}
</style>
