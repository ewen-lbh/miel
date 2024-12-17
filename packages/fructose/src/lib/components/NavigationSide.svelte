<script lang="ts">
	import { page } from '$app/stores';
	import { graphql } from '$houdini';
	import Avatar from '$lib/components/Avatar.svelte';
	import ButtonGhost from '$lib/components/ButtonGhost.svelte';
	import ButtonNavigation from '$lib/components/ButtonNavigation.svelte';
	import { loading } from '$lib/loading';
	import { route } from '$lib/ROUTES';
	import { theme } from '$lib/theme';
	import { withSurroundingsWrapped } from '$lib/typing';
	import IconBugReport from '~icons/msl/bug-report-outline';
	import IconSearch from '~icons/msl/search';
	import IconComposeFilled from '~icons/msl/ink-pen';
	import IconCompose from '~icons/msl/ink-pen-outline';
	import IconAutoTheme from '~icons/msl/night-sight-auto-outline';
	import IconDarkTheme from '~icons/msl/nightlight-outline';
	import IconLightTheme from '~icons/msl/sunny-outline';
	import IconAccountsFilled from '~icons/msl/switch-account';
	import IconAccounts from '~icons/msl/switch-account-outline';

	const Data = graphql(`
		query NavigationSide {
			accounts {
				name
				address {
					address
					...Avatar
				}
			}
		}
	`);

	let willSwitchThemeTo = $derived(
		{
			dark: 'auto',
			auto: 'light',
			light: 'dark'
		}[$theme.variant] as typeof $theme.variant
	);

	const accountsCycle = $derived.by(() => {
		if (!$Data.data?.accounts) return { isPrev: () => false, isNext: () => false };
		for (const [prev, cur, next] of withSurroundingsWrapped($Data.data.accounts)) {
			if (cur?.address?.address === $page.params.account) {
				console.log({ prev, cur, next });
				return {
					isPrev: (acct: typeof cur) => acct?.address?.address === prev?.address.address,
					isNext: (acct: typeof cur) => acct?.address?.address === next?.address.address
				};
			}
		}
		return { isPrev: () => false, isNext: () => false };
	});
</script>

<nav>
	<div class="top">
		<ButtonNavigation href="/" routeID="/">Mi</ButtonNavigation>
	</div>
	<div class="middle">
		<ButtonNavigation
			keybind="global.open_search"
			href={route('/search')}
			routeID="/search"
			label="Search"
			tooltipsOn="left"
			icon={IconSearch}
		/>
		<ButtonNavigation
			keybind="global.open_accounts"
			href="/"
			routeID="/"
			label="Accounts"
			tooltipsOn="left"
			icon={IconAccounts}
			iconFilled={IconAccountsFilled}
		/>
		{#await Data.fetch() then { data }}
			{#each data?.accounts ?? [] as acct}
				<ButtonNavigation
					routeID={null}
					href={route('/[account]', loading(acct.address.address, ''))}
					label={loading(acct.name, '')}
					tooltipsOn="left"
					keybind={accountsCycle.isPrev(acct)
						? 'global.previous_account'
						: accountsCycle.isNext(acct)
							? 'global.next_account'
							: undefined}
				>
					{#snippet icon()}
						<div class="avatar">
							<Avatar address={acct.address} />
						</div>
					{/snippet}
					{#snippet iconFilled()}
						<div class="avatar outlined">
							<Avatar address={acct.address} />
						</div>
					{/snippet}
				</ButtonNavigation>
			{/each}
		{/await}
		<ButtonNavigation
			href="/compose{$page.params.account ? `?as=${$page.params.account}` : ''}"
			routeID="/compose"
			label="Compose"
			tooltipsOn="left"
			icon={IconCompose}
			iconFilled={IconComposeFilled}
			keybind="global.compose"
		/>
	</div>

	<div class="bottom">
		<ButtonGhost
			help="Switch to {willSwitchThemeTo} theme"
			on:click={() => {
				$theme.variant = willSwitchThemeTo;
			}}
		>
			{#if willSwitchThemeTo === 'light'}
				<IconLightTheme></IconLightTheme>
			{:else if willSwitchThemeTo === 'dark'}
				<IconDarkTheme></IconDarkTheme>
			{:else}
				<IconAutoTheme></IconAutoTheme>
			{/if}
		</ButtonGhost>
		<ButtonGhost
			danger
			on:click={() => {
				window.dispatchEvent(new CustomEvent('NAVTOP_REPORT_ISSUE'));
			}}
		>
			<IconBugReport></IconBugReport>
		</ButtonGhost>
	</div>
</nav>

<style>
	nav {
		position: sticky;
		top: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		width: 90px;
		height: 100dvh;
		padding: 1rem;
		view-transition-name: navigation-side;
	}

	nav .top {
		width: 60px;
		height: 60px;
	}

	nav .top :global(svg) {
		width: 100%;
		height: 100%;
	}

	nav > div {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		font-size: 1.75em;
	}

	nav .middle {
		gap: 1em;
	}

	.avatar {
		display: flex;
		justify-content: center;
		align-items: center;
		border: calc(2 * var(--border-block)) solid transparent;
		border-radius: 50%;
	}

	.avatar.outlined {
		border-color: var(--primary);
	}
</style>
