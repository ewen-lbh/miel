<script lang="ts">
	import { page } from '$app/stores';
	import EmailRow from '$lib/components/EmailRow.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { infinitescroll } from '$lib/scroll';
	import type { PageData } from './$houdini';
	import Classic from './classic.svelte';
	import Header from './Header.svelte';
	import Unrolled from './unrolled.svelte';

	let { data }: { data: PageData } = $props();
</script>

{#if data.PageInboxUnrolled}
	<Unrolled data={data.PageInboxUnrolled} />
{:else if data.PageInbox}
	<Classic data={data.PageInbox} />
{:else}
	Loading…
{/if}
