<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/stores';
	import EmailRow from '$lib/components/EmailRow.svelte';
	import InputSearchQuery from '$lib/components/InputSearchQuery.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import type { PageData } from './$houdini';

	const { data }: { data: PageData } = $props();
	let { PageSearch } = $derived(data);
</script>

<MaybeError result={$PageSearch}>
	{#snippet children({ searchMails })}
		<header>
			<InputSearchQuery
				q={$page.url.searchParams.get('q') ?? ''}
				on:debouncedInput={async ({ detail }) => {
					replaceState(`?q=${detail}`, {});
					await PageSearch.fetch({ variables: { q: detail ?? '' } });
				}}
			/>
		</header>
		<Submenu>
			{#each searchMails as result}
				<EmailRow email={result} />
			{/each}
		</Submenu>
	{/snippet}
</MaybeError>
