<script lang="ts">
	import { page } from '$app/stores';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import { countThing } from '$lib/i18n';
	import { loading } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';
	import { route } from '$lib/ROUTES';
	import type { PageData } from './$houdini';
	const { data }: { data: PageData } = $props();
	const { PageAccount } = $derived(data);
</script>

<MaybeError result={$PageAccount}>
	{#snippet children({ account, screenings })}
		{#if !account}
			<p>Account does not exist</p>
		{:else}
			<LoadingText tag="h1" value={account.name} />
			<section class="screenings">
				<a href={route('/[account]/screener', $page.params.account)}>
					{countThing('screening', screenings.totalCount)} to sort out
				</a>
			</section>

			<main>
				<ul>
					{#each account.mainbox?.emails.edges ?? [] as { node: email }}
						<li>
							<a
								href={route('/[account]/[mail]', {
									account: $page.params.account,
									mail: loading(email.id, '')
								})}
							>
								<LoadingText value={email.subject} />
								from <LoadingText value={email.from.address} />
							</a>
						</li>
					{/each}
				</ul>
			</main>
		{/if}
	{/snippet}
</MaybeError>

<style>
	article {
		display: flex;
		align-items: center;
		gap: 0 1ch;
	}
</style>
