<script lang="ts">
	import { graphql } from '$houdini';
	import Avatar from '$lib/components/Avatar.svelte';
	import ButtonSecondary from '$lib/components/ButtonSecondary.svelte';
	import EmailRow from '$lib/components/EmailRow.svelte';
	import IconMailboxType from '$lib/components/IconMailboxType.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { loaded, loading } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';
	import { infinitescroll } from '$lib/scroll';
	import { SvelteSet } from 'svelte/reactivity';
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
				id
			}
		}
	`);
</script>

<MaybeError result={$PageScreener}>
	{#snippet children({ account })}
		<div class="content" use:infinitescroll={async () => PageScreener.loadNextPage()}>
			<Submenu>
				{#each screenings ?? [] as { node: address }}
					<SubmenuItem wideRightPart icon={null} subtext={address.address}>
						<LoadingText value={address.name} />
						<Avatar linkify slot="icon" {address} />
						<div class="actions" slot="right">
							{#each account?.inboxes ?? [] as box}
								<ButtonSecondary
									on:click={async () => {
										if (!loaded(box?.id)) return;
										if (!loaded(address.address)) return;
										await ScreenTo.mutate({
											address: address.address,
											box: box.id
										});
										removedScreenings.add(address.address);
									}}
								>
									<IconMailboxType slot="icon" type={box.type} />
									<LoadingText value={box.name} />
								</ButtonSecondary>
							{/each}
						</div>
					</SubmenuItem>

					{#each address.lastSentEmails.nodes as email}
						<EmailRow noavatar {email} />
					{/each}
				{/each}
			</Submenu>
			<div data-infinitescroll-bottom=""></div>
		</div>
	{/snippet}
</MaybeError>

<style>
	.actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5em 1em;
		justify-content: end;
	}
</style>
