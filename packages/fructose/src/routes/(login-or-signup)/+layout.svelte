<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { cache, graphql, type Login$input, type Signup$input } from '$houdini';
	import ButtonPrimary from '$lib/components/ButtonPrimary.svelte';
	import InputTextGhost from '$lib/components/InputTextGhost.svelte';
	import { isRoute } from '$lib/navigation';
	import { route } from '$lib/ROUTES';
	import { toasts } from '$lib/toasts';
	import { serialize } from 'cookie';

	let credentials: Login$input & Signup$input = $state({ email: '', password: '' });

	const Signup = graphql(`
		mutation Signup($email: String!, $password: String!) {
			signup(email: $email, password: $password) {
				...MutationErrors
				... on NewSession {
					token
				}
			}
		}
	`);
	const Login = graphql(`
		mutation Login($email: String!, $password: String!) {
			login(email: $email, password: $password) {
				...MutationErrors
				... on NewSession {
					token
				}
			}
		}
	`);

	let loggingIn = $derived(isRoute($page, '/login'));
</script>

<div class="content">
	<h1>
		{#if loggingIn}Log in{:else}Sign up{/if}
	</h1>

	<form
		method="post"
		onsubmit={async (e) => {
			e.preventDefault();
			let token = '';

			if (loggingIn) {
				const result = await Login.mutate(credentials);
				if (toasts.mutation(result, 'login', '', 'Could not log in')) {
					token = result.data.login.token;
				}
			} else {
				const result = await Signup.mutate(credentials);
				if (toasts.mutation(result, 'signup', '', 'Could not sign up')) {
					token = result.data.signup.token;
				}
			}

			if (token) {
				document.cookie = serialize('token', token, { path: '/' });
				cache.reset();
				await goto(route('/'));
			}
		}}
	>
		<InputTextGhost
			updateWhileTyping
			bind:value={credentials.email}
			placeholder="me@example.com"
			name="email"
			type="email"
			label="Email"
		/>
		<InputTextGhost
			updateWhileTyping
			bind:value={credentials.password}
			placeholder=""
			name="password"
			type="password"
			label="Password"
		/>

		<ButtonPrimary submits>
			{#if loggingIn}
				Log in
			{:else}
				Sign up
			{/if}
		</ButtonPrimary>
	</form>

	{#if loggingIn}
		<footer>
			No account? <a class="in-body" href={route('/signup')}>Sign up</a>
		</footer>
	{/if}
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
