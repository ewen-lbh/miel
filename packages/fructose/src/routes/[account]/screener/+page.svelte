<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { graphql, type MailboxType$options } from '$houdini';
	import Avatar from '$lib/components/Avatar.svelte';
	import EmailRow from '$lib/components/EmailRow.svelte';
	import IconMailboxType from '$lib/components/IconMailboxType.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { ellipsis } from '$lib/i18n';
	import { loading, type MaybeLoading } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';
	import { infinitescroll } from '$lib/scroll';
	import { toasts } from '$lib/toasts';
	import { SvelteSet } from 'svelte/reactivity';
	import IconMore from '~icons/msl/more-horiz';
	import type { PageData } from './$houdini';
	import { keybind, type ValidActionInContext } from '$lib/keyboard';

	const { data }: { data: PageData } = $props();
	let { PageScreener } = $derived(data);

	beforeNavigate(() => {
		// Update screener once we quit the page -- not before since it'd create jumps in the UI
		void PageScreener.fetch({
			variables: { account: $page.params.account },
			policy: 'NetworkOnly'
		});
	});

	let removedScreenings = new SvelteSet<string>();
	let screenings = $derived(
		$PageScreener.data?.screenings.edges.filter(
			(e) => !removedScreenings.has(loading(e.node.address, ''))
		)
	);

	const ScreenTo = graphql(`
		mutation ScreenTo($address: EmailAddress!, $box: ID!, $account: EmailAddress!) {
			screenTo(address: $address, box: $box, account: $account) {
				...MutationErrors
				... on Address {
					id
				}
			}
		}
	`);
</script>

{#snippet decideButton(
	box: MaybeLoading<string>,
	boxId: MaybeLoading<string>,
	type: MailboxType$options,
	action: ValidActionInContext<'screener'>,
	colorclass: string,
	address: MaybeLoading<string>
)}
	<button
		class="to-{type} {colorclass}"
		use:keybind={`screener.${action}`}
		onclick={async () => {
			const result = await ScreenTo.mutate({
				address: loading(address, ''),
				box: loading(boxId, ''),
				account: $page.params.account
			});
			if (toasts.mutation(result, 'screenTo', '', 'Could not screen')) {
				removedScreenings.add(loading(address, ''));
			}
		}}
	>
		<IconMailboxType {type} inheritcolors />
		<LoadingText value={ellipsis(box, 12)} />
	</button>
{/snippet}

<MaybeError result={$PageScreener}>
	{#snippet children({ account })}
		<div class="content" use:infinitescroll={async () => PageScreener.loadNextPage()}>
			<Submenu>
				{#each screenings ?? [] as { node: address }}
					<SubmenuItem wideRightPart subtext={address.address}>
						{#snippet icon()}
							<Avatar {address} linkify />
						{/snippet}
						<LoadingText value={address.name} />
						{#snippet right()}
							<div class="actions">
								{#if account?.mainbox}
									{@render decideButton(
										account.mainbox.name,
										account.mainbox.id,
										'Inbox',
										'to_inbox',
										'primary',
										address.address
									)}
								{/if}
								{#if account?.feedbox}
									{@render decideButton(
										account.feedbox.name,
										account.feedbox.id,
										'Feed',
										'to_feed',
										'success',
										address.address
									)}
								{/if}
								{#if account?.trashbox}
									{@render decideButton(
										account.trashbox.name,
										account.trashbox.id,
										'Trash',
										'to_trash',
										'danger',
										address.address
									)}
								{/if}
								<button class="to-others" style:--bg="var(--bg2)" use:keybind={'screener.to_other'}>
									<IconMore />
									Others…
								</button>
							</div>
						{/snippet}
					</SubmenuItem>

					{#each address.lastSentEmails.nodes as email}
						<EmailRow noavatar {email} />
					{:else}
						<SubmenuItem icon={null}>
							<p class="muted">No emails</p>
						</SubmenuItem>
					{/each}
				{/each}
			</Submenu>
			<div data-infinitescroll-bottom=""></div>
		</div>
	{/snippet}
</MaybeError>

<style>
	.actions {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		grid-auto-rows: 1fr;
		align-items: center;
		width: 100%;
		gap: 0.5em 1em;
		justify-content: end;
	}

	.actions button {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		border-radius: var(--radius-block);
		padding: 0.5em;
		background-color: var(--bg);
		cursor: pointer;
		border: var(--border-block) solid transparent;
		white-space: nowrap;
	}

	.actions button:is(:hover, :focus-visible) {
		border-color: var(--color);
	}
</style>
