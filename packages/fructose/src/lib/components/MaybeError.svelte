<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import { type QueryResult } from '$houdini';
	import Alert from '$lib/components/Alert.svelte';
	import ButtonSecondary from '$lib/components/ButtonSecondary.svelte';
	import { debugging } from '$lib/debugging';
	import { refroute } from '$lib/navigation';
	import type { Snippet } from 'svelte';

	// generics="..." should be supported by svelte-eslint-plugin since svelte-eslint-parser@0.34.0
	// but it still doesn't work...
	type Result = $$Generic;
	type Input = $$Generic;

	let { RootLayout } = $derived($page.data);
	let loggedIn = $derived($RootLayout?.data?.loggedIn);

	interface Props {
		result: QueryResult<Result, Input> | null;
		errored?: boolean;
		/** children(data, fetching) */
		children?: Snippet<[NonNullable<QueryResult<Result, Input>['data']>, Boolean]>;
		onSuccess?: (data: Result) => void;
	}

	let { result, errored = $bindable(false), onSuccess, children }: Props = $props();
	$effect(() => {
		errored = !result?.data;
	});

	// $: resultDataNonNull = result!.data as Result;
	const bang = <T,>(x: T) => x!;

	$effect(() => {
		if (result && result.data) onSuccess?.(result.data);
	});
</script>

{#if result && result.data}
	{@render children?.(bang(bang(result).data), bang(result).fetching)}
{:else if result?.errors}
	<Alert theme="danger">
		<h2>Oops!</h2>
		{#if result.errors.length > 1}
			<ul>
				{#each result?.errors as { message }}
					<li>{message}</li>
				{/each}
			</ul>
		{:else if result.errors.length === 1}
			<p>{result.errors[0].message}</p>
		{:else}
			<p>An error occured</p>
		{/if}
		{#if !loggedIn}
			<ButtonSecondary href={refroute('/login')}>Log in</ButtonSecondary>
		{/if}
	</Alert>
{:else if result?.fetching || (result && !result.data)}
	{#if dev || $debugging}
		<pre> {JSON.stringify(result, null, 2)} </pre>
	{/if}
	<section class="loading">
		<p>Chargement...</p>
	</section>
{:else if !result}
	<Alert theme="danger">
		<h2>Hmm…</h2>
		<p>No data was loaded here. This should not happen, the devs messed up!</p>
		<ButtonSecondary on:click={() => window.location.reload()}>Recharger la page</ButtonSecondary>
		<small>(désOwOlé)</small>
	</Alert>
{:else}
	<Alert theme="danger">
		<h2>Wtf‽</h2>
		<p>A veeeeery weird error happened. Here's some info for the devs (good luck 🫶)</p>
		<ButtonSecondary on:click={() => window.location.reload()}>Recharger la page</ButtonSecondary>
		<pre>{JSON.stringify({ result }, null, 2)}</pre>
	</Alert>
{/if}

<style>
	.loading {
		display: flex;
		flex-direction: column;
		gap: 3rem;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
</style>
