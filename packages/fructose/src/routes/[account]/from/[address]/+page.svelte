<script lang="ts">
	import MaybeError from '$lib/components/MaybeError.svelte';
	import type { PageData } from './$houdini';
	import { page } from '$app/stores';
	import Avatar from '$lib/components/Avatar.svelte';
	import LoadingText from '$lib/LoadingText.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { loading, mapLoading } from '$lib/loading';
	import { formatDateRelativeSmart, formatDateTimeSmart } from '$lib/dates';
	import { formatDistanceToNow, formatRelative } from 'date-fns';
	import { refroute } from '$lib/navigation';
	import { infinitescroll } from '$lib/scroll';

	let { data }: { data: PageData } = $props();
	let { PageEmailsFrom } = $derived(data);
</script>

<MaybeError result={$PageEmailsFrom}>
	{#snippet children({ address })}
		<div class="content">
			{#if !address}
				<p>Oops! You don't know about {$page.params.address} yet.</p>
			{:else}
				<header>
					<div class="avatar">
						<Avatar {address} />
					</div>
					<div class="text">
						<h2>
							Mails from
							<LoadingText value={address.name} />
						</h2>
						<LoadingText tag="small" value={address.address} />
					</div>
				</header>
				<main use:infinitescroll={async () => PageEmailsFrom.loadNextPage()}>
					<Submenu>
						{#each address.sentEmails.edges as { node: email }}
							<SubmenuItem
								href={refroute('/[account]/[mail]', {
									account: $page.params.account,
									mail: loading(email.id, '')
								})}
								icon={null}
								subtext={mapLoading(email.receivedAt, formatDateRelativeSmart)}
							>
								<LoadingText value={email.subject} />
							</SubmenuItem>
						{/each}
					</Submenu>
					<div data-infinitescroll-bottom=""></div>
				</main>
			{/if}
		</div>
	{/snippet}
</MaybeError>

<style>
	.content {
		padding: 0.5rem 2rem;
	}

	header {
		display: flex;
		align-items: center;
		gap: 1em 2em;
	}

	header .avatar {
		font-size: 3em;
	}
</style>
