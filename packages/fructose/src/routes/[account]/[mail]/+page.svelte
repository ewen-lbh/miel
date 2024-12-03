<script lang="ts">
	import ButtonSecondary from '$lib/components/ButtonSecondary.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import { formatDateTimeSmart } from '$lib/dates';
	import { loading, mapAllLoading, mapLoading, onceAllLoaded } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';
	import { tooltip } from '$lib/tooltip';
	import type { PageData } from './$houdini';
	const { data }: { data: PageData } = $props();
	const { PageEmail } = $derived(data);
	import IconPerson from '~icons/msl/account-circle-outline';
</script>

<MaybeError result={$PageEmail}>
	{#snippet children({ email })}
		{#if !email}
			<p>Email introuvable</p>
		{:else}
			<small>
				From
				<LoadingText value={email.from.address}></LoadingText>
				{#if onceAllLoaded([email.from.probablyAPerson, email.unsubscribe], (person, unsub) => person && !unsub, false)}
					<span
						class="icon-person"
						use:tooltip={email.from.probablyAPerson
							? 'This email is probably from a person instead of a company'
							: undefined}
					>
						<IconPerson />
					</span>
				{/if}
			</small>
			<small>
				To <LoadingText value={email.to.address}></LoadingText>
			</small>
			{#if loading(email.unsubscribe, null)}
				<ButtonSecondary newTab href={email.unsubscribe}>Unsubscribe</ButtonSecondary>
			{/if}
			<p>
				Received at <LoadingText value={mapLoading(email.receivedAt, formatDateTimeSmart)}
				></LoadingText>
			</p>
			<LoadingText tag="h1" value={email.subject}></LoadingText>
			<div class="mail-content">
				{@html email.html}
			</div>
		{/if}
	{/snippet}
</MaybeError>

<style>
	small {
		display: inline-flex;
		align-items: center;
		gap: 0 1ch;
	}
</style>
