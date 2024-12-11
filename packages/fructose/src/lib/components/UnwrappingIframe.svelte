<script lang="ts">
	import { loaded, type MaybeLoading } from '$lib/loading';
	import { openExternal } from '$lib/native';
	import { tick } from 'svelte';

	interface Props {
		html: MaybeLoading<string>;
		cidSourceUrlTemplate?: (cid: string) => string;
	}

	let mailContentFrame: HTMLIFrameElement | undefined = $state();
	let unwrapInterval: number | NodeJS.Timeout | undefined = $state();

	const { html: htmlContent, cidSourceUrlTemplate }: Props = $props();

	$effect(() => {
		if (!loaded(htmlContent)) return;
		if (!mailContentFrame) return;
		if (mailContentFrame.contentDocument?.body?.hasChildNodes()) return;
		const finalContent = htmlContent
			.replaceAll(
				/src=(['"])cid:(.+?)\1/g,
				(_, quote, cid) => `src=${quote}${cidSourceUrlTemplate?.(cid) ?? ''}${quote}`
			)
			.replace(/<hr .*data-marker="__DIVIDER__".*$/g, '');
		mailContentFrame.contentDocument?.write(finalContent);
		mailContentFrame.contentDocument?.querySelectorAll('a').forEach((a) => {
			a.addEventListener('click', (e) => {
				e.preventDefault();
				openExternal(a.href);
			});
		});
		unwrapFrame();
		unwrapInterval = setInterval(unwrapFrame, 200);
	});

	async function unwrapFrame() {
		if (!mailContentFrame?.contentDocument?.body) return;
		const frameBody = mailContentFrame.contentDocument.body;

		await tick();
		if (frameBody.scrollHeight <= mailContentFrame.clientHeight) {
			return;
		}
		mailContentFrame.style.height = `${frameBody.scrollHeight + 50}px`;
	}
</script>

<iframe title="Mail content" bind:this={mailContentFrame} class="mail-content"></iframe>

<style>
	iframe {
		border: none;
		/* for now... */
		background: white;
		width: 100%;
	}
</style>
