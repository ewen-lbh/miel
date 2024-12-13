<script lang="ts">
	import ButtonCopyToClipboard from '$lib/components/ButtonCopyToClipboard.svelte';
	import ButtonGhost from '$lib/components/ButtonGhost.svelte';
	import FromHeader from '$lib/components/FromHeader.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { formatTime } from '$lib/dates';
	import { allLoaded, loaded, loading, mapAllLoading, mapLoading, onceLoaded } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';
	import { tooltip } from '$lib/tooltip';
	import { safeValue } from '$lib/typing';
	import { getDomain } from 'tldts';
	import IconArrowRight from '~icons/msl/arrow-right-alt';
	import IconFail from '~icons/msl/cancel-outline';
	import IconPass from '~icons/msl/check-circle-outline';
	import IconTravelPath from '~icons/msl/conversion-path';
	import IconOpenExternal from '~icons/msl/open-in-new';
	import IconUnsubscribe from '~icons/msl/unsubscribe-outline';
	import type { PageData } from './$houdini';
	import { parseReceivedHeader } from './travelpath';
	import IconMailboxType from '$lib/components/IconMailboxType.svelte';
	import { refroute } from '$lib/navigation';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();
	let { PageEmailMetadata } = $derived(data);

	let travelPathSegments = $derived.by(() => {
		let email = $PageEmailMetadata.data?.email;
		if (!email) return [];
		if (!allLoaded(email.travelPath) || !loaded(email.to.address)) return [];

		return email.travelPath
			.map((seg) => {
				let parsed = parseReceivedHeader(seg);
				return {
					...parsed,
					details: [
						parsed.for && parsed.for !== loading(email.to.address, '') ? `for ${parsed.for}` : null,
						safeValue(() => formatTime(parsed.at)),
						parsed.with
					]
						.filter(Boolean)
						.slice(0, 2)
						.join(' · ')
				};
			})
			.sort((a, b) => {
				if (!a.at || !b.at) return 0;
				return a.at.getTime() - b.at.getTime();
			});
	});
</script>

{#snippet linkifyRootDomain(maybeDomain: string | undefined)}
	{@const domain = maybeDomain ? getDomain(maybeDomain) : null}
	{#if domain}
		<a target="_blank" href="https://{domain}">{maybeDomain}</a>
	{:else}
		{maybeDomain}
	{/if}
{/snippet}

<MaybeError result={$PageEmailMetadata}>
	{#snippet children({ email, account })}
		{#if !email}
			<p>Email does not exist</p>
		{:else}
			<div class="content">
				<FromHeader linkify address={email.from} {account}>
					{#snippet title()}
						<LoadingText value={email.subject} />
					{/snippet}
					{#snippet subtitle(from)}
						from {from.address} · to <LoadingText value={email.to.address} />
						{#if email.cc.length > 0}
							CC <LoadingText
								value={mapAllLoading(
									email.cc.map((a) => a.address),
									(...addrs) => addrs.join(', ')
								)}
							/>
						{/if}
					{/snippet}
				</FromHeader>

				<Submenu>
					<SubmenuItem
						href={refroute('/[account]/inboxes/[inbox]', {
							account: $page.params.account,
							inbox: loading(email.inbox.id, '')
						})}
						subtext="Mailbox"
					>
						{#snippet icon()}
							<IconMailboxType type={email.inbox.type} />
						{/snippet}
						<LoadingText value={email.inbox.name}></LoadingText>
					</SubmenuItem>
					{#if email.unsubscribe}
						<SubmenuItem icon={IconUnsubscribe} subtext="Unsubscribe URL">
							<LoadingText value={mapLoading(email.unsubscribe, (u) => u.toString())}></LoadingText>
							{#snippet right()}
								<ButtonGhost
									help="Open in new tab"
									href={onceLoaded(email.unsubscribe, (u) => u.toString(), '')}
								>
									<IconOpenExternal />
								</ButtonGhost>
							{/snippet}
						</SubmenuItem>
					{/if}
					<h3 class="typo-field-label">Authentication</h3>

					<SubmenuItem subtext="SPF">
						{#snippet icon()}
							<div class={email.spf?.ok ? 'success' : 'danger'}>
								{#if email.spf?.ok}<IconPass />{:else}<IconFail />{/if}
							</div>
						{/snippet}
						{#if email.spf?.explanation}
							<LoadingText value={email.spf?.explanation}></LoadingText>
						{:else}
							<em>Check result not found in headers</em>
						{/if}
					</SubmenuItem>
					<SubmenuItem subtext="DKIM">
						{#snippet icon()}
							<div class={email.dkim?.ok ? 'success' : 'danger'}>
								{#if email.dkim?.ok}<IconPass />{:else}<IconFail />{/if}
							</div>
						{/snippet}
						{#if email.dkim?.explanation}
							<LoadingText value={email.dkim?.explanation}></LoadingText>
						{:else}
							<em>Check result not found in headers</em>
						{/if}
					</SubmenuItem>
					<SubmenuItem subtext="DMARC">
						{#snippet icon()}
							<div class={email.dmarc?.ok ? 'success' : 'danger'}>
								{#if email.dmarc?.ok}<IconPass />{:else}<IconFail />{/if}
							</div>
						{/snippet}
						{#if email.dmarc?.explanation}
							<LoadingText value={email.dmarc?.explanation}></LoadingText>
						{:else}
							<em>Check result not found in headers</em>
						{/if}
					</SubmenuItem>
					<h3 class="typo-field-label">Nerd curiosities</h3>
					{#if travelPathSegments.length > 0}
						<SubmenuItem icon={IconTravelPath} subtext="Travel Path">
							<ol class="travelpath" class:long={travelPathSegments.length > 5}>
								{#each Object.entries(travelPathSegments) as [i, pathsegment]}
									<li>
										{#if i !== '0'}
											<div class="arrow">
												<IconArrowRight />
											</div>
										{/if}
										<div class="path-details">
											{#if !pathsegment.from && !pathsegment.by}
												<code>{pathsegment.raw}</code>
											{:else}
												<span class="from" use:tooltip={pathsegment.fromIp}>
													{@render linkifyRootDomain(
														(pathsegment.from || pathsegment.by)?.replace(/ \(.+?\)$/, '')
													)}
												</span>
												<p class="muted details">{pathsegment.details}</p>
											{/if}
										</div>
									</li>
								{/each}
							</ol>
						</SubmenuItem>
					{/if}
					<h3 class="typo-field-label">All headers</h3>
					{#each email.headers as { key, value }}
						<SubmenuItem icon={null} subtext={key}>
							<LoadingText tag="code" {value}></LoadingText>
							{#snippet right()}
								<ButtonCopyToClipboard text={value} />
							{/snippet}
						</SubmenuItem>
					{/each}
				</Submenu>
			</div>
		{/if}
	{/snippet}
</MaybeError>

<style>
	.content {
		padding: 1rem 2rem;
	}

	ol.travelpath {
		display: flex;
		align-items: center;
		gap: 1em;
		margin: 0;
		flex-wrap: wrap;
	}

	ol.travelpath.long {
		flex-direction: column;
		align-items: start;
	}

	ol.travelpath li {
		display: flex;
		gap: 1em;
		align-items: center;
	}

	ol.travelpath .arrow {
		font-size: 1.5em;
	}

	h3 {
		font-weight: bold;
		margin-top: 3em;
		color: var(--muted);
	}
</style>
