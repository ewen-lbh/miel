<script lang="ts">
	import { page } from '$app/stores';
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
			<h1>{account.name}</h1>
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
