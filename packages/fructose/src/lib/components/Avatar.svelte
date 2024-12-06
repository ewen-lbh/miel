<script lang="ts">
	import { fragment, graphql, type Avatar } from '$houdini';
	import { loading, LoadingText, mapLoading, onceLoaded } from '$lib/loading';
	import type { Snippet } from 'svelte';
	import { refroute } from '$lib/navigation';
	import { page } from '$app/stores';
	import MaybeLinkify from '$lib/components/MaybeLinkify.svelte';

	interface Props {
		address: Avatar | null;
		linkify?: boolean;
	}
	const { address, linkify = false }: Props = $props();
	let Address = $derived(
		fragment(
			address,
			graphql(`
				fragment Avatar on Address {
					name
					address
					avatarURL
				}
			`)
		)
	);

	let src = $derived(loading($Address?.avatarURL, null)?.toString());
</script>

<MaybeLinkify
	href={linkify
		? refroute('/[account]/from/[address]', {
				account: $page.params.account,
				address: loading($Address?.address, '') ?? ''
			})
		: undefined}
>
	{#if src}
		<img class="avatar" {src} alt={onceLoaded($Address?.name, (n) => n?.slice(0, 2) ?? '', '')} />
	{:else}
		<div class="avatar placeholder">
			<LoadingText value={mapLoading($Address?.name, (n) => n?.slice(0, 2) ?? '')} />
		</div>
	{/if}
</MaybeLinkify>

<style>
	.avatar {
		width: 1.5em;
		height: 1.5em;
		border-radius: 50%;
		background-color: white;
		object-fit: cover;
	}

	.placeholder {
		background-color: var(--primary-bg);
		color: var(--primary);
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.placeholder :global(*) {
		font-size: 0.75em;
	}
</style>
