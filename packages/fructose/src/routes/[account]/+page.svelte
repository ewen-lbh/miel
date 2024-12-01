<script lang="ts">
	import { page } from '$app/stores';
	import ButtonSecondary from '$lib/components/ButtonSecondary.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import { loading } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';
	import { route } from '$lib/ROUTES';
	import type { PageData } from './$houdini';
	const { data }: { data: PageData } = $props();
	const { PageAccount } = $derived(data);
</script>

<MaybeError result={$PageAccount}>
	{#snippet children({ account })}
		{#if !account}
			<p>Account does not exist</p>
		{:else}
			<LoadingText tag="h1" value={account.name} />
			<section class="mails">
				{#each account.inboxes as inbox}
					<LoadingText tag="h2" value={inbox.name} />
					<ul class="mails">
						{#each inbox.emails.nodes as mail}
							<a
								href={route('/[account]/[mail]', {
									account: $page.params.account,
									mail: loading(mail.id, '')
								})}
							>
								<article>
									{#if loading(mail.unsubscribe, null)}
										<ButtonSecondary newTab href={mail.unsubscribe}>Unsubscribe</ButtonSecondary>
									{/if}
									<small>From <LoadingText value={mail.from.address} /> </small>
									<LoadingText tag="h3" value={mail.subject} />
								</article>
							</a>
						{/each}
					</ul>
				{/each}
			</section>
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
