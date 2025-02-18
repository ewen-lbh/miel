<script lang="ts" context="module">
	import ButtonGhost from '$lib/components/ButtonGhost.svelte';
	import ModalDrawer from '$lib/components/ModalDrawer.svelte';
	import type { Page } from '@sveltejs/kit';
	import { DropdownMenu } from 'bits-ui';
	import type { SvelteComponent } from 'svelte';
	import type { SvelteHTMLElements } from 'svelte/elements';
	import IconDots from '~icons/msl/more-vert';

	export type ActionData<IconType extends SvelteComponent<SvelteHTMLElements['svg']>> = {
		icon: IconType;
		help?: string;
		label: string;
		href?: string;
		do?: () => void | Promise<void>;
		disabled?: boolean;
		hidden?: boolean;
		keybind?: KeybindExpression;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		overflow?: OverflowMenuAction<any>[];
	};

	export type OverflowMenuAction<IconType extends SvelteComponent<SvelteHTMLElements['svg']>> =
		| ActionData<IconType>
		| ((page: Page) => Promise<ActionData<IconType>> | ActionData<IconType>);
</script>

<script lang="ts" generics="IconType extends SvelteComponent<SvelteHTMLElements['svg']>">
	import { isMobile } from '$lib/mobile';

	import OverflowMenuItem from '$lib/components/OverflowMenuItem.svelte';
	import { cubicOut } from 'svelte/easing';
	import type { TransitionConfig } from 'svelte/transition';
	import type { KeybindExpression } from '$lib/keyboard';

	// eslint-disable-next-line no-undef
	export let actions: OverflowMenuAction<IconType>[];
	export let label = '';
	$: mobile = $isMobile;

	type FlyAndScaleParams = {
		y?: number;
		start?: number;
		duration?: number;
	};

	const defaultFlyAndScaleParams = { y: -8, start: 0.95, duration: 200 };

	export function flyAndScale(node: Element, params?: FlyAndScaleParams): TransitionConfig {
		const style = getComputedStyle(node);
		const transform = style.transform === 'none' ? '' : style.transform;
		const withDefaults = { ...defaultFlyAndScaleParams, ...params };

		const scaleConversion = (
			valueA: number,
			scaleA: [number, number],
			scaleB: [number, number]
		) => {
			const [minA, maxA] = scaleA;
			const [minB, maxB] = scaleB;

			const percentage = (valueA - minA) / (maxA - minA);
			const valueB = percentage * (maxB - minB) + minB;

			return valueB;
		};

		const styleToString = (style: Record<string, number | string | undefined>): string => {
			// eslint-disable-next-line unicorn/no-array-reduce
			return Object.keys(style).reduce((str, key) => {
				if (style[key] === undefined) return str;
				return `${str}${key}:${style[key]};`;
			}, '');
		};

		return {
			duration: withDefaults.duration ?? 200,
			delay: 0,
			css: (t) => {
				const y = scaleConversion(t, [0, 1], [withDefaults.y, 0]);
				const scale = scaleConversion(t, [0, 1], [withDefaults.start, 1]);

				return styleToString({
					transform: `${transform} translate3d(0, ${y}px, 0) scale(${scale})`,
					opacity: t
				});
			},
			easing: cubicOut
		};
	}

	$: console.log({ actions });

	let drawerOpen = false;
</script>

{#if mobile}
	<ModalDrawer bind:open={drawerOpen}>
		<svelte:fragment slot="trigger">
			{#if drawerOpen}
				<slot name="open">
					<slot>
						<IconDots></IconDots>
					</slot>
				</slot>
			{:else}
				<slot><IconDots></IconDots></slot>
			{/if}
		</svelte:fragment>
		{#each actions as action}
			<OverflowMenuItem
				on:click={() => {
					drawerOpen = false;
				}}
				{action}
			/>
		{/each}
	</ModalDrawer>
{:else}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<ButtonGhost>
				<slot>
					<IconDots></IconDots>
				</slot>
				<slot name="hovering" slot="hovering">
					<slot>
						<IconDots></IconDots>
					</slot>
				</slot>
			</ButtonGhost>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content transition={flyAndScale}>
			<DropdownMenu.Label>
				{label}
			</DropdownMenu.Label>
			{#each actions as action}
				<DropdownMenu.Item>
					<OverflowMenuItem {action} />
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}

<style>
	:global([data-menu-trigger]) {
		padding: 0;
		border: none;
	}

	:global([data-menu-content]) {
		z-index: 100;
		padding: 0.5em 0;
		background-color: var(--bg);
		border-radius: var(--radius-block);
		box-shadow: var(--shadow);
		user-select: none;
	}

	:global([data-dialog-trigger]) {
		flex-shrink: 0;
		width: max-content;
		padding: 0.25em;
		font-size: 1em;
	}

	:global([data-menu-label]) {
		padding: 0.5em 1em;
		color: var(--shy);
	}
</style>
