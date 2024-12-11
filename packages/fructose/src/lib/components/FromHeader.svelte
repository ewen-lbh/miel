<script lang="ts">
	import { fragment, graphql, type FromHeader, type FromHeader$data } from '$houdini';
	import Avatar from '$lib/components/Avatar.svelte';
	import Header from '$lib/components/Header.svelte';
	import { allLoaded, type MaybeLoading } from '$lib/loading';

	interface Props {
		address: FromHeader | null;
		linkify?: boolean;
		title: (d: FromHeader$data) => MaybeLoading<string | undefined>;
		subtitle?: (d: FromHeader$data) => MaybeLoading<string | undefined>;
	}

	let { address, title, subtitle, linkify }: Props = $props();
	const Address = $derived(
		fragment(
			address,
			graphql`
				fragment FromHeader on Address {
					name
					address
					...Avatar
				}
			`
		)
	);
</script>

<Header
	title={$Address?.name ?? ($Address && allLoaded($Address) ? title($Address) : '')}
	subtitle={$Address?.address ?? ($Address && allLoaded($Address) ? subtitle?.($Address) : '')}
>
	{#snippet avatar()}
		<Avatar {linkify} address={$Address} />
	{/snippet}
</Header>
