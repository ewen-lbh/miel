<script lang="ts">
	import type { PageData } from './$houdini';
	import Classic from './classic.svelte';
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
