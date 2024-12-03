<script lang="ts">
	import { page } from '$app/stores';
	import { graphql } from '$houdini';
	import ButtonSecondary from '$lib/components/ButtonSecondary.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import { loaded, loading, mapLoading } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';
	import { route } from '$lib/ROUTES';
	import { infinitescroll } from '$lib/scroll';
	import type { PageData } from './$houdini';
	const { data }: { data: PageData } = $props();
	let { PageScreener } = $derived(data);

	const ScreenTo = graphql(`
		mutation ScreenTo($address: EmailAddress!, $box: ID!) {
			screenTo(address: $address, box: $box) {
				id
				...List_Screenings_remove
			}
		}
	`);
</script>

<MaybeError result={$PageScreener}>
	{#snippet children({ account, screenings })}
		<ul use:infinitescroll={async () => PageScreener.loadNextPage()}>
			{#each screenings.edges as { node: address }}
				<li>
					<LoadingText tag="h2" value={address.address} />
					<LoadingText value={address.name} />
					<p>Last 10 mails</p>
					<ul>
						{#each address.lastSentEmails.nodes as { subject, spamLevel, id }}
							<li>
								<LoadingText tag="code" value={mapLoading(spamLevel, (lvl) => lvl.length)} />
								<LoadingText
									tag="a"
									href={route('/[account]/[mail]', {
										account: $page.params.account,
										mail: loading(id, '')
									})}
									value={subject}
								/>
							</li>
						{/each}
					</ul>

					{#each account?.inboxes ?? [] as box}
						<ButtonSecondary
							on:click={async () => {
								if (!loaded(box?.id)) return;
								if (!loaded(address.address)) return;
								await ScreenTo.mutate({
									address: address.address,
									box: box.id
								});
							}}
						>
							Dans <LoadingText value={box.name} />
						</ButtonSecondary>
					{/each}
				</li>
				<hr />
			{/each}
		</ul>
	{/snippet}
</MaybeError>
