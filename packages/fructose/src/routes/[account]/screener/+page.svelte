<script lang="ts">
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

	const { data }: { data: PageData } = $props();
	let { PageScreener } = $derived(data);

	let removedScreenings = new SvelteSet<string>();
	let screenings = $derived(
		$PageScreener.data?.screenings.edges.filter(
			(e) => !removedScreenings.has(loading(e.node.address, ''))
		)
	);

	const ScreenTo = graphql(`
		mutation ScreenTo($address: EmailAddress!, $box: ID!) {
			screenTo(address: $address, box: $box) {
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
	colorclass: string,
	address: MaybeLoading<string>
)}
	<button
		class="to-{type} {colorclass}"
		onclick={async () => {
			const result = await ScreenTo.mutate({
				address: loading(address, ''),
				box: loading(boxId, '')
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
					<SubmenuItem wideRightPart icon={null} subtext={address.address}>
						<LoadingText value={address.name} />
						<Avatar linkify slot="icon" {address} />
						<div class="actions" slot="right">
							{#if account?.mainbox}
								{@render decideButton(
									account.mainbox.name,
									account.mainbox.id,
									'INBOX',
									'primary',
									address.address
								)}
							{/if}
							{#if account?.feedbox}
								{@render decideButton(
									account.feedbox.name,
									account.feedbox.id,
									'FEED',
									'success',
									address.address
								)}
							{/if}
							{#if account?.trashbox}
								{@render decideButton(
									account.trashbox.name,
									account.trashbox.id,
									'TRASHBOX',
									'danger',
									address.address
								)}
							{/if}
							<button class="to-others" style:--bg="var(--bg2)">
								<IconMore />
								Others…
							</button>
						</div>
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
