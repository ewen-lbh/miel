<script lang="ts">
	import { page } from '$app/stores';
	import type { PageInboxUnrolledStore } from '$houdini';
	import EmailRow from '$lib/components/EmailRow.svelte';
	import MailBody from '$lib/components/MailBody.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import { infinitescroll } from '$lib/scroll';
	import Header from './Header.svelte';

	interface Props {
		data: PageInboxUnrolledStore;
	}

	let { data: PageInbox }: Props = $props();
</script>

<MaybeError result={$PageInbox}>
	{#snippet children({ account })}
		<div class="content">
			{#if !account?.inbox}
				<p>Oops! No inbox with ID {$page.params.inbox} exists for this account.</p>
			{:else}
				<Header inbox={account.inbox} />
				<main use:infinitescroll={async () => PageInbox.loadNextPage()}>
					{#each account.inbox.emails.edges as { node: email }}
						<article>
							<EmailRow {email} />
							{#if email}
								<MailBody {email}></MailBody>
							{/if}
						</article>
					{:else}
						<p class="muted">No emails</p>
					{/each}
					<div data-infinitescroll-bottom=""></div>
				</main>
			{/if}
		</div>
	{/snippet}
</MaybeError>

<style>
	.content {
		padding: 0.5rem 2rem;
	}

	article {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}
</style>
