<script lang="ts">
	import type { KeybindContext } from "$lib/keyboard";

    let {context}: {context: KeybindContext} = $props();
</script>

<svelte:head>
    <meta name="keybinds-context" content={context} />
</svelte:head>
