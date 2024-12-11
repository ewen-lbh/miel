<script lang="ts">
	import { page } from '$app/stores';
	import type { PageInboxStore } from '$houdini';
	import EmailRow from '$lib/components/EmailRow.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { infinitescroll } from '$lib/scroll';
	import Header from './Header.svelte';

	interface Props {
		data: PageInboxStore;
	}

	let { data: PageInbox }: Props = $props();
</script>

<MaybeError result={$PageInbox}>
	{#snippet children({ account })}
		<div class="content">
			{#if !account?.inbox}
				<p>Oops! No inbox with ID {$page.params.inbox} exists for this account.</p>
			{:else}
				<Header inbox={account.inbox} />
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
