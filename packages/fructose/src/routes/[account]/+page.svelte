<script lang="ts">
	import { page } from '$app/stores';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { loading, mapLoading, onceLoaded } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';
	import { route } from '$lib/ROUTES';
	import { infinitescroll } from '$lib/scroll';
	import type { PageData } from './$houdini';
	import EmailRow from '$lib/components/EmailRow.svelte';
	const { data }: { data: PageData } = $props();
	const { PageAccount } = $derived(data);
</script>

<MaybeError result={$PageAccount}>
	{#snippet children({ account })}
		{#if !account}
			<p>Account does not exist</p>
		{:else}
			<header>
				{#each account.inboxes as inbox}
					<LoadingText value={inbox.name} />
				{/each}
			</header>
			<main use:infinitescroll={async () => PageAccount.loadNextPage()}>
				<Submenu>
					{#each account.mainbox?.emails.edges ?? [] as { node: email }}
						<EmailRow {email} />
					{/each}
				</Submenu>
			</main>
		{/if}
	{/snippet}
</MaybeError>
