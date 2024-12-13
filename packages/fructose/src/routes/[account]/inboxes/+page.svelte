<script lang="ts">
	import { page } from '$app/stores';
	import IconMailboxType from '$lib/components/IconMailboxType.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { countThing } from '$lib/i18n';
	import { loading, LoadingText, mapLoading } from '$lib/loading';
	import { route } from '$lib/ROUTES';
	import type { PageData } from './$houdini';

	let { data }: { data: PageData } = $props();
	let { PageInboxes } = $derived(data);
</script>

<MaybeError result={$PageInboxes}>
	{#snippet children({ account })}
		{#if !account}
			<p>Account does not exist</p>
		{:else}
			<div class="content">
				<Submenu>
					{#each account.inboxes as inbox}
						<SubmenuItem
							href={route('/[account]/inboxes/[inbox]', {
								account: $page.params.account,
								inbox: loading(inbox.id, '')
							})}
							subtext={mapLoading(
								inbox.defaultOf.totalCount,
								(count) => `Default inbox for ${countThing('address', count)}`
							)}
						>
							{#snippet icon()}
								<IconMailboxType type={inbox.type} />
							{/snippet}
							<LoadingText value={inbox.name} />
						</SubmenuItem>
					{/each}
				</Submenu>
			</div>
		{/if}
	{/snippet}
</MaybeError>

<style>
	.content {
		padding: 0.5rem 2rem;
	}
</style>
