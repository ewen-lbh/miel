<script lang="ts">
	import { page } from '$app/stores';
	import EmailRow from '$lib/components/EmailRow.svelte';
	import FromHeader from '$lib/components/FromHeader.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { infinitescroll } from '$lib/scroll';
	import type { PageData } from './$houdini';

	let { data }: { data: PageData } = $props();
	let { PageEmailsFrom } = $derived(data);
</script>

<MaybeError result={$PageEmailsFrom}>
	{#snippet children({ address, account })}
		<div class="content">
			{#if !address}
				<p>Oops! You don't know about {$page.params.address} yet.</p>
			{:else}
				<FromHeader {address} {account}>
					{#snippet title({ name })}
						Mails from {name}
					{/snippet}
				</FromHeader>
				<main use:infinitescroll={async () => PageEmailsFrom.loadNextPage()}>
					<Submenu>
						{#each address.sentEmails.edges as { node: email }}
							<EmailRow noavatar {email} />

						{:else}
							<SubmenuItem icon={null}>
								<p class="muted">No emails</p>
							</SubmenuItem>
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
