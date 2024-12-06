<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import ButtonSecondary from '$lib/components/ButtonSecondary.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import { loaded, loading, onceAllLoaded } from '$lib/loading';
	import IconExpand from '~icons/msl/expand-more';
	import IconCollapse from '~icons/msl/expand-less';
	import LoadingText from '$lib/LoadingText.svelte';
	import { updateTitle } from '$lib/navigation';
	import { tick } from 'svelte';
	import IconPass from '~icons/msl/check-circle-outline';
	import IconAllGood from '~icons/msl/done-all';
	import IconWarning from '~icons/msl/warning-outline';
	import IconFail from '~icons/msl/cancel-outline';
	import type { PageData } from './$houdini';
	import { greenToRed } from '$lib/colors';
	import { tooltip } from '$lib/tooltip';

	let { data }: { data: PageData } = $props();
	let { PageEmail } = $derived(data);

	let mailContentFrame: HTMLIFrameElement | undefined = $state();
	let unwrapInterval: number | NodeJS.Timeout | undefined = $state();

	let authChecksExpanded = $state(false);

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

	let spamscore = $derived(
		(loading($PageEmail.data?.email?.spamlevel.at(0), '')?.length ?? 0) / 10
	);

	let allGood = $derived(
		spamscore <= 0.3 &&
			onceAllLoaded(
				[$PageEmail.data?.email],
				({ spf, dmarc, dkim }) => [spf?.ok, dmarc?.ok, dkim?.ok].every(Boolean),
				false
			)
	);
</script>

<MaybeError result={$PageEmail}>
	{#snippet children({ email })}
		{#if !email}
			<p>Email introuvable</p>
		{:else}
			<header>
				<div class="sender">
					<div class="avatar">
						<Avatar linkify address={email.from} />
					</div>
					<div class="text">
						<div class="name">
							<LoadingText value={email.from.name} />
						</div>
						<LoadingText class="muted" value={email.from.address} />
					</div>
				</div>
				<LoadingText tag="h1" value={email.subject}></LoadingText>

				<section class="spam-and-auth">
					{#if allGood}
						<div
							class="all-good"
							onclick={() => {
								authChecksExpanded = !authChecksExpanded;
							}}
							onkeypress={(e) => {
								if (e.key === 'Enter') {
									authChecksExpanded = !authChecksExpanded;
								}
							}}
							role="button"
							tabindex="0"
						>
							<div class="icon success">
								<IconAllGood />
							</div>
							<div class="text success">Probably not spam</div>
							<div use:tooltip={`Show ${authChecksExpanded ? 'less' : 'more'} details`}>
								{#if authChecksExpanded}
									<IconCollapse />
								{:else}
									<IconExpand />
								{/if}
							</div>
						</div>
					{/if}
					{#if !allGood || authChecksExpanded}
						<div class="auth-checks">
							<div
								class="auth-check {email.dkim?.ok ? 'success' : 'danger'}"
								use:tooltip={email.dkim?.explanation ?? 'No result found in headers'}
							>
								<div class="icon">
									{#if email.dkim?.ok}
										<IconPass />
									{:else}
										<IconFail />
									{/if}
								</div>
								DKIM
							</div>
							<div
								class="auth-check {email.dmarc?.ok ? 'success' : 'danger'}"
								use:tooltip={email.dmarc?.explanation ?? 'No result found in headers'}
							>
								<div class="icon">
									{#if email.dmarc?.ok}
										<IconPass />
									{:else}
										<IconFail />
									{/if}
								</div>
								DMARC
							</div>
							<div
								class="auth-check {email.spf?.ok ? 'success' : 'danger'}"
								use:tooltip={email.spf?.explanation ?? 'No result found in headers'}
							>
								<div class="icon">
									{#if email.spf?.ok}
										<IconPass />
									{:else}
										<IconFail />
									{/if}
								</div>
								SPF
							</div>

							{#if email.spamlevel.at(0)}
								<div
									class="auth-check {spamscore > 0.5
										? 'danger'
										: spamscore > 0.3
											? 'warning'
											: 'success'}"
									use:tooltip={`X-Spam-Level: ${email.spamlevel.at(0)} (${spamscore})`}
								>
									<div class="icon">
										{#if spamscore > 0.5}
											<IconFail />
										{:else if spamscore > 0.3}
											<IconWarning />
										{:else}
											<IconPass />
										{/if}
									</div>
									Spam
								</div>
							{/if}
						</div>
					{/if}
				</section>
				<div class="actions">
					{#if loading(email.unsubscribe, null)}
						<ButtonSecondary newTab href={email.unsubscribe}>Unsubscribe</ButtonSecondary>
					{/if}
				</div>
			</header>
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
	iframe {
		border: none;
		/* for now... */
		background: white;
	}

	header {
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
		flex-direction: column;
		padding: 1rem 0 3rem;
		gap: 1rem;
	}

	header :global(h1) {
		max-width: 600px;
		margin: 0 auto;
	}

	header .sender {
		display: flex;
		align-items: center;
		gap: 1ch;
	}

	header .sender .avatar {
		font-size: 1.75em;
		display: flex;
		align-items: center;
	}

	header .sender .text {
		display: flex;
		flex-direction: column;
		align-items: start;
		justify-content: center;
		gap: 0;
		line-height: 1;
	}

	header .sender .name {
		font-size: 1.2em;
	}

	header .spam-and-auth {
		border-radius: var(--radius-block);
		padding: 0.5em 1em;
	}

	header .spam-and-auth .all-good {
		display: flex;
		align-items: center;
		gap: 1ch;
		cursor: pointer;
	}

	header .spam-and-auth:has(.all-good:is(:hover, :focus-visible)) {
		background: var(--bg2);
	}

	header .spam-and-auth .all-good > * {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	header .spam-and-auth .all-good > *:not(.text) {
		font-size: 1.2em;
	}

	header .auth-checks {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1em;
		font-size: 0.85em;
	}

	header .auth-checks .icon {
		font-size: 1.75em;
	}
</style>
