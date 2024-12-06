<script lang="ts">
	import { page } from '$app/stores';
	import EmailRow from '$lib/components/EmailRow.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { infinitescroll } from '$lib/scroll';
	import type { PageData } from './$houdini';

	let { data }: { data: PageData } = $props();
	let { PageInbox } = $derived(data);
</script>

<MaybeError result={$PageInbox}>
	{#snippet children({ account })}
		<div class="content">
			{#if !account?.inbox}
				<p>Oops! No inbox with ID {$page.params.inbox} exists for this account.</p>
			{:else}
				<main use:infinitescroll={async () => PageInbox.loadNextPage()}>
					<Submenu>
						{#each account.inbox.emails.edges as { node: email }}
							<EmailRow {email} />
						{:else}
							<SubmenuItem icon={null}>
								<p class="muted">No emails</p>
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
</style>
