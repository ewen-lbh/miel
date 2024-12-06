<script lang="ts">
	import ButtonSecondary from '$lib/components/ButtonSecondary.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import { formatDateTimeSmart } from '$lib/dates';
	import { loaded, loading, mapLoading, onceAllLoaded } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';
	import { tooltip } from '$lib/tooltip';
	import IconPerson from '~icons/msl/account-circle-outline';
	import type { PageData } from './$houdini';
	import { updateTitle } from '$lib/navigation';
	import { tick } from 'svelte';

	let { data }: { data: PageData } = $props();
	let { PageEmail } = $derived(data);

	let mailContentFrame: HTMLIFrameElement | undefined = $state();
	let unwrapInterval: number | NodeJS.Timeout | undefined = $state();

	let htmlContent = $derived($PageEmail.data?.email?.html);
	$effect(() => {
		if (!loaded(htmlContent)) return;
		if (!mailContentFrame) return;
		mailContentFrame.contentDocument?.write(htmlContent.replaceAll('<a ', "<a target='_blank' "));
		unwrapFrame();
		unwrapInterval = setInterval(unwrapFrame, 200);
		return () => clearInterval(unwrapInterval);
	});

	async function unwrapFrame() {
		if (!mailContentFrame?.contentDocument?.body) return;
		const frameBody = mailContentFrame.contentDocument.body;

		await tick();
		if (frameBody.scrollHeight <= mailContentFrame.clientHeight) {
			return;
		}
		mailContentFrame.style.height = `${frameBody.scrollHeight + 300}px`;
	}

	let subject = $derived($PageEmail.data?.email?.subject);
	$effect(() => {
		if (!loaded(subject)) return;
		updateTitle(subject);
	});
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
			{#if email.html}
				<iframe title="Mail content" bind:this={mailContentFrame} class="mail-content"></iframe>
			{:else}
				<main class="text main-content">
					{#if !loaded(email.text)}
						<LoadingText lines={10} tag="p"></LoadingText>
					{:else}
						{#each email.text.split(/\r?\n/) as line}
							<p>{line}</p>
						{/each}
					{/if}
				</main>
			{/if}
		{/if}
	{/snippet}
</MaybeError>

<style>
	small {
		display: inline-flex;
		align-items: center;
		gap: 0 1ch;
	}

	iframe {
		border: none;
		/* for now... */
		background: white;
	}
</style>
