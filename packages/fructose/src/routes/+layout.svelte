<script lang="ts">
	import { browser } from '$app/environment';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';
	import { CURRENT_VERSION } from '$lib/buildinfo';
	import NavigationBottom from '$lib/components/NavigationBottom.svelte';
	import NavigationSide from '$lib/components/NavigationSide.svelte';
	import NavigationTop, { type NavigationContext } from '$lib/components/NavigationTop.svelte';
	import { isMobile } from '$lib/mobile';
	import { scrollableContainer, setupScrollPositionRestorer } from '$lib/scroll';
	import { isDark } from '$lib/theme';
	import { setupViewTransition } from '$lib/view-transitions';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import type { PageData } from './$houdini';

	onNavigate(setupViewTransition);

	const mobile = isMobile();
	export let data: PageData;

	let scrolled = false;
	setupScrollPositionRestorer(
		() => scrollableContainer(mobile),
		(isScrolled) => {
			scrolled = isScrolled;
		}
	);

	const navtop = writable<NavigationContext>({
		actions: [],
		title: null,
		quickAction: null,
		back: null
	});
	setContext('navtop', navtop);

	$: if (browser && $page.route.id) document.body.dataset.route = $page.route.id;
</script>

<div class="layout" id="layout" class:mobile>
	<header class="left">
		<NavigationSide />
	</header>

	<div class="mobile-area">
		<header class="nav-top">
			<NavigationTop {scrolled}></NavigationTop>
			<div class="cap">
				<div class="corner-left-wrapper corner-wrapper">
					<svg
						class="corner-left"
						width="30"
						height="30"
						viewBox="0 0 30 30"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M30 0H0V30H1.36362C1.36362 14.1845 14.1846 1.36359 30 1.36359L30 0Z"
							fill="var(--bg)"
						/>
						<path
							d="M1.36362 30C1.36362 14.1845 14.1846 1.36359 30 1.36359"
							stroke="var(--scrollable-area-border-color)"
							stroke-width="var(--border-block)"
						/>
					</svg>
				</div>
				<div class="middle"></div>
				<div class="corner-right-wrapper corner-wrapper">
					<svg
						class="corner-right"
						width="30"
						height="30"
						viewBox="0 0 30 30"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M0 0H30V30H28.6364C28.6364 14.1845 15.8154 1.36359 2.86102e-06 1.36359L0 0Z"
							fill="var(--bg)"
						/>
						<path
							d="M28.6364 30C28.6364 14.1845 15.8154 1.36359 0 1.36359"
							stroke="var(--scrollable-area-border-color)"
							stroke-width="var(--border-block)"
						/>
					</svg>
				</div>
			</div>
		</header>

		<div id="scrollable-area" class="contents-and-announcements">
			<div class="page-content">
				<slot />
			</div>
		</div>
		<div class="nav-bottom">
			<NavigationBottom />
		</div>
	</div>

	<aside class="right">
		<footer class="muted">
			<p>
				Churros v{CURRENT_VERSION}
				· <wbr />Made by <a href="https://net7.dev">net7</a>
				· <wbr /><a href="/credits">À propos</a>
				· <wbr /><a href={env.PUBLIC_REPOSITORY_URL}>Code source</a>
				· <wbr /><a href="https://www.gnu.org/licenses/agpl-3.0.en.html#license-text"
					>Licensed under AGPL-v3.0</a
				>
				· <wbr />&copy;&nbsp;{new Date().getFullYear()}&nbsp;<a href="https://churros.app/@devs"
					>Churros DevTeam</a
				>
			</p>
			<a href="https://net7.dev" class="net7-logo">
				<img
					height="50px"
					width="100px"
					src="https://net7.dev/images/net7_{$isDark ? 'white' : 'dark'}.svg"
					alt="net7"
				/>
			</a>
		</footer>
	</aside>
</div>

<style>
	/**

  Layout:

  +---------------------------------------------+
  |  sidebar  |      topbar         |   aside   |
  |  sidebar  |      cap            |   aside   |
  |  sidebar  | scrollable area     |   aside   |
  |  sidebar  |      bottombar      |   aside   |
  +---------------------------------------------+

  cap + topbar = nav-top
  nav-top + scrollable area + bottombar : mobile-area
  aside : contains stuff like login form, quick access, footer
          TODO: API kinda like navtop, so allow pages to contribute content here.
  

  - On desktop:

  - The root element is the scrollable area. This allows using the scroll wheel anywhere on the page. In order to have that rounded border on top of the scrollable content while keeping the scroll on the body, we need to have the border-radius'd part as a separate element that doesn't move (has position: sticky): that's "cap" (no 🧢 fr fr).
  - The scrollable-area has padding so that the content doesn't go under the cap's rounded corners on scroll

  - On mobile:

  - sidebar and aside as well as cap are all hidden
  - the mobile-area is a flex element, nav top is not sticky but static, and the element with the scrollbar is scrollable-area: this is so that scaling down the background when opening a drawer does not fuck up the nav bars (if they're position: fixed, they fly out of the element when the [data-vaul-drawer-wrapper] is scaled down). UX-wise this is fine as the mobile-area takes the entire screen width on mobile.
  - the scrollable-area kisses the screen's borders: this is important to have full-width content like posts cards.
  */

	.layout {
		display: grid;
		grid-template-columns: 1fr minmax(300px, var(--scrollable-content-width, 1000px)) 1fr;
		gap: 2rem;
		width: 100dvw;

		/* TODO animate --scrollable-content-width changes */

		--scrollable-area-border-color: var(--bg3);

		/* Waiting on https://drafts.csswg.org/css-env-1/ to use variables in media queries */
		/* --width-mobile: 900px; */
	}

	.layout .left {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		align-self: start;
	}

	.layout .right {
		position: sticky;
		top: 0;
		right: 0;
		bottom: 0;
		align-self: start;
		max-width: 300px;
		padding-top: 100px;
	}

	.layout .mobile-area {
		grid-column: 2;
	}

	#scrollable-area {
		display: flex;
		flex-direction: column;
		max-width: var(--scrollable-content-width, 1000px);
	}

	.layout .nav-bottom {
		display: none;
	}

	.cap {
		display: flex;
		justify-content: space-between;
		height: 30px;
	}

	.cap .middle {
		flex-grow: 1;
		background: transparent;
		border-top: 1px solid var(--scrollable-area-border-color);
	}

	.cap .corner-wrapper {
		position: relative;
		width: 30px;
		height: 30px;
		/* background: var(--bg); */
	}

	.cap .corner-left,
	.cap .corner-right {
		position: absolute;
		inset: 0;
		z-index: 1000;
		height: 30px;
		width: 30px;
	}
	.nav-top {
		position: sticky;
		top: 0;
		z-index: 20;
	}

	@media (max-width: 900px) {
		.cap {
			display: none;
		}

		.layout .left {
			display: none;
		}

		.layout .right {
			display: none;
		}

		.mobile-area .nav-top,
		.mobile-area .nav-bottom {
			position: static;
			display: block;
		}

		.mobile-area {
			display: flex;
			flex-direction: column;
			width: 100dvw;
			height: 100dvh;
		}

		.layout {
			display: flex;
		}

		#scrollable-area {
			flex: 1;
			width: 100dvw;
			padding: 1rem 0;
			overflow: auto;
		}
	}

	.page-content {
		display: flex;
		flex-grow: 1;
		flex-direction: column;
	}

	footer {
		margin-top: 4rem;
	}

	footer p {
		margin-bottom: 2rem;
		font-size: 0.8rem;
	}

	footer p a {
		color: var(--text);
		text-decoration: underline;
		text-decoration-thickness: unset;
		text-underline-offset: unset;
	}

	footer .net7-logo {
		opacity: 0.5;
	}

	footer .net7-logo:hover {
		opacity: 1;
	}

	@media (min-width: 900px) {
		#scrollable-area {
			height: 100%;
			/* padding: 30px; */
			border-right: solid 1px var(--scrollable-area-border-color);
			border-left: solid 1px var(--scrollable-area-border-color);
		}
	}

	@keyframes spinner {
		from {
			transform: rotate(0);
		}

		to {
			transform: rotate(1turn);
		}
	}

	:root.error-404 {
		--bg: #000;
		--text: #25bf22;
		--border: #25bf22;
		--primary: #54fe54;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes fade-out {
		to {
			opacity: 0;
		}
	}

	@keyframes slide-from-right {
		from {
			transform: scale(0.95);
		}
	}

	@keyframes slide-to-left {
		to {
			transform: scale(1.05);
		}
	}

	:root::view-transition-old(root) {
		animation:
			90ms ease both fade-out,
			200ms ease both slide-to-left;
	}

	:root::view-transition-new(root) {
		animation:
			110ms ease both fade-in,
			200ms ease both slide-from-right;
	}
</style>
