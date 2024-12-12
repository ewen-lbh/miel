<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import Alert from '$lib/components/Alert.svelte';
	import ButtonPrimary from '$lib/components/ButtonPrimary.svelte';
	import InputTextGhost from '$lib/components/InputTextGhost.svelte';
	import { route } from '$lib/ROUTES';
	import type { ActionData, PageData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	const { form }: Props = $props();
</script>

<div class="content">
	<h1>Log in</h1>

	{#if $page.form?.message}
		<Alert theme="danger">
			{$page.form.message}
		</Alert>
	{/if}

	<form method="post" use:enhance>
		<InputTextGhost value="" placeholder="me@example.com" name="email" type="email" label="Email" />
		<InputTextGhost value="" placeholder="" name="password" type="password" label="Password" />

		<ButtonPrimary submits>Log in</ButtonPrimary>
	</form>

	<footer>
		No account? <a class="in-body" href={route('/signup')}>Sign up</a>
	</footer>
</div>

<style>
	.content {
		padding: 0.5rem 2rem;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
	}

	h1 {
		margin-bottom: 2rem;
	}

    footer {
        margin-top: 2rem;
    }

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
