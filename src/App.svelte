<script>
	import Sidebar from "./components/Sidebar.svelte";
	import RightMenu from "./components/RightMenu.svelte";
	import Header from "./components/Header.svelte";
	import VideoWall from "./components/VideoWall.svelte";
	import TableMonitor from "./components/TableMonitor.svelte";
	import Lighting from "./components/Lighting.svelte";
	import LightingSidebar from "./components/lightingsidebar.svelte";
	// import { Analytics } from "@vercel/analytics/react"
	let isRecording = false;
	let activeView = "display"; // Default view
	let activeComponent = "videowall"; // Track which component is visible
	let mainContentRef; // Reference to the main content div

	function handleScroll(event) {
		if (!mainContentRef) return;
		
		const scrollPosition = mainContentRef.scrollTop;
		const threshold = window.innerHeight * 0.3; // 30% of viewport height as threshold
		
		if (scrollPosition > threshold) {
			activeComponent = "tablemonitor";
		} else {
			activeComponent = "videowall";
		}
	}

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
		<div 
			class="main-content" 
			bind:this={mainContentRef}
			on:scroll={handleScroll}
		>
			{#if activeView === "display"}
				<div class="component-container">
					<div class="video-wall-section" class:active={activeComponent === "videowall"}>
						<VideoWall on:sourceAdded={handleSourceAdded} />
					</div>
					<div class="monitor-section" class:active={activeComponent === "tablemonitor"}>
						<TableMonitor />
					</div>
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
		background-color: rgb(243, 243, 243);
	}

	.content {
		overflow-y: auto;
		flex: 1;
		padding: 0rem 1rem;
		background-color: rgb(243, 243, 243);
		display: flex;
		flex-direction: column;
		gap: 0rem;
		overflow-x: hidden;
		align-items: center;
		width: 100%;
	}

	.main-content {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%;
		height: auto;
		min-height: calc(100vh - 100px);
		overflow-y: auto;
		scroll-behavior: smooth;
		padding: 20px 20px;
		justify-content: center;
	}

	.component-container {
		position: relative;
		height: auto;
		width: 100%;
		min-height: 100%;
	}

	.video-wall-section {
		position: relative;
		background: rgba(255, 255, 255, 1);
		border-radius: 24px;
		height: 430px;
		width: 97%;
		padding: 30px 20px;
		margin: 0 auto;
		opacity: 1;
		pointer-events: all;
	}

	.monitor-section {
		position: relative;
		background: #ffffff;
		border-radius: 24px;
		height: 430px;
		width: 97%;
		padding: 30px 20px;
		margin: 20px auto 0;
		opacity: 1;
		pointer-events: all;
	}

	.video-wall-section.active,
	.monitor-section.active {
		opacity: 1;
		pointer-events: all;
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
