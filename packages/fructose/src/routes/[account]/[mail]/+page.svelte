<script lang="ts">
	import MailBody from '$lib/components/MailBody.svelte';

	import { page } from '$app/stores';
	import { graphql } from '$houdini';
	import Avatar from '$lib/components/Avatar.svelte';
	import ButtonPrimary from '$lib/components/ButtonPrimary.svelte';
	import ButtonSecondary from '$lib/components/ButtonSecondary.svelte';
	import EmailRow from '$lib/components/EmailRow.svelte';
	import GrowableTextarea from '$lib/components/GrowableTextarea.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import { formatDateTimeSmart } from '$lib/dates';
	import { allLoaded, loaded, loading, mapLoading, onceAllLoaded, onceLoaded } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';
	import { updateTitle } from '$lib/navigation';
	import { toasts } from '$lib/toasts';
	import { tooltip } from '$lib/tooltip';
	import IconAttachment from '~icons/msl/attachment';
	import IconFail from '~icons/msl/cancel-outline';
	import IconPass from '~icons/msl/check-circle-outline';
	import IconAllGood from '~icons/msl/done-all';
	import IconCollapse from '~icons/msl/expand-less';
	import IconExpand from '~icons/msl/expand-more';
	import IconSubmit from '~icons/msl/send-outline';
	import IconWarning from '~icons/msl/warning-outline';
	import type { PageData } from './$houdini';

	let { data }: { data: PageData } = $props();
	let { PageEmail } = $derived(data);

	let authChecksExpanded = $state(false);

	let replyBody = $state('');
	let sendingReply = $state(false);
	const Reply = graphql(`
		mutation Reply(
			$email: ID!
			$to: EmailAddress!
			$content: String!
			$subject: String!
			$from: EmailAddress!
		) {
			sendEmail(from: $from, to: $to, subject: $subject, body: $content, inReply: $email) {
				...MutationErrors
				... on Address {
					id
				}
			}
		}
	`);

	const Rename = graphql(`
		mutation RenameEmail($email: ID!, $newSubject: String!) {
			renameEmail(email: $email, subject: $newSubject) {
				...MutationErrors
				... on Email {
					subject
				}
			}
		}
	`);

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
				{#if !loaded(email.subject)}
					<LoadingText tag="h1" />
				{:else}
					<h1
						contenteditable
						onfocusout={async (event) => {
							if (!(event instanceof FocusEvent)) return;
							const newSubject = (event.target as HTMLElement).innerText;
							const result = await Rename.mutate({
								email: $page.params.mail,
								newSubject
							});
							toasts.mutation(result, 'renameEmail', '', "Couldn't rename email");
							const active = document.activeElement;
							if (active instanceof HTMLElement) {
								active.blur();
							}
						}}
					>
						{email.subject}
					</h1>
				{/if}
				<div class="date">
					<LoadingText value={mapLoading(email.receivedAt, formatDateTimeSmart)} />
				</div>

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
								use:tooltip={loading(email.dkim?.explanation ?? 'No result found in headers', '')}
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
								use:tooltip={loading(email.dmarc?.explanation ?? 'No result found in headers', '')}
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
								use:tooltip={loading(email.spf?.explanation ?? 'No result found in headers', '')}
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
									use:tooltip={`X-Spam-Level: ${loading(email.spamlevel.at(0), '')} (${spamscore})`}
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
			{#if email.attachments.nodes.length > 0}
				<section class="attachments">
					{#each email.attachments.nodes as attachment}
						<Pill
							href={onceLoaded(attachment.url, (u) => u?.toString(), '')}
							class="primary"
							icon={IconAttachment}
							text={attachment.filename}
						></Pill>
					{/each}
				</section>
			{/if}
			{#if email}
				<MailBody {email}></MailBody>
			{/if}
			<section class="replies">
				{#if email.replies.edges.length > 0}
					<h2>Replies</h2>
				{/if}
				{#each email.replies.edges as { node: reply }}
					<EmailRow email={reply} />
					<article class="reply">
						<MailBody email={reply} />
					</article>
				{/each}
			</section>
			<section class="reply">
				<h2 class="typo-field-label">Reply to <LoadingText value={email.from.address} /></h2>
				<GrowableTextarea bind:value={replyBody} />
				<section class="submit">
					<ButtonPrimary
						loading={sendingReply}
						on:click={async () => {
							if (!allLoaded(email)) return;
							sendingReply = true;
							const result = await Reply.mutate({
								email: $page.params.mail,
								to: email.from.address,
								from: $page.params.account,
								content: replyBody,
								subject: `Re: ${email.subject}`
							});

							if (toasts.mutation(result, 'sendEmail', 'Reply sent', "Coudln't reply")) {
								replyBody = '';
							}
							sendingReply = false;
						}}
					>
						<IconSubmit />
						Send
					</ButtonPrimary>
				</section>
			</section>
		{/if}
	{/snippet}
</MaybeError>

<style>
	header {
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
		flex-direction: column;
		padding: 1rem 0 3rem;
		gap: 1rem;
	}

	header h1 {
		max-width: 800px;
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

	.attachments {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		flex-wrap: wrap;
		padding: 1rem;
		justify-content: center;
	}

	.main-content.text {
		max-width: 800px;
		width: 100%;
		margin: 0 auto;
		padding: 1rem;
		border-radius: var(--radius-block);
		background-color: var(--bg2);
	}

	section.replies h2 {
		text-align: center;
	}

	section.reply {
		margin-top: 3rem;
		width: 100%;

		padding: 0 1rem;
	}

	section.reply h2 {
		margin-bottom: 1rem;
		font-weight: bold;
	}

	section.reply .submit {
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}
</style>
