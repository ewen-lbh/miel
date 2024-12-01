<script lang="ts">
	import MaybeError from '$lib/components/MaybeError.svelte';
	import { loading, LoadingText } from '$lib/loading';
	import { route } from '$lib/ROUTES';
	import type { PageData } from './$houdini';

	let { data }: { data: PageData } = $props();
	let { PageHome } = $derived(data);
	$inspect($PageHome);
</script>

<MaybeError result={$PageHome}>
	{#snippet children({ accounts })}
		<ul>
			{#each accounts as account}
				<li>
					<a href={route('/[account]', loading(account.address, ''))}>
						<LoadingText value={account.name} />
					</a>
                    
				</li>
			{/each}
		</ul>
	{/snippet}
</MaybeError>
