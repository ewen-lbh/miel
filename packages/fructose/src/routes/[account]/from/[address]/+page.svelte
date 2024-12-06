<script lang="ts">
	import { page } from '$app/stores';
	import EmailRow from '$lib/components/EmailRow.svelte';
	import FromHeader from '$lib/components/FromHeader.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import { infinitescroll } from '$lib/scroll';
	import type { PageData } from './$houdini';

	let { data }: { data: PageData } = $props();
	let { PageEmailsFrom } = $derived(data);
</script>

<MaybeError result={$PageEmailsFrom}>
	{#snippet children({ address })}
		<div class="content">
			{#if !address}
				<p>Oops! You don't know about {$page.params.address} yet.</p>
			{:else}
				<FromHeader {address}>
					{#snippet title({ name })}
						Mails from {name}
					{/snippet}
				</FromHeader>
				<main use:infinitescroll={async () => PageEmailsFrom.loadNextPage()}>
					<Submenu>
						{#each address.sentEmails.edges as { node: email }}
							<EmailRow {email} />
						{/each}
					</Submenu>
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
</style>
