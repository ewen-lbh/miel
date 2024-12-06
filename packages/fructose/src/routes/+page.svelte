<script lang="ts">
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { loading, LoadingText } from '$lib/loading';
	import { route } from '$lib/ROUTES';
	import type { PageData } from './$houdini';
	import IconMail from '~icons/msl/mail-outline';

	let { data }: { data: PageData } = $props();
	let { PageHome } = $derived(data);
	$inspect($PageHome);
</script>

<MaybeError result={$PageHome}>
	{#snippet children({ accounts })}
		<Submenu>
			{#each accounts as account}
				<SubmenuItem icon={IconMail} href={route('/[account]', loading(account.address, ''))}>
					<LoadingText value={account.name} />
				</SubmenuItem>
			{/each}
		</Submenu>
	{/snippet}
</MaybeError>
