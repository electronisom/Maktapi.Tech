<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  // Initial items that show when the application loads
  let videoWallItems = [
    {
      id: 'presentation',
      type: 'presentation',
      stream: null,
      videoElement: null,
      thumbnail: 'https://s8.ezgif.com/tmp/ezgif-8348ef61fb576.png',
      content: null,
      position: { x: 0, y: 0 },
      size: { width: 535, height: 321 }
    },
  ];

  let draggedItem = null;
  let resizingItem = null;
  let dragOffset = { x: 0, y: 0 };
  let wallRef;
  let wallHeight = 471;
  let isResizingWall = false;
  let initialY = 0;
  let initialHeight = 0;
  let isResizing = false;
  let initialX = 0;
  let initialSize = { width: 0, height: 0 };
  let initialPosition = { x: 0, y: 0 };
  let resizeDirection = '';
  let isFullscreen = false;
  let videoWallRef;

  // Add new functions for button actions
  function handleSelectAll() {
    dispatch('selectAll', { items: videoWallItems });
  }

  // Add new function to toggle camera stream
  async function toggleCamera(item) {
    if (item.stream) {
      // Stop the current stream
      item.stream.getTracks().forEach(track => track.stop());
      item.stream = null;
      if (item.videoElement) {
        item.videoElement.srcObject = null;
      }
      // Remove the item from the wall
      videoWallItems = videoWallItems.filter(i => i.id !== item.id);
    } else {
      try {
        // Start a new stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        });
        
        // Create new item with the stream
        const newItem = {
          ...item,
          stream,
          videoElement: null,
          position: item.position,
          size: item.size
        };
        
        // Add the new item back to the wall
        videoWallItems = [...videoWallItems, newItem];
      } catch(err) {
        console.error('Failed to get camera:', err);
      }
    }
  }

  // Update handleCloseAll to properly handle camera streams
  async function handleCloseAll() {
    // Stop all video streams before removing (except presentation)
    for (const item of videoWallItems) {
      if (item.type !== 'presentation') {  // Skip presentation items
        if (item.stream) {
          item.stream.getTracks().forEach(track => track.stop());
        }
        if (item.videoElement) {
          item.videoElement.srcObject = null;
        }
      }
    }
    
    // Keep only presentation items
    videoWallItems = videoWallItems.filter(item => item.type === 'presentation');
    dispatch('closeAll');
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function startDragging(e, item) {
    if (e.target.classList.contains('resize-handle')) return;
    
    draggedItem = item;
    const rect = e.target.getBoundingClientRect();
    dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  // Modify isColliding function to prevent any overlaps
  function isColliding(rect1, rect2) {
    // Always return true if there's any overlap
    return !(rect1.x + rect1.width <= rect2.x ||
             rect1.x >= rect2.x + rect2.width ||
             rect1.y + rect1.height <= rect2.y ||
             rect1.y >= rect2.y + rect2.height);
  }

  // Add function to find nearest valid position
  function findNearestValidPosition(newRect, items, currentItemId) {
    const otherItems = items.filter(item => item.id !== currentItemId);
    
    // If no collision, return original position
    if (!otherItems.some(item => isColliding(newRect, {
      x: item.position.x,
      y: item.position.y,
      width: item.size.width,
      height: item.size.height
    }))) {
      return { x: newRect.x, y: newRect.y };
    }

    // Search for nearest valid position
    const gridSize = 10; // Grid size for position search
    let minDistance = Infinity;
    let bestPosition = { x: newRect.x, y: newRect.y };

    // Search in expanding circles
    for (let radius = gridSize; radius < Math.max(wallRef.clientWidth, wallRef.clientHeight); radius += gridSize) {
      for (let angle = 0; angle < 360; angle += 15) {
        const testX = newRect.x + radius * Math.cos(angle * Math.PI / 180);
        const testY = newRect.y + radius * Math.sin(angle * Math.PI / 180);

        // Ensure position is within wall boundaries
        if (testX < 0 || testY < 0 || 
            testX + newRect.width > wallRef.clientWidth || 
            testY + newRect.height > wallRef.clientHeight) {
          continue;
        }

        const testRect = {
          x: testX,
          y: testY,
          width: newRect.width,
          height: newRect.height
        };

        // Check if this position collides with any other item
        const hasCollision = otherItems.some(item => isColliding(testRect, {
          x: item.position.x,
          y: item.position.y,
          width: item.size.width,
          height: item.size.height
        }));

        if (!hasCollision) {
          const distance = Math.sqrt(
            Math.pow(testX - newRect.x, 2) + 
            Math.pow(testY - newRect.y, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            bestPosition = { x: testX, y: testY };
          }
        }
      }

      // If we found a valid position, use it
      if (minDistance !== Infinity) {
        break;
      }
    }

    return bestPosition;
  }

  // Modify findLargestEmptySpace function to handle all sources
  function findLargestEmptySpace(items, wallWidth, wallHeight) {
    // Start with the entire wall as a potential space
    let spaces = [{
      x: 0,
      y: 0,
      width: wallWidth,
      height: wallHeight
    }];

    // Sort items by position to ensure consistent space splitting
    const sortedItems = [...items].sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });

    // For each item, split the spaces
    for (const item of sortedItems) {
      const newSpaces = [];
      for (const space of spaces) {
        // If the item doesn't overlap with this space, keep it
        if (!isColliding(space, {
          x: item.position.x,
          y: item.position.y,
          width: item.size.width,
          height: item.size.height
        })) {
          newSpaces.push(space);
          continue;
        }

        // Split the space into non-overlapping regions
        // Left space
        if (item.position.x > space.x) {
          newSpaces.push({
            x: space.x,
            y: space.y,
            width: item.position.x - space.x,
            height: space.height
          });
        }

        // Right space
        if (item.position.x + item.size.width < space.x + space.width) {
          newSpaces.push({
            x: item.position.x + item.size.width,
            y: space.y,
            width: space.x + space.width - (item.position.x + item.size.width),
            height: space.height
          });
        }

        // Top space
        if (item.position.y > space.y) {
          newSpaces.push({
            x: space.x,
            y: space.y,
            width: space.width,
            height: item.position.y - space.y
          });
        }

        // Bottom space
        if (item.position.y + item.size.height < space.y + space.height) {
          newSpaces.push({
            x: space.x,
            y: item.position.y + item.size.height,
            width: space.width,
            height: space.y + space.height - (item.position.y + item.size.height)
          });
        }
      }
      spaces = newSpaces;
    }

    // Filter out spaces that are too small
    const minSize = 200; // Minimum size for a usable space
    spaces = spaces.filter(space => 
      space.width >= minSize && 
      space.height >= minSize
    );

    // Find the largest space
    let largestSpace = null;
    let maxArea = 0;
    for (const space of spaces) {
      const area = space.width * space.height;
      if (area > maxArea) {
        maxArea = area;
        largestSpace = space;
      }
    }

    return largestSpace;
  }

  // Modify handleDrag function
  function handleDrag(e) {
    if (!draggedItem) return;
    
    const wallRect = wallRef.getBoundingClientRect();
    const rawX = e.clientX - wallRect.left - dragOffset.x;
    const rawY = e.clientY - wallRect.top - dragOffset.y;
    
    // Constrain to wall boundaries including current height
    const x = Math.max(0, Math.min(rawX, wallRect.width - draggedItem.size.width));
    const y = Math.max(0, Math.min(rawY, wallHeight - draggedItem.size.height));
    
    // Update the item's position
    videoWallItems = videoWallItems.map(item => 
      item.id === draggedItem.id 
        ? { ...item, position: { x, y } }
        : item
    );
  }

  function stopDragging() {
    if (draggedItem) {
      const item = videoWallItems.find(i => i.id === draggedItem.id);
      console.log(`Source "${draggedItem.id}" final position:`, {
        position: item.position,
        size: item.size,
        type: item.type
      });
    }
    draggedItem = null;
  }

  function startResizing(e, item, direction) {
    e.stopPropagation();
    e.preventDefault();
    isResizing = true;
    resizingItem = item;
    resizeDirection = direction;
    initialX = e.clientX;
    initialY = e.clientY;
    initialSize = { ...item.size };
    initialPosition = { ...item.position };
    console.log('Started resizing:', { id: item.id, direction });
  }

  function handleResize(e) {
    if (!isResizing || !resizingItem) return;

    e.preventDefault();
    const dx = e.clientX - initialX;
    const dy = e.clientY - initialY;
    const wallRect = wallRef.getBoundingClientRect();

    let newWidth = initialSize.width;
    let newHeight = initialSize.height;
    const minSize = 50; // Reduced from 200 to 50 pixels
    const maxWidth = wallRect.width;
    const maxHeight = wallHeight;

    // Calculate new dimensions based on resize direction
    if (resizeDirection.includes('e')) {
      newWidth = Math.max(minSize, Math.min(maxWidth - resizingItem.position.x, initialSize.width + dx));
    }
    if (resizeDirection.includes('w')) {
      const potentialWidth = Math.max(minSize, initialSize.width - dx);
      if (potentialWidth !== newWidth) {
        newWidth = potentialWidth;
        resizingItem.position.x = Math.min(wallRect.width - minSize, Math.max(0, initialPosition.x + dx));
      }
    }
    if (resizeDirection.includes('s')) {
      newHeight = Math.max(minSize, Math.min(maxHeight - resizingItem.position.y, initialSize.height + dy));
    }
    if (resizeDirection.includes('n')) {
      const potentialHeight = Math.max(minSize, initialSize.height - dy);
      if (potentialHeight !== newHeight) {
        newHeight = potentialHeight;
        resizingItem.position.y = Math.min(wallHeight - minSize, Math.max(0, initialPosition.y + dy));
      }
    }

    // Update the item's size
    videoWallItems = videoWallItems.map(item => {
      if (item.id === resizingItem.id) {
        return {
          ...item,
          size: { width: newWidth, height: newHeight },
          position: { ...item.position }
        };
      }
      return item;
    });
  }

  function stopResizing() {
    if (resizingItem) {
      console.log('Stopped resizing:', { 
        id: resizingItem.id, 
        finalSize: resizingItem.size 
      });
    }
    isResizing = false;
    resizingItem = null;
    resizeDirection = '';
  }

  // Modify handleDrop function to ensure no overlaps
  async function handleDrop(e) {
    e.preventDefault();
    const sourceType = e.dataTransfer.getData('sourceType');
    const sourceId = e.dataTransfer.getData('sourceId');
    const isScreenShare = e.dataTransfer.getData('isScreenShare') === 'true';

    if (!videoWallItems.find(item => item.id === sourceId)) {
      let stream = null;

      if (sourceType === 'camera') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: true
          });
        } catch(err) {
          console.error('Failed to get camera:', err);
        }
      } else if (sourceType === 'sharepoint' || sourceType === 'screen' || isScreenShare) {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: {
              cursor: "always",
              displaySurface: "monitor"
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          });
          
          stream.getVideoTracks()[0].onended = () => {
            console.log('Screen sharing stopped');
            videoWallItems = videoWallItems.filter(item => item.id !== sourceId);
          };
        } catch(err) {
          console.error('Failed to start screen sharing:', err);
        }
      }

      if (stream || sourceType === 'presentation') {
        const wallRect = wallRef.getBoundingClientRect();
        const dropX = e.clientX - wallRect.left;
        const dropY = e.clientY - wallRect.top;
        
        // Default size for new items
        const defaultSize = {
          width: 400,
          height: 300
        };

        // Create new item at drop position
        const newItem = {
          id: sourceId,
          type: sourceType,
          stream,
          videoElement: null,
          position: {
            x: Math.max(0, Math.min(dropX - defaultSize.width/2, wallRect.width - defaultSize.width)),
            y: Math.max(0, Math.min(dropY - defaultSize.height/2, wallHeight - defaultSize.height))
          },
          size: defaultSize
        };

        // Add the new item
        videoWallItems = [...videoWallItems, newItem];
        dispatch('sourceAdded', { sourceId, sourceType });
      }
    }
  }

  function handleVideoRef(element, item) {
    if (element && item.stream) {
      console.log('Setting up video element for:', item.id);
      element.srcObject = item.stream;
      element.muted = true; // Mute by default to prevent audio feedback
      
      // Add controls for screen share
      if (item.type === 'sharepoint' || item.type === 'screen') {
        element.controls = true;
      }
      
      element.play().catch(err => console.error('Failed to play video:', err));
    }
  }

  function startWallResize(e) {
    e.preventDefault();
    e.stopPropagation();
    isResizingWall = true;
    initialY = e.clientY;
    initialHeight = wallHeight;
  }

  function handleWallResize(e) {
    if (!isResizingWall) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const dy = e.clientY - initialY;
    const minHeight = 300;
    const maxHeight = window.innerHeight - 100;
    
    wallHeight = Math.min(maxHeight, Math.max(minHeight, initialHeight + dy));
  }

  function stopWallResize() {
    isResizingWall = false;
  }

  function handleFullscreen() {
    if (!document.fullscreenElement) {
      // Change to use the container element for fullscreen
      const container = document.querySelector('.video-wall-container');
      if (container) {
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
          container.msRequestFullscreen();
        }
        isFullscreen = true;
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      isFullscreen = false;
    }
  }
</script>

<div class="video-wall-container" bind:this={videoWallRef}>
  <div class="header">
    <div class="left">
      <div class="buttons">
        <button class="control-btn power-btn" on:click={handleCloseAll}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
          </svg>
        </button>
        <button class="control-btn fullscreen-btn" on:click={handleFullscreen}>
          {#if !isFullscreen}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="20" height="20" rx="10" fill="#34C759"/>
              <path d="M15.3906 5.3125V8.125C15.3906 8.31148 15.3165 8.49032 15.1847 8.62218C15.0528 8.75405 14.874 8.82812 14.6875 8.82812C14.501 8.82812 14.3222 8.75405 14.1903 8.62218C14.0585 8.49032 13.9844 8.31148 13.9844 8.125V7.01172L11.6693 9.32734C11.5372 9.45943 11.3581 9.53364 11.1713 9.53364C10.9845 9.53364 10.8053 9.45943 10.6732 9.32734C10.5412 9.19525 10.4669 9.0161 10.4669 8.8293C10.4669 8.64249 10.5412 8.46334 10.6732 8.33125L12.9883 6.01562H11.875C11.6885 6.01562 11.5097 5.94155 11.3778 5.80968C11.246 5.67782 11.1719 5.49898 11.1719 5.3125C11.1719 5.12602 11.246 4.94718 11.3778 4.81532C11.5097 4.68345 11.6885 4.60938 11.875 4.60938H14.6875C14.874 4.60938 15.0528 4.68345 15.1847 4.81532C15.3165 4.94718 15.3906 5.12602 15.3906 5.3125ZM8.33066 10.6744L6.01562 12.9883V11.875C6.01562 11.6885 5.94155 11.5097 5.80968 11.3778C5.67782 11.246 5.49898 11.1719 5.3125 11.1719C5.12602 11.1719 4.94718 11.246 4.81532 11.3778C4.68345 11.5097 4.60938 11.6885 4.60938 11.875V14.6875C4.60938 14.874 4.68345 15.0528 4.81532 15.1847C4.94718 15.3165 5.12602 15.3906 5.3125 15.3906H8.125C8.31148 15.3906 8.49032 15.3165 8.62218 15.1847C8.75405 15.0528 8.82812 14.874 8.82812 14.6875C8.82812 14.501 8.75405 14.3222 8.62218 14.1903C8.49032 14.0585 8.31148 13.9844 8.125 13.9844H7.01172L9.32734 11.6693C9.45943 11.5372 9.53364 11.3581 9.53364 11.1713C9.53364 10.9845 9.45943 10.8053 9.32734 10.6732C9.19525 10.5412 9.0161 10.4669 8.8293 10.4669C8.64249 10.4669 8.46334 10.5412 8.33125 10.6732L8.33066 10.6744Z" fill="white"/>
            </svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="20" height="20" rx="10" fill="#34C759"/>
              <path d="M6.66666 13.3333V16.6667H3.33332M13.3333 16.6667H16.6667V13.3333M16.6667 6.66667V3.33333H13.3333M3.33332 3.33333H6.66666V6.66667" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {/if}
        </button>
      </div>
    </div>
    <div class="right">
      <span class="drag-text">Video Wall</span>
      <span class="subtitle">Drag from sources</span>
    </div>
  </div>

  <div 
    class="video-wall" 
    bind:this={wallRef}
    on:dragover={handleDragOver} 
    on:drop={handleDrop}
    on:mousemove={(e) => {
      if (isResizing) handleResize(e);
      else if (isResizingWall) handleWallResize(e);
      else if (draggedItem) handleDrag(e);
    }}
    on:mouseup={() => {
      stopDragging();
      stopResizing();
      stopWallResize();
    }}
    on:mouseleave={() => {
      stopDragging();
      stopResizing();
      stopWallResize();
    }}
    style="height: {wallHeight}px;"
  >
    {#each videoWallItems as item (item.id)}
      <div
        class="video-item"
        style="
          position: absolute;
          left: {item.position.x}px;
          top: {item.position.y}px;
          width: {item.size.width}px;
          height: {item.size.height}px;
        "
        on:mousedown={(e) => startDragging(e, item)}
      >
        {#if item.type === 'camera' || item.type === 'screen' || item.type === 'sharepoint'}
          <div class="video-container">
            <video 
              autoplay 
              playsinline
              muted={item.type !== 'sharepoint'} 
              bind:this={item.videoElement}
              use:handleVideoRef={item}
              class="video-element"
            ></video>
            {#if item.type === 'sharepoint' || item.type === 'screen'}
              <div class="screen-share-overlay">
                <span class="screen-share-label">Screen Share</span>
                <button 
                  class="audio-toggle"
                  on:click={() => {
                    if (item.videoElement) {
                      item.videoElement.muted = !item.videoElement.muted;
                    }
                  }}
                >
                  {item.videoElement?.muted ? '🔇' : '🔊'}
                </button>
              </div>
            {:else if item.type === 'camera'}
              <div class="screen-share-overlay">
                <span class="screen-share-label">Camera</span>
                <button 
                  class="audio-toggle"
                  on:click={() => toggleCamera(item)}
                >
                  {item.stream ? '📷' : '📹'}
                </button>
              </div>
            {/if}
            <!-- Resize handles -->
            <div class="resize-handle nw" on:mousedown={(e) => startResizing(e, item, 'nw')}></div>
            <div class="resize-handle n" on:mousedown={(e) => startResizing(e, item, 'n')}></div>
            <div class="resize-handle ne" on:mousedown={(e) => startResizing(e, item, 'ne')}></div>
            <div class="resize-handle e" on:mousedown={(e) => startResizing(e, item, 'e')}></div>
            <div class="resize-handle se" on:mousedown={(e) => startResizing(e, item, 'se')}></div>
            <div class="resize-handle s" on:mousedown={(e) => startResizing(e, item, 's')}></div>
            <div class="resize-handle sw" on:mousedown={(e) => startResizing(e, item, 'sw')}></div>
            <div class="resize-handle w" on:mousedown={(e) => startResizing(e, item, 'w')}></div>
          </div>
        {:else if item.type === 'presentation'}
          <div class="presentation">
            <img 
              src={item.thumbnail} 
              alt="Presentation" 
              class="presentation-image"
              on:error={(e) => {
                console.error('Failed to load presentation image:', e);
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlZWVlZWUiLz48cGF0aCBkPSJNMTAwIDUwVjE1ME0xNTAgMTAwSDUwIiBzdHJva2U9IiNjY2NjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+';
              }}
            />
            <!-- Add resize handles for presentation -->
            <div class="resize-handle nw" on:mousedown={(e) => startResizing(e, item, 'nw')}></div>
            <div class="resize-handle n" on:mousedown={(e) => startResizing(e, item, 'n')}></div>
            <div class="resize-handle ne" on:mousedown={(e) => startResizing(e, item, 'ne')}></div>
            <div class="resize-handle e" on:mousedown={(e) => startResizing(e, item, 'e')}></div>
            <div class="resize-handle se" on:mousedown={(e) => startResizing(e, item, 'se')}></div>
            <div class="resize-handle s" on:mousedown={(e) => startResizing(e, item, 's')}></div>
            <div class="resize-handle sw" on:mousedown={(e) => startResizing(e, item, 'sw')}></div>
            <div class="resize-handle w" on:mousedown={(e) => startResizing(e, item, 'w')}></div>
          </div>
        {/if}
      </div>
    {/each}
    <div 
      class="wall-resize-handle"
      on:mousedown={startWallResize}
    ></div>
  </div>
</div>

<style>
  .video-wall-container {
    width: 100%;
    height: 391px;
    background-color: white;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .video-wall-container:fullscreen {
    width: 100vw;
    height: 100vh;
    padding: 0;
    margin: 0;
    border-radius: 0;
    background-color: white;
    display: flex;
    flex-direction: column;
  }

  .video-wall-container:fullscreen .video-wall {
    height: calc(100vh - 60px);
    width: 100%;
    max-width: none;
    max-height: none;
    padding: 1rem;
  }

  .video-wall-container:fullscreen .header {
    padding: 1rem 2rem;
    height: 60px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: white;
    border-bottom: 1px solid #eee;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #333;
    font-weight: 500;
  }

  .buttons {
    display: flex;
    gap: 0.5rem;
  }

  .control-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    background-color: #f5f5f5;
  }

  .power-btn {
    color: #ff3e3e;
  }

  .power-btn:hover {
    background-color: rgba(255, 62, 62, 0.1);
    color: #ff3e3e;
  }

  .success-btn {
    color: #4CAF50;
  }

  .success-btn:hover {
    background-color: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .drag-text {
    color: #333;
    font-size: 1rem;
    font-weight: 500;
  }

  .subtitle {
    color: #999;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .video-wall {
    position: relative;
    flex: 1;
    padding: 1rem;
    background-color: white;
    overflow: hidden;
    width: 838px;
    min-height: 300px;
    max-height: 800px;
    transition: height 0.2s ease;
  }

  .video-wall-container:fullscreen .video-item {
    max-width: none;
    max-height: none;
  }

  .video-wall-container:fullscreen .resize-handle {
    opacity: 1;
  }

  .video-wall-container:fullscreen .resize-handle:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }

  .video-wall-container:fullscreen .wall-resize-handle {
    height: 16px;
  }

  .video-wall-container:fullscreen .wall-resize-handle::before {
    height: 6px;
    opacity: 0.7;
  }

  .video-item {
    position: absolute;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    cursor: move;
    /* max-height: calc(100% - 2rem); Account for padding */
    /* max-width: calc(100% - 2rem); */
  }

  .video-item video,
  .video-item .presentation {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Hide resize handles but keep functionality */
  .resize-handle {
    position: absolute;
    background-color: transparent;
    border: none;
    z-index: 10;
    opacity: 0;
  }

  /* Make the entire border resizable */
  .n, .s {
    width: 100%;
    height: 6px;
    left: 0;
    cursor: ns-resize;
  }

  .e, .w {
    width: 6px;
    height: 100%;
    top: 0;
    cursor: ew-resize;
  }

  .nw, .se, .ne, .sw {
    width: 20px;
    height: 20px;
  }

  .n { top: -3px; }
  .s { bottom: -3px; }
  .e { right: -3px; }
  .w { left: -3px; }
  .nw { top: -3px; left: -3px; cursor: nw-resize; }
  .ne { top: -3px; right: -3px; cursor: ne-resize; }
  .sw { bottom: -3px; left: -3px; cursor: sw-resize; }
  .se { bottom: -3px; right: -3px; cursor: se-resize; }

  .resize-handle:hover {
    background-color: transparent;
    transform: none;
  }

  .video-container .resize-handle {
    opacity: 0;
  }

  .video-container:hover .resize-handle {
    opacity: 0;
    background: transparent;
  }

  .screen-share-overlay {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    padding: 8px 12px;
    border-radius: 6px;
    transition: opacity 0.3s;
  }

  .video-container:not(:hover) .screen-share-overlay {
    opacity: 0;
  }

  .screen-share-label {
    color: white;
    font-size: 14px;
    font-weight: 500;
  }

  .audio-toggle {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .audio-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .presentation {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000000;
    width: 100%;
    height: 100%;
    overflow: hidden;
    cursor: move;
  }

  .presentation-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Show resize handles for presentation */
  .presentation .resize-handle {
    display: block;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .presentation:hover .resize-handle {
    opacity: 1;
  }

  /* Make resize handles more visible */
  .resize-handle {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.5);
    z-index: 10;
  }

  .resize-handle:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }

  .conference-grid {
    width: 100%;
    height: 100%;
    background-color: #1a1a1a;
    padding: 0.5rem;
  }

  .participants-grid {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .participant-cell {
    background-color: #2a2a2a;
    border-radius: 4px;
    width: 100%;
    height: 100%;
  }

  .dashboard {
    width: 100%;
    height: 100%;
    background-color: white;
    padding: 1rem;
  }

  .dashboard img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .sharepoint-item {
    width: 100%;
    height: 100%;
    background-color: white;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #eee;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .sharepoint-item:hover {
    border-color: #0078d4;
    box-shadow: 0 2px 8px rgba(0, 120, 212, 0.1);
  }

  .document-preview, .folder-preview {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .document-icon, .folder-icon {
    color: #0078d4;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .folder-icon {
    color: #ffd700;
  }

  .document-info, .folder-info {
    text-align: center;
  }

  .document-info h3, .folder-info h3 {
    margin: 0;
    font-size: 1rem;
    color: #333;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .document-info p, .folder-info p {
    margin: 0;
    font-size: 0.875rem;
    color: #666;
  }

  .file-type {
    display: inline-block;
    padding: 2px 6px;
    background-color: #f0f0f0;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #666;
    margin-top: 0.5rem;
  }

  .document-icon svg {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .video-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
  }

  .video-element {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }

  .wall-resize-handle {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 12px;
    background: transparent;
    cursor: ns-resize;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .wall-resize-handle:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .wall-resize-handle::before {
    content: '';
    width: 40px;
    height: 4px;
    background: #666;
    border-radius: 2px;
    opacity: 0.5;
  }

  .wall-resize-handle:hover::before {
    opacity: 0.8;
  }

  .resize-indicator {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .resize-dots {
    display: flex;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .resize-dots span {
    width: 4px;
    height: 4px;
    background-color: #666;
    border-radius: 50%;
    opacity: 0.5;
  }

  .wall-resize-handle:hover .resize-dots span {
    opacity: 0.8;
  }

  /* Make resize handle more visible on dark backgrounds */
  .wall-resize-handle::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
    bottom: 0;
  }

  /* Add a subtle highlight effect when resizing */
  .video-wall-container.resizing {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Show resize handles on hover */
  .presentation:hover .resize-handle {
    opacity: 1;
  }

  .presentation:not(:hover) .resize-handle {
    opacity: 0;
  }

  .wall-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: white;
    border-bottom: 1px solid #eee;
  }

  .wall-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .control-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .fullscreen-btn {
    color: #34C759;
  }

  .fullscreen-btn:hover {
    background-color: rgba(52, 199, 89, 0.1);
  }

  .video-wall:fullscreen {
    background-color: white;
    padding: 20px;
  }
</style> 