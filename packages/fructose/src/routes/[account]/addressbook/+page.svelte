<script lang="ts">
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { page } from '$app/stores';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import type { PageData } from './$houdini';
	import { loading, LoadingText } from '$lib/loading';
	import { infinitescroll } from '$lib/scroll';
	import { refroute } from '$lib/navigation';

	let { data }: { data: PageData } = $props();
	let { PageAddressbook } = $derived(data);
</script>

<MaybeError result={$PageAddressbook}>
	{#snippet children({ addresses })}
		<div class="content" use:infinitescroll={async () => PageAddressbook.loadNextPage()}>
			<Submenu>
				{#each addresses.edges as { node: address }}
					<SubmenuItem
						href={refroute('/[account]/from/[address]', {
							account: $page.params.account,
							address: loading(address.address, '')
						})}
						icon={Avatar}
						iconArgs={{ address }}
						subtext={address.address}
					>
						<LoadingText value={address.name} />
					</SubmenuItem>
				{/each}
			</Submenu>
			<div data-infinitescroll-bottom=""></div>
		</div>
	{/snippet}
</MaybeError>
