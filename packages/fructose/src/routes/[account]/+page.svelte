<script lang="ts">
	import { page } from '$app/stores';
	import { graphql } from '$houdini';
	import DeclareKeybindsContext from '$lib/components/DeclareKeybindsContext.svelte';
	import EmailRow from '$lib/components/EmailRow.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { loading } from '$lib/loading';
	import { refroute } from '$lib/navigation';
	import { route } from '$lib/ROUTES';
	import { infinitescroll } from '$lib/scroll';
	import IconMailboxSettings from '~icons/msl/settings-outline';
	import type { PageData } from './$houdini';
	const { data }: { data: PageData } = $props();
	const { PageAccount } = $derived(data);

	const Updates = graphql(`
		subscription AccountUpdates($inbox: ID!) {
			emails(inbox: $inbox, first: 5) {
				nodes {
					id
					...EmailRow
				}
			}
		}
	`);
	$effect(() => {
		const mainbox = $PageAccount.data?.account?.mainbox;
		if (!mainbox) return;
		Updates.listen({ inbox: mainbox.id });
	});
</script>

<DeclareKeybindsContext context="email_list" />

<MaybeError result={$PageAccount}>
	{#snippet children({ account })}
		{#if !account}
			<p>Account does not exist</p>
		{:else}
			{@const newEmails =
				$Updates.data?.emails.nodes.filter(
					({ id }) => !account.mainbox?.emails.edges.some((e) => e.node.id === id)
				) ?? []}
			<div class="content">
				<header>
					{#each account.inboxes as inbox}
						<Pill
							class="primary"
							href={refroute('/[account]/inboxes/[inbox]', {
								account: $page.params.account,
								inbox: loading(inbox.id, '')
							})}
							text={inbox.name}
						/>
					{/each}
					<Pill
						class="primary"
						href={route('/[account]/inboxes', $page.params.account)}
						text="Configure"
						icon={IconMailboxSettings}
					/>
				</header>
				<main use:infinitescroll={async () => PageAccount.loadNextPage()}>
					<Submenu>
						{#each newEmails as email}
							<EmailRow fresh {email} />
						{/each}
						{#each account.mainbox?.emails.edges ?? [] as { node: email }}
							<EmailRow {email} />
						{:else}
							<SubmenuItem icon={null}>
								<p class="muted">No emails</p>
							</SubmenuItem>
						{/each}
					</Submenu>
					<div data-infinitescroll-bottom=""></div>
				</main>
			</div>
		{/if}
	{/snippet}
</MaybeError>

<style>
	header {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
	}

	.content {
		padding: 0.5rem 2rem;
	}
</style>
