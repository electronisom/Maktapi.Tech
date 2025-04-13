<script>
  import { onMount } from 'svelte';

  export let pdfUrl;
  export let width = '100%';
  export let height = '100%';
  export let x = 0;
  export let y = 0;
  export let onMove;
  export let onResize;

  let error = null;
  let loading = false;
  let objectRef;
  let containerRef;
  let isDragging = false;
  let isResizing = false;
  let startX, startY;
  let startWidth, startHeight;
  let startLeft, startTop;

  onMount(() => {
    if (!pdfUrl) {
      error = 'No PDF URL provided';
      return;
    }

    // Normalize the PDF URL
    let normalizedUrl = pdfUrl;
    if (pdfUrl.startsWith('blob:')) {
      normalizedUrl = pdfUrl;
    } else if (!pdfUrl.startsWith('http')) {
      normalizedUrl = new URL(pdfUrl, window.location.origin).href;
    }

    objectRef.data = normalizedUrl;
  });

  function handleObjectError() {
    error = 'Failed to load PDF. Please try opening in a new tab.';
  }

  function handleMouseDown(e) {
    if (e.target.classList.contains('resize-handle')) {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = containerRef.offsetWidth;
      startHeight = containerRef.offsetHeight;
    } else {
      isDragging = true;
      startX = e.clientX - containerRef.offsetLeft;
      startY = e.clientY - containerRef.offsetTop;
    }
    e.preventDefault();
  }

  function handleMouseMove(e) {
    if (isResizing) {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const newWidth = Math.max(200, startWidth + deltaX);
      const newHeight = Math.max(200, startHeight + deltaY);
      
      if (onResize) {
        onResize({ width: newWidth, height: newHeight });
      }
    } else if (isDragging) {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      
      if (onMove) {
        onMove({ x: newX, y: newY });
      }
    }
  }

  function handleMouseUp() {
    isDragging = false;
    isResizing = false;
  }

  // Add event listeners for mouse events
  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });
</script>

<div 
  bind:this={containerRef}
  class="pdf-container" 
  style="width: {width}; height: {height}; left: {x}px; top: {y}px;"
  on:mousedown={handleMouseDown}
>
  {#if error}
    <div class="error-message">
      <p>{error}</p>
      <button on:click={() => window.open(pdfUrl, '_blank')}>Open in New Tab</button>
    </div>
  {:else}
    <div class="pdf-content">
      <object
        bind:this={objectRef}
        class="pdf-object"
        type="application/pdf"
        on:error={handleObjectError}
      >
        <p>Your browser doesn't support PDF viewing. 
          <a href={pdfUrl} target="_blank">Click here to download the PDF</a>
        </p>
      </object>
    </div>
  {/if}
  <div class="resize-handle nw"></div>
  <div class="resize-handle ne"></div>
  <div class="resize-handle sw"></div>
  <div class="resize-handle se"></div>
  <div class="resize-handle n"></div>
  <div class="resize-handle s"></div>
  <div class="resize-handle e"></div>
  <div class="resize-handle w"></div>
  <div class="drag-handle"></div>
</div>

<style>
  .pdf-container {
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
  }

  .pdf-content {
    flex: 1;
    overflow: auto;
    padding: 8px;
    position: relative;
    pointer-events: auto;
  }

  .pdf-object {
    width: 100%;
    height: 100%;
    border: none;
    background: white;
    pointer-events: auto;
  }

  .resize-handle {
    position: absolute;
    background: transparent;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: auto;
  }

  .resize-handle.nw {
    top: 0;
    left: 0;
    width: 20px;
    height: 20px;
    cursor: nw-resize;
  }

  .resize-handle.ne {
    top: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: ne-resize;
  }

  .resize-handle.sw {
    bottom: 0;
    left: 0;
    width: 20px;
    height: 20px;
    cursor: sw-resize;
  }

  .resize-handle.se {
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: se-resize;
  }

  .resize-handle.n {
    top: 0;
    left: 0;
    right: 0;
    height: 10px;
    cursor: n-resize;
  }

  .resize-handle.s {
    bottom: 0;
    left: 0;
    right: 0;
    height: 10px;
    cursor: s-resize;
  }

  .resize-handle.e {
    right: 0;
    top: 0;
    bottom: 0;
    width: 10px;
    cursor: e-resize;
  }

  .resize-handle.w {
    left: 0;
    top: 0;
    bottom: 0;
    width: 10px;
    cursor: w-resize;
  }

  .pdf-container:hover .resize-handle {
    opacity: 1;
  }

  .pdf-container:hover .resize-handle.n,
  .pdf-container:hover .resize-handle.s {
    background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.1), transparent);
  }

  .pdf-container:hover .resize-handle.e,
  .pdf-container:hover .resize-handle.w {
    background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.1), transparent);
  }

  .pdf-container:hover .resize-handle.nw,
  .pdf-container:hover .resize-handle.ne,
  .pdf-container:hover .resize-handle.sw,
  .pdf-container:hover .resize-handle.se {
    background: rgba(0, 0, 0, 0.1);
  }

  .pdf-container.resizing {
    border: 2px solid rgba(0, 0, 0, 0.2);
  }

  .pdf-container.resizing .resize-handle {
    opacity: 1;
  }

  .drag-handle {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40px;
    cursor: move;
    z-index: 5;
  }

  /* Custom scrollbar for PDF content */
  .pdf-content::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .pdf-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .pdf-content::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  .pdf-content::-webkit-scrollbar-thumb:hover {
    background: #666;
  }

  .error-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #ff3e3e;
    text-align: center;
    padding: 1rem;
  }

  .error-message button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #ff3e3e;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .error-message button:hover {
    background: #ff2525;
  }
</style> 