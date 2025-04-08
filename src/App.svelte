<script>
	import { Router, Link, Route } from "svelte-routing";
	import { onMount } from 'svelte';
	import { isAuthenticated } from './stores/auth';
	import Login from './login.svelte';
	import Sidebar from './components/Sidebar.svelte';
	import RightMenu from './components/RightMenu.svelte';
	import Header from './components/Header.svelte';
	import VideoWall from './components/VideoWall.svelte';
	import TableMonitor from './components/TableMonitor.svelte';
	
	export let url = "";
	let isRecording = false;

	// Redirect to login if not authenticated
	onMount(() => {
		if (!$isAuthenticated && window.location.pathname !== '/login') {
			window.location.href = '/login';
		}
	});

	function handleMenuSelect(event) {
		console.log('Selected menu item:', event.detail.id);
	}

	function handleSourceSelect(event) {
		console.log('Selected source:', event.detail.id);
	}

	function handleRecordingToggle(event) {
		isRecording = event.detail.isRecording;
	}

	function handleSourceAdded(event) {
		console.log('Source added:', event.detail);
	}
</script>

<Router {url}>
	<main>
		<Route path="/login" component={Login} />
		<Route path="/*">
			{#if $isAuthenticated}
				<div class="app-container">
					<Sidebar 
						on:menuSelect={handleMenuSelect}
						on:sourceSelect={handleSourceSelect}
					/>
					<div class="content">
						<Header {isRecording} />
						<div class="main-content">
							<div class="video-wall-section">
								<VideoWall on:sourceAdded={handleSourceAdded} />
							</div>
							<div class="monitor-section">
								<TableMonitor />
							</div>
						</div>
					</div>
					<RightMenu 
						on:recordingToggle={handleRecordingToggle}
					/>
				</div>
			{:else}
				<Login />
			{/if}
		</Route>
	</main>
</Router>

<style>
	main {
		width: 100%;
		height: 100vh;
		background-color: #E4E4E4;
	}

	.app-container {
		display: flex;
		width: 100%;
		height: 100%;
	}
	
	.content {
		overflow-y: auto;
		flex: 1;
		padding: 1rem;
		background-color: #E4E4E4;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-x: hidden;
	}

	.main-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.video-wall-section {
		background: #1a1a1a;
		border-radius: 8px;
		overflow: hidden;
		min-height: 70vh;
	}

	.monitor-section {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		min-height: 30vh;
	}

	/* Global styles */
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
			Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		background-color: #000;
		color: #fff;
		overflow: hidden;
	}

	/* Custom Scrollbar Styles */
	:global(::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(::-webkit-scrollbar-track) {
		background: #f1f1f1;
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: #888;
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: #555;
	}

	/* Firefox Scrollbar */
	:global(*) {
		scrollbar-width: thin;
		scrollbar-color: #888 #f1f1f1;
	}
</style>