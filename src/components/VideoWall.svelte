<script>
  import { createEventDispatcher } from 'svelte';
  import PdfViewer from './PdfViewer.svelte';
  import exportIcon from './icons/export.svg';
  import importIcon from './icons/import.svg';
  import DashboardViewer from './DashboardViewer.svelte';
  const dispatch = createEventDispatcher();

  // Initial items that show when the application loads
  let videoWallItems = [
    {
      id: 'presentation',
      type: 'presentation',
      stream: null,
      videoElement: null,
      thumbnail: 'https://media-hosting.imagekit.io/6c79edddc2d849ed/th.png?Expires=1838797462&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=Bolgpn02672FofMrvvhKYcvang0L0l15s8tm3X-g8E4U~jr7RhHqS4~Ub3p2USHVtjbu9o9tVSHpVl~TxdmybfcFFfbSwIeAI7pd5HS8NY2Oj1PHXsYvag6UEM2IOUgyGTa31FUMLejqcCh94ee69vl5j2VdRn3CgExGr~29cKI8MwFVXF0KBPLnucTTGfwwb5wDUtprXwLKrCupFDEtdGiCijMOCDgP2TO1crREsYhts6hXUnK2Hz6dbhlXiw~sECTliEKl0~5jwxM6D3UVbw-TwH4WPMCcZ5skrgFJoiY46w1jED3bMefhP9eB58YViLFIcw8aqalMZcS4p0Lowg__',
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
  let originalDimensions = new Map(); // Track original dimensions of sources
  let error = null;
  let isExporting = false;
  let exportStatus = '';

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
        // Start a new stream with specific constraints
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });
        
        // Create new video element
        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.playsinline = true;
        videoElement.muted = true;
        videoElement.srcObject = stream;
        
        // Create new item with the stream
        const newItem = {
          ...item,
          stream,
          videoElement,
          position: item.position,
          size: item.size
        };
        
        // Add the new item back to the wall
        videoWallItems = [...videoWallItems, newItem];
        
        // Start playing the video
        videoElement.play().catch(err => {
          console.error('Failed to play video:', err);
        });
      } catch(err) {
        console.error('Failed to get camera:', err);
        error = 'Failed to access camera. Please check permissions.';
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
    const minSize = 50;
    const maxWidth = wallRect.width;
    const maxHeight = wallHeight;
    const aspectRatio = initialSize.width / initialSize.height;

    // Calculate new dimensions based on resize direction
    if (resizeDirection.includes('s') || resizeDirection.includes('n')) {
      // When resizing vertically, adjust width proportionally
      const heightChange = resizeDirection.includes('n') ? -dy : dy;
      newHeight = Math.max(minSize, Math.min(maxHeight - resizingItem.position.y, initialSize.height + heightChange));
      newWidth = newHeight * aspectRatio;
    } else if (resizeDirection.includes('e') || resizeDirection.includes('w')) {
      // When resizing horizontally, adjust height proportionally
      const widthChange = resizeDirection.includes('w') ? -dx : dx;
      newWidth = Math.max(minSize, Math.min(maxWidth - resizingItem.position.x, initialSize.width + widthChange));
      newHeight = newWidth / aspectRatio;
    }

    // Update position for n and w resizing
    if (resizeDirection.includes('n')) {
      resizingItem.position.y = initialPosition.y + (initialSize.height - newHeight);
      }
    if (resizeDirection.includes('w')) {
      resizingItem.position.x = initialPosition.x + (initialSize.width - newWidth);
    }

    // Update the item's size
    videoWallItems = videoWallItems.map(item => {
      if (item.id === resizingItem.id) {
        return {
          ...item,
          size: { width: newWidth, height: newHeight },
          position: { ...resizingItem.position }
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

  // Modify handleDrop function
  async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      console.log('Dropped data:', data);

      if (data.type === 'camera') {
        try {
          // Request camera access with specific constraints
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            }
          });

          // Create a new video element
          const videoElement = document.createElement('video');
          videoElement.autoplay = true;
          videoElement.playsInline = true;
          videoElement.muted = true;
          videoElement.srcObject = stream;

          // Create a new camera source
          const newSource = {
            id: `camera-${Date.now()}`,
            type: 'camera',
            label: 'Camera',
            stream,
            videoElement,
            position: { x: 0, y: 0 },
            size: { width: 320, height: 240 },
            isDragging: false,
            isResizing: false,
            isFullscreen: false,
            originalWidth: 320,
            originalHeight: 240,
            originalX: 0,
            originalY: 0
          };

          // Find the largest empty space for the camera
          const wallRect = wallRef.getBoundingClientRect();
          const emptySpace = findLargestEmptySpace(videoWallItems, wallRect.width, wallHeight);
          
          if (emptySpace) {
            newSource.position = {
              x: emptySpace.x,
              y: emptySpace.y
            };
            
            // Adjust size to fit the available space
            newSource.size = {
              width: Math.min(emptySpace.width, 320),
              height: Math.min(emptySpace.height, 240)
            };
          }

          videoWallItems = [...videoWallItems, newSource];
          dispatch('sourceAdded', { source: newSource });
        } catch (err) {
          console.error('Failed to access camera:', err);
          error = 'Failed to access camera. Please check permissions.';
        }
      } else if (data.type === 'screen') {
        try {
          // Request screen sharing with specific constraints
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: true
          });
          
          // Create a new screen share source with video element
          const videoElement = document.createElement('video');
          videoElement.autoplay = true;
          videoElement.playsinline = true;
          videoElement.muted = false;
          videoElement.srcObject = stream;
          
          const newSource = {
            id: `screen-${Date.now()}`,
            type: 'screen',
            label: 'Screen Share',
            stream: stream,
            videoElement: videoElement,
            position: { x: 0, y: 0 },
            size: { width: 640, height: 360 },
            isDragging: false,
            isResizing: false,
            isFullscreen: false,
            originalWidth: 640,
            originalHeight: 360,
            originalX: 0,
            originalY: 0
          };
          
          videoWallItems = [...videoWallItems, newSource];
          dispatch('sourceAdded', { source: newSource });
          
          // Start playing the video
          videoElement.play().catch(err => {
            console.error('Failed to play screen share:', err);
          });
          
          // Handle when user stops sharing
          stream.getVideoTracks()[0].onended = () => {
            videoWallItems = videoWallItems.filter(item => item.id !== newSource.id);
            dispatch('sourceRemoved', { source: newSource });
          };
        } catch (err) {
          console.error('Failed to get screen share:', err);
          error = 'Failed to start screen sharing. Please check permissions.';
        }
      } else if (data.type === 'pdf') {
        try {
          // Create a new PDF source
          const newSource = {
            id: `pdf-${Date.now()}`,
            type: 'pdf',
            label: data.label || 'PDF Document',
            pdfUrl: data.pdfUrl,
            position: { x: 0, y: 0 },
            size: { width: 400, height: 600 },
            isDragging: false,
            isResizing: false,
            isFullscreen: false,
            originalWidth: 400,
            originalHeight: 600,
            originalX: 0,
            originalY: 0
          };
          
          // Find the largest empty space for the PDF
          const wallRect = wallRef.getBoundingClientRect();
          const emptySpace = findLargestEmptySpace(videoWallItems, wallRect.width, wallHeight);
          
          if (emptySpace) {
            newSource.position = {
              x: emptySpace.x,
              y: emptySpace.y
            };
            
            // Adjust size to fit the available space
            newSource.size = {
              width: Math.min(emptySpace.width, 400),
              height: Math.min(emptySpace.height, 600)
            };
          }
          
          videoWallItems = [...videoWallItems, newSource];
          dispatch('sourceAdded', { source: newSource });
        } catch (err) {
          console.error('Failed to load PDF:', err);
          error = 'Failed to load PDF document.';
        }
      } else if (data.type === 'dashboard') {
        // Create a new dashboard source
        const newSource = {
          id: `dashboard-${Date.now()}`,
          type: 'dashboard',
          label: 'Interactive Dashboard',
          position: { x: 0, y: 0 },
          size: { width: 800, height: 600 },
          isDragging: false,
          isResizing: false,
          isFullscreen: false,
          originalWidth: 800,
          originalHeight: 600,
          originalX: 0,
          originalY: 0
        };
        
        // Find the largest empty space for the dashboard
        const wallRect = wallRef.getBoundingClientRect();
        const emptySpace = findLargestEmptySpace(videoWallItems, wallRect.width, wallHeight);
        
        if (emptySpace) {
          newSource.position = {
            x: emptySpace.x,
            y: emptySpace.y
          };
          newSource.size = {
            width: Math.min(emptySpace.width, 800),
            height: Math.min(emptySpace.height, 600)
          };
        }
        
        videoWallItems = [...videoWallItems, newSource];
        dispatch('sourceAdded', { source: newSource });
      } else {
        // For other sources (images, screen share)
        const newSource = {
          id: data.id || `source-${Date.now()}`,
          type: data.type,
          label: data.label,
          thumbnail: data.thumbnail,
          preview: data.preview,
          stream: data.stream,
          position: { x: 0, y: 0 },
          size: { width: 260, height: 156 },
          isDragging: false,
          isResizing: false,
          isFullscreen: false,
          originalWidth: 260,
          originalHeight: 156,
          originalX: 0,
          originalY: 0
        };
        
        videoWallItems = [...videoWallItems, newSource];
        dispatch('sourceAdded', { source: newSource });
      }
    } catch (err) {
      console.error('Error handling drop:', err);
      error = 'Failed to add source: ' + (err.message || 'Unknown error');
    }
  }

  function handleVideoRef(element, item) {
    if (element && item.stream) {
      console.log('Setting up video element for:', item.id);
      
      // Ensure the video element is properly configured
      element.autoplay = true;
      element.playsinline = true;
      element.muted = item.type !== 'sharepoint';
      element.srcObject = item.stream;
      
      // Add controls for screen share
      if (item.type === 'sharepoint' || item.type === 'screen') {
        element.controls = true;
      }
      
      // Start playing the video
      element.play().catch(err => {
        console.error('Failed to play video:', err);
      });
    }
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
      // Store original dimensions before entering fullscreen
      originalDimensions.clear();
      videoWallItems.forEach(item => {
        originalDimensions.set(item.id, {
          position: { ...item.position },
          size: { ...item.size }
        });
      });

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

        // Keep original positions and sizes in fullscreen
        videoWallItems = videoWallItems.map(item => {
          const original = originalDimensions.get(item.id);
          return {
            ...item,
            position: original.position,
            size: original.size
          };
        });
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

      // Restore original dimensions
      videoWallItems = videoWallItems.map(item => {
        const original = originalDimensions.get(item.id);
        if (original) {
          return {
            ...item,
            position: original.position,
            size: original.size
          };
        }
        return item;
      });
    }
  }

  function handlePowerOff() {
    // Reset all sources to their original sizes and positions
    videoWallItems = videoWallItems.map(item => {
      if (item.originalWidth && item.originalHeight && item.originalX !== undefined && item.originalY !== undefined) {
        return {
          ...item,
          size: {
            width: item.originalWidth,
            height: item.originalHeight
          },
          position: {
            x: item.originalX,
            y: item.originalY
          },
          isFullscreen: false
        };
      }
      return item;
    });
    
    // Reset the wall to its original state
    isFullscreen = false;
    originalWidth = 800;
    originalHeight = 600;
    originalX = 0;
    originalY = 0;
    width = originalWidth;
    height = originalHeight;
    x = originalX;
    y = originalY;
    
    // Reset the presentation source to its default size and position
    const presentationSource = videoWallItems.find(item => item.type === 'presentation');
    if (presentationSource) {
      presentationSource.size = { width: 260, height: 156 };
      presentationSource.position = { x: 0, y: 0 };
      presentationSource.isFullscreen = false;
    }
  }

  function handleCloseSource(item) {
    // Stop any video streams before removing
    if (item.stream) {
      item.stream.getTracks().forEach(track => track.stop());
    }
    if (item.videoElement) {
      item.videoElement.srcObject = null;
    }
    
    // Remove the item from the wall
    videoWallItems = videoWallItems.filter(i => i.id !== item.id);
    dispatch('sourceRemoved', { source: item });
  }

  async function exportSourcesToJson() {
    try {
      isExporting = true;
      exportStatus = 'Exporting...';

      // Prepare the data
      const sourcesData = videoWallItems.map(item => ({
        id: item.id,
        type: item.type,
        label: item.label,
        position: item.position,
        size: item.size,
        isFullscreen: item.isFullscreen,
        originalWidth: item.originalWidth,
        originalHeight: item.originalHeight,
        originalX: item.originalX,
        originalY: item.originalY,
        // Add any other relevant properties
        ...(item.type === 'camera' && { stream: 'camera_stream' }),
        ...(item.type === 'screen' && { stream: 'screen_stream' }),
        ...(item.type === 'pdf' && { pdfUrl: item.pdfUrl }),
        ...(item.type === 'presentation' && { thumbnail: item.thumbnail })
      }));

      // Create the JSON file
      const jsonData = JSON.stringify(sourcesData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_wall_sources_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      exportStatus = 'Export successful!';
      setTimeout(() => {
        exportStatus = '';
      }, 2000);
    } catch (err) {
      console.error('Export failed:', err);
      exportStatus = 'Export failed!';
    } finally {
      isExporting = false;
    }
  }

  async function importSourcesFromJson(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const sourcesData = JSON.parse(e.target.result);
          
          // Clear existing sources
          videoWallItems = [];
          
          // Recreate sources from JSON data
          for (const source of sourcesData) {
            if (source.type === 'camera') {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: 'user'
                }
              });
              const videoElement = document.createElement('video');
              videoElement.autoplay = true;
              videoElement.playsInline = true;
              videoElement.muted = true;
              videoElement.srcObject = stream;

              videoWallItems = [...videoWallItems, {
                ...source,
                stream,
                videoElement
              }];
            } else if (source.type === 'screen') {
              const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                  width: { ideal: 1920 },
                  height: { ideal: 1080 }
                }
              });
              const videoElement = document.createElement('video');
              videoElement.autoplay = true;
              videoElement.playsInline = true;
              videoElement.muted = true;
              videoElement.srcObject = stream;

              videoWallItems = [...videoWallItems, {
                ...source,
                stream,
                videoElement
              }];
            } else {
              videoWallItems = [...videoWallItems, source];
            }
          }
        } catch (err) {
          console.error('Failed to import sources:', err);
          error = 'Failed to import sources. Please check the file format.';
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error('Import failed:', err);
      error = 'Failed to import sources.';
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
        <div class="controls">
          <button 
            class="control-button" 
            on:click={exportSourcesToJson}
            disabled={isExporting}
            title="Export Sources"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path d="M17.2 12.2h-8.5c.9.5 1.6 1.2 2.2 2h6.3c.3 0 .5.2.5.5v9.5c0 .3-.2.5-.5.5H7.7c-.3 0-.5-.2-.5-.5v-5.8c-.2-.1-.5-.2-.8-.3-.2.5-.5.9-.9 1.1-.1.1-.2.1-.3.1v4.9c0 1.4 1.1 2.5 2.5 2.5h9.5c1.4 0 2.5-1.1 2.5-2.5v-9.5c0-1.4-1.1-2.5-2.5-2.5z"/>
                <path d="M5.2 7c2.1 0 3.9 1.1 4.9 2.8.1.1.3.2.4.2 0 0 .1 0 .1 0 .2-.1.4-.3.4-.5v-.1c0-3.2-2.6-5.9-5.8-5.9V2.6c0-.2-.1-.4-.3-.5-.1 0-.2-.1-.3-.1-.1 0-.2 0-.3.1L.2 4.8c-.1.1-.2.3-.2.5 0 .2.1.3.2.4l4 2.8c.1.1.2.1.3.1.1 0 .2 0 .3-.1.2-.1.3-.3.3-.5V7z"/>
              </g>
            </svg>
          </button>
          <label class="control-button" title="Import Sources">
            <input 
              type="file" 
              accept=".json" 
              on:change={importSourcesFromJson}
              style="display: none"
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
              <path d="M12 4L12 14M12 14L15 11M12 14L9 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 20C7.58172 20 4 16.4183 4 12M20 12C20 14.5264 18.8289 16.7792 17 18.2454" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </label>
          {#if exportStatus}
            <span class="export-status">{exportStatus}</span>
          {/if}
        </div>
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
      else if (draggedItem) handleDrag(e);
    }}
    on:mouseup={() => {
      stopDragging();
      stopResizing();
    }}
    on:mouseleave={() => {
      stopDragging();
      stopResizing();
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
        class:resizing={isResizing && resizingItem?.id === item.id}
      >
        <button 
          class="close-button"
          on:click={() => handleCloseSource(item)}
          on:mousedown|stopPropagation
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
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
          </div>
        {:else if item.type === 'pdf'}
          <div class="pdf-container">
            <PdfViewer pdfUrl={item.pdfUrl} width="100%" height="100%" />
          </div>
        {:else if item.type === 'dashboard'}
          <div class="dashboard-container">
            <DashboardViewer 
              width="{item.size.width}px"
              height="{item.size.height}px"
            />
          </div>
        {:else}
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
          </div>
        {/if}
        <!-- Resize handles for all items -->
            <div class="resize-handle nw" on:mousedown={(e) => startResizing(e, item, 'nw')}></div>
            <div class="resize-handle n" on:mousedown={(e) => startResizing(e, item, 'n')}></div>
            <div class="resize-handle ne" on:mousedown={(e) => startResizing(e, item, 'ne')}></div>
            <div class="resize-handle e" on:mousedown={(e) => startResizing(e, item, 'e')}></div>
            <div class="resize-handle se" on:mousedown={(e) => startResizing(e, item, 'se')}></div>
            <div class="resize-handle s" on:mousedown={(e) => startResizing(e, item, 's')}></div>
            <div class="resize-handle sw" on:mousedown={(e) => startResizing(e, item, 'sw')}></div>
            <div class="resize-handle w" on:mousedown={(e) => startResizing(e, item, 'w')}></div>
      </div>
    {/each}
  </div>
</div>

<style>
  /* Add this to prevent touch events from interfering with scrolling */
  .video-item {
    touch-action:double-tap-zoom;
  }

  /* Make resize handles larger for touch devices */
  .video-wall-container {
    width: 100%;
    height: 100%;
    background-color: white;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .video-wall {
    position: relative;
    flex: 1;
    padding: 1rem;
    background-color: white;
    width: 100%;
    box-sizing: border-box;
  }

  .video-item {
    position: absolute;
    background: #000;
    border-radius: 8px;
    cursor: move;
    overflow: hidden;
    max-width: calc(100% - 2rem);
    max-height: calc(100% - 2rem);
  }

  .video-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .video-item video,
  .video-item .presentation {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }

  /* Resize handles for the entire border */
  .resize-handle {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.3);
    z-index: 10;
    opacity: 0;
    transition: opacity 0.2s ease, background-color 0.2s ease;
  }

  /* Make the entire border resizable */
  .n, .s {
    width: 100%;
    height: 12px;
    left: 0;
    cursor: ns-resize;
  }

  .e, .w {
    width: 12px;
    height: 100%;
    top: 0;
    cursor: ew-resize;
  }

  .nw, .se, .ne, .sw {
    width: 24px;
    height: 24px;
  }

  .n { top: 0; }
  .s { bottom: 0; }
  .e { right: 0; }
  .w { left: 0; }
  .nw { top: 0; left: 0; cursor: nw-resize; }
  .ne { top: 0; right: 0; cursor: ne-resize; }
  .sw { bottom: 0; left: 0; cursor: sw-resize; }
  .se { bottom: 0; right: 0; cursor: se-resize; }

  /* Show resize areas on hover */
  .video-item:hover .resize-handle {
    opacity: 1;
  }

  .video-item.resizing .resize-handle {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.5);
  }

  /* Add visual feedback during resize */
  .video-item.resizing {
    border: 2px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 1200px) {
    .video-wall {
      padding: 0.5rem;
    }

    .video-item {
      max-width: calc(100% - 1rem);
      max-height: calc(100% - 1rem);
    }

    /* Adjust resize handles for smaller screens */
    .nw, .ne, .sw, .se {
      width: 16px;
      height: 16px;
    }
  }

  /* Ensure fullscreen mode works properly */
  .video-wall-container:fullscreen {
    width: 100vw;
    height: 100vh;
    padding: 0;
    margin: 0;
  }

  .video-wall-container:fullscreen .video-wall {
    padding: 1rem;
    height: calc(100vh - 60px);
  }

  .video-wall-container:fullscreen .video-item {
    max-width: calc(100vw - 2rem);
    max-height: calc(100vh - 62px);
  }

  .header {
    padding: 1rem;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #eee;
    box-sizing: border-box;
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

  .video-item:hover {
    border: 2px solid rgba(255, 255, 255, 0.2);
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

  .wall-resize-handle,
  .wall-resize-handle::before,
  .wall-resize-handle:hover,
  .wall-resize-handle:hover::before,
  .video-wall-container.resizing {
    display: none;
  }

  .video-wall-container.resizing {
    /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); */
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

  .video-wall:fullscreen {
    background-color: white;
    padding: 20px;
    width: 100%;
    height: 100%;
  }

  .pdf-container {
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 8px;
    overflow: hidden;
  }

  .dashboard-container {
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }

  .video-item[data-type="dashboard"] {
    min-width: 400px;
    min-height: 300px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .video-item[data-type="dashboard"] .resize-handle {
    background: rgba(0, 0, 0, 0.1);
    border: 2px solid rgba(0, 0, 0, 0.2);
  }

  .video-item[data-type="dashboard"].resizing {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .close-button {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    opacity: 0;
    transition: opacity 0.2s ease, background-color 0.2s ease;
    z-index: 20;
  }

  .close-button:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  .video-item:hover .close-button {
    opacity: 1;
  }

  .close-button svg {
    width: 12px;
    height: 12px;
  }

  .controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .control-button {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(14, 165, 0, 0.603);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: #ffffff;
    transition: all 0.2s ease;
    scale: 0.8;
  }
  .control-button:hover {
    scale: 1.2;
  }
  .control-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .export-status {
    color: #4CAF50;
    font-size: 14px;
    font-weight: 500;
    margin-left: 8px;
  }

  /* Remove old button styles */
  .export-button,
  .import-button {
    display: none;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;  
  }
  /* .export-button,.import-button svg{
    width: 22px;
    height: 22px;
  } */
</style> 