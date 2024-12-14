<script lang="ts">
	import { page } from '$app/stores';
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
</script>

<DeclareKeybindsContext context="email_list" />

<MaybeError result={$PageAccount}>
	{#snippet children({ account })}
		{#if !account}
			<p>Account does not exist</p>
		{:else}
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
