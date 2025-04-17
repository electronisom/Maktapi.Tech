<script>
	import Sidebar from "./components/Sidebar.svelte";
	import RightMenu from "./components/RightMenu.svelte";
	import Header from "./components/Header.svelte";
	import VideoWall from "./components/VideoWall.svelte";
	import TableMonitor from "./components/TableMonitor.svelte";
	import Lighting from "./components/Lighting.svelte";
	import LightingSidebar from "./components/lightingsidebar.svelte";
	let isRecording = false;
	let activeView = "display"; // Default view

	function handleMenuSelect(event) {
		activeView = event.detail.id;
		console.log("Selected menu item:", event.detail.id);
	}

	function handleSourceSelect(event) {
		console.log("Selected source:", event.detail.id);
	}

	function handleRecordingToggle(event) {
		isRecording = event.detail.isRecording;
	}

	function handleSourceAdded(event) {
		console.log("Source added:", event.detail);
	}

	function handleControlToggle(event) {
		console.log("Control toggled:", event.detail);
	}
</script>

<main>
	{#if activeView === "imersive"}
		<LightingSidebar
			on:menuSelect={handleMenuSelect}
			on:sourceSelect={handleSourceSelect}
		/>
	{:else}
		<Sidebar
			on:menuSelect={handleMenuSelect}
			on:sourceSelect={handleSourceSelect}
		/>
	{/if}
	<div class="content">
		{#if activeView === "display"}
			<Header {isRecording} />
		{/if}
		<div class="main-content">
			{#if activeView === "display"}
				<div class="video-wall-section">
					<VideoWall on:sourceAdded={handleSourceAdded} />
				</div>
				<div class="monitor-section">
					<TableMonitor />
				</div>
			{:else if activeView === "imersive"}
				<div class="lighting-section">
					<Lighting on:controlToggle={handleControlToggle} />
				</div>
			{/if}
		</div>
	</div>
	{#if activeView === "imersive"}
		<!-- <RightMenu on:recordingToggle={handleRecordingToggle} /> -->
	{:else}
		<RightMenu on:recordingToggle={handleRecordingToggle} />
	{/if}
</main>

<style>
	main {
		display: flex;
		width: 100%;
		max-height: 100vh;
		position: relative;
		background-color: #f5f5f5;
	}

	.content {
		overflow-y: auto;
		flex: 1;
		padding: 1rem;
		background-color: #f5f5f5;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-x: hidden;
		align-items: center;
		width: 100%;
	}

	.main-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.video-wall-section {
		background: #ffffff;
		border-radius: 8px;
		overflow: hidden;
		height: 471px;
		width: 95%;
		padding: 20px;
	}

	.monitor-section {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		min-height: 30vh;
	}

	.lighting-section {
		/* background: #1C1C1E; */
		border-radius: 8px;
		overflow: hidden;
		width: 95%;
		height: calc(100vh - 150px);
	}

	/* Custom Scrollbar Styles */
	:global(::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(::-webkit-scrollbar-track) {
		background: #f1f1f100;
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: #88888800;
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: transparent;
	}

	/* Firefox Scrollbar */
	:global(*) {
		scrollbar-width: thin;
		scrollbar-color: transparent transparent;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
		background-color: #000;
		color: #fff;
		overflow: hidden;
	}
</style>
