<script>
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { createBrowserClient, isBrowser, parse } from '@supabase/ssr';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	
	let { children, data } = $props();
	let { session, supabase, user } = $derived(data);

	onMount(() => {
		const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="bg-white border-b border-gray-200 px-4 py-2.5 flex justify-between items-center">
	<a href="/" class="text-xl font-bold text-blue-600">My Speaking AI</a>
	<div class="flex gap-4 items-center">
		{#if session}
			<span class="text-sm text-gray-600">{user?.email}님 안녕하세요</span>
			<form action="/auth/logout" method="POST">
				<button type="submit" class="text-sm text-gray-500 hover:text-gray-700 underline">로그아웃</button>
			</form>
		{:else}
			<a href="/login" class="text-sm text-blue-600 hover:underline">로그인</a>
			<a href="/register" class="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700">회원가입</a>
		{/if}
	</div>
</nav>

<main>
	{@render children?.()}
</main>
