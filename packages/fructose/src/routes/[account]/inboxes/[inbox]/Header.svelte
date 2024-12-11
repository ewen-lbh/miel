<script lang="ts">
	import { page } from '$app/stores';
	import { fragment, graphql, type InboxHeader, type MailboxType$options } from '$houdini';
	import ButtonInk from '$lib/components/ButtonInk.svelte';
	import Header from '$lib/components/Header.svelte';
	import IconMailboxType, { colorclass } from '$lib/components/IconMailboxType.svelte';
	import ModalOrDrawer from '$lib/components/ModalOrDrawer.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { onceLoaded } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';
	import { toasts } from '$lib/toasts';

	const { inbox }: { inbox: InboxHeader } = $props();
	const Inbox = $derived(
		fragment(
			inbox,
			graphql(`
				fragment InboxHeader on Mailbox {
					name
					type
					main
				}
			`)
		)
	);

	const UpdateMailboxType = graphql(`
		mutation UpdateMailboxType($inbox: ID!, $type: MailboxType!) {
			upsertMailbox(id: $inbox, input: { type: $type }) {
				...MutationErrors
				... on Mailbox {
					type
				}
			}
		}
	`);

	const mailboxTypes: MailboxType$options[] = ['Inbox', 'Feed', 'Trash', 'Drafts', 'Sent'];

	let selectMailboxType: () => void = $state(() => {});
</script>

<ModalOrDrawer let:close bind:open={selectMailboxType} title="Select the mailbox's type">
	<Submenu>
		{#each mailboxTypes as type}
			<SubmenuItem
				clickable
				icon={null}
				on:click={async () => {
					const result = await UpdateMailboxType.mutate({
						inbox: $page.params.inbox,
						type: type
					});
					if (toasts.mutation(result, 'upsertMailbox', '', 'Could not update mailbox type')) {
						close();
					}
				}}
			>
				<IconMailboxType {type} slot="icon" />
				{type}
			</SubmenuItem>
		{/each}
	</Submenu>
</ModalOrDrawer>

<Header title={$Inbox?.name}>
	{#snippet avatar()}
		<div class="icon-circle {onceLoaded($Inbox.type, colorclass, '') || 'muted'}">
			<IconMailboxType type={$Inbox?.type} />
		</div>
	{/snippet}
	{#snippet subtitle()}
		<LoadingText value={$Inbox?.type} /> box
		<ButtonInk on:click={selectMailboxType}>Change</ButtonInk>
	{/snippet}
</Header>

<style>
	.icon-circle {
		font-size: 2rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 0.75em;
		border-radius: 50%;
		background-color: var(--bg, var(--bg2));
	}
</style>
