<script lang="ts">
	import { page } from '$app/state';
	import { graphql, type PageInboxStore } from '$houdini';
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

	const Updates = graphql(`
		subscription MailboxUpdates($inbox: ID!) {
			emails(inbox: $inbox, first: 5) {
				edges {
					node {
						id
						...EmailRow
					}
				}
			}
		}
	`);
	$effect(() => {
		Updates.listen({ inbox: page.params.inbox });
	});
</script>

<MaybeError result={$PageInbox}>
	{#snippet children({ account })}
		<div class="content">
			{#if !account?.inbox}
				<p>Oops! No inbox with ID {page.params.inbox} exists for this account.</p>
			{:else}
				{@const newMails =
					$Updates.data?.emails.edges.filter(
						({ node }) => !account.inbox?.emails.edges.some((e) => e.node.id === node.id)
					) ?? []}
				<Header inbox={account.inbox} />
				<main use:infinitescroll={PageInbox}>
					<Submenu>
						{#each newMails as { node: email }}
							<EmailRow fresh {email} />
						{/each}
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
