<script lang="ts">
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import ButtonGhost from '$lib/components/ButtonGhost.svelte';
	import ButtonNavigation from '$lib/components/ButtonNavigation.svelte';
	import IconBugReport from '~icons/msl/bug-report-outline';
	import IconHomeFilled from '~icons/msl/home';
	import IconHome from '~icons/msl/home-outline';

	let animatingChurrosLogo = false;

	beforeNavigate(() => {
		animatingChurrosLogo = true;
	});
	afterNavigate(() => {
		setTimeout(() => {
			animatingChurrosLogo = false;
		}, 1000);
	});
</script>

<nav>
	<div class="top">
		<ButtonNavigation
			href="/"
			routeID="/(app)"
			on:click={() => {
				animatingChurrosLogo = true;
				setTimeout(() => {
					animatingChurrosLogo = false;
				}, 1000);
			}}
		>
			Mi
		</ButtonNavigation>
	</div>
	<div class="middle">
		<ButtonNavigation
			href="/"
			routeID="/(app)"
			label="Accueil"
			tooltipsOn="left"
			icon={IconHome}
			iconFilled={IconHomeFilled}
		/>

		<!-- <ButtonNavigation
			href="/search"
			routeID="/(app)/search/[[q]]"
			label="Explorer"
			tooltipsOn="left"
			icon={IconSearch}
		/>

		<ButtonNavigation
			href={route('/events')}
			routeID="/(app)/events/[[week=date]]"
			label="Événements"
			tooltipsOn="left"
			icon={IconEvents}
			iconFilled={IconEventsFilled}
		/>

		<ButtonNavigation
			href={route('/services')}
			routeID="/(app)/services"
			label="Services"
			tooltipsOn="left"
			icon={IconServices}
			iconFilled={IconServicesFilled}
		/> -->
	</div>

	<div class="bottom">
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
</style>
