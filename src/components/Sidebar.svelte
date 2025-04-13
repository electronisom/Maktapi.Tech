<script>
  import { createEventDispatcher, onMount } from "svelte";
  import homeIcon from './icons/home.svg';
  import displayIcon from './icons/display.svg';
  import cameraIcon from './icons/camera.svg';
  import presentsIcon from './icons/presents.svg';
  import lightingIcon from './icons/lighting.svg';
  import commandIcon from './icons/command.svg';
  import imersiveIcon from './icons/imersive.svg';
  import orderIcon from './icons/order.svg';
  // import logo from './icons/logo.svg';
  import settingIcon from './icons/setting.svg';
  const dispatch = createEventDispatcher();

  // Active menu item tracking
  let activeMenuItem = "display";
  let activeSourceItem = "camera";
  let searchQuery = "";

  const menuItems = [
    { id: "home", icon: homeIcon, label: "Home" },
    { id: "display", icon: displayIcon, label: "Display" },
    { id: "presents", icon: presentsIcon, label: "Presents" },
    { id: "camera", icon: cameraIcon, label: "Camera" },
    { id: "lighting", icon: lightingIcon, label: "Lighting" },
    { id: "command", icon: commandIcon, label: "Command" },
    { id: "imersive", icon: imersiveIcon, label: "Imersive" },
    { id: "order", icon: orderIcon, label: "Order" }
  ];

  let fileInput;
  let pdfThumbnail = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512'%3E%3Cpath fill='%23ff4433' d='M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z'/%3E%3C/svg%3E";

  let sourceItems = [
    {
      id: "camera",
      label: "Camera",
      thumbnail:
        "https://cdn.prod.website-files.com/61120cb2509e012d40f0b214/66ab37833d8f95c6d57341c2_66ab3698545fb12226f9da2c_How%2520to%2520Share%2520Sound%2520on%2520Zoom%2520Meetings.png",
      preview: "A conference room with people seated around a table",
    },
    {
      id: "presentation",
      label: "Thank You!",
      thumbnail:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPKy78AHsIfSkQV_mPCPN-9uLh6l2pORZPYw&s",
      preview: "A dark presentation slide with Thank You! text",
    },

    {
      id: "conference",
      label: "Conference",
      thumbnail:
        "https://cdn.prod.website-files.com/61120cb2509e012d40f0b214/66ab37833d8f95c6d57341c2_66ab3698545fb12226f9da2c_How%2520to%2520Share%2520Sound%2520on%2520Zoom%2520Meetings.png",
      preview: "A grid of video call participants",
    },
    {
      id: "sharepoint",
      label: "Share Screen",
      thumbnail:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSp8eSku8I6BZwOeEi96c3B0-xTKHdZkCAibXHvvlLulP6moTfpShogHEpMhXr24LH0AsA&usqp=CAU",
      preview: "Share your screen",
      isScreenShare: true,
    },
    {
      id: "dashboard",
      label: "Dashboard",
      thumbnail:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-idC4P_Is8-bn1i3nWJL-yJeTvT4zA1ibAw&s",
      preview: "A dashboard with graphs and charts",
    },
    {
      id: "pdf-upload",
      label: "Upload PDF",
      thumbnail: pdfThumbnail,
      preview: "Upload and view PDF files",
      isPdfUpload: true
    },
  ];

  $: filteredSourceItems = searchQuery
    ? sourceItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sourceItems;

  function handleMenuClick(id) {
    activeMenuItem = id;
    dispatch("menuSelect", { id });
  }

  async function handleSourceClick(id) {
    activeSourceItem = id;
    const item = sourceItems.find((item) => item.id === id);

    if (item?.isScreenShare) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
          },
          audio: false,
        });
        dispatch("screenShareStart", { stream });
      } catch (err) {
        console.error("Error accessing screen share:", err);
      }
    } else {
      dispatch("sourceSelect", { id });
    }
  }

  let blobUrls = new Set();

  onMount(() => {
    // Initialize with source items and duplicates for infinite effect
    items = [...sourceItems, ...sourceItems, ...sourceItems];
    
    // Calculate center offset based on container height
    centerOffset = window.innerHeight / 2;
    
    // Initial positioning with slight delay for smooth animation
    setTimeout(() => {
      isInitialized = true;
      positionItems();
    }, 100);

    const handleResize = () => {
      centerOffset = window.innerHeight / 2;
      positionItems();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener('resize', handleResize);
      // Clean up blob URLs
      blobUrls.forEach(url => URL.revokeObjectURL(url));
    };
  });

  function positionItems() {
    const totalItems = items.length;
    const angleStep = (2 * Math.PI) / totalItems;
    const verticalOffset = -40; // Adjust vertical position
    
    items = items.map((item, index) => {
      const angle = index * angleStep + currentRotation;
      const y = Math.sin(angle) * radius + verticalOffset;
      const z = Math.cos(angle) * radius;
      const scale = mapRange(z, -radius, radius, 0.4, 1);
      const opacity = mapRange(z, -radius, radius, 0.3, 1);
      
      return {
        ...item,
        style: `
          transform: translate3d(-50%, ${y}px, ${z}px) 
                    scale(${scale}) 
                    rotateX(${-angle * 8}deg);
          opacity: ${opacity};
          z-index: ${Math.round((z + radius) * 10)};
          transition: ${isInitialized ? 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'};
        `
      };
    });
  }

  function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  function handleMouseDown(e) {
    isDragging = true;
    startY = e.clientY;
    momentum = 0;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  }

  function handleMouseMove(e) {
    if (!isDragging) return;
    
    const deltaY = e.clientY - startY;
    const rotationDelta = deltaY * sensitivity;
    currentRotation += rotationDelta;
    momentum = rotationDelta * 0.8; // Reduced momentum for smoother movement
    startY = e.clientY;
    positionItems();
  }

  function handleMouseUp() {
    isDragging = false;
    if (Math.abs(momentum) > 0.0001) {
      animationFrame = requestAnimationFrame(function animate() {
        currentRotation += momentum;
        momentum *= 0.92; // Smoother deceleration
        positionItems();
        if (Math.abs(momentum) > 0.0001) {
          animationFrame = requestAnimationFrame(animate);
        }
      });
    }
  }

  function handleWheel(e) {
    e.preventDefault();
    const deltaY = e.deltaY;
    momentum += deltaY * 0.00008; // Reduced wheel sensitivity
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(function animate() {
        currentRotation += momentum;
        momentum *= 0.92;
        positionItems();
        if (Math.abs(momentum) > 0.0001) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          animationFrame = null;
        }
      });
    }
  }

  // Add touch event handlers for mobile support
  function handleTouchStart(e) {
    const touch = e.touches[0];
    isDragging = true;
    startY = touch.clientY;
    momentum = 0;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  }

  function handleTouchMove(e) {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;
    const rotationDelta = deltaY * sensitivity;
    currentRotation += rotationDelta;
    momentum = rotationDelta * 0.8;
    startY = touch.clientY;
    positionItems();
    
    // Prevent page scrolling while dragging
    e.preventDefault();
  }

  function handleTouchEnd() {
    isDragging = false;
    if (Math.abs(momentum) > 0.0001) {
      animateWithMomentum();
    }
  }

  function animateWithMomentum() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    
    animationFrame = requestAnimationFrame(function animate() {
      currentRotation += momentum;
      momentum *= 0.92;
      positionItems();
      if (Math.abs(momentum) > 0.0001) {
        animationFrame = requestAnimationFrame(animate);
      }
    });
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      try {
        // Create a blob URL for the PDF file
        const pdfUrl = URL.createObjectURL(file);
        blobUrls.add(pdfUrl); // Track for cleanup
        
        // Create new PDF source item
        const pdfItem = {
          id: `pdf-${Date.now()}`,
          type: 'pdf',
          label: file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name,
          thumbnail: pdfThumbnail,
          preview: "PDF Document",
          pdfUrl: pdfUrl,
          isPdf: true,
          size: file.size,
          lastModified: file.lastModified
        };

        // Add to source items and update the rotating items
        sourceItems = [...sourceItems, pdfItem];
        items = [...sourceItems, ...sourceItems, ...sourceItems];
        
        // Reset file input
        event.target.value = '';
        
        // Trigger re-render of items
        positionItems();

        // Dispatch event to notify parent components
        dispatch('sourceAdded', { item: pdfItem });
      } catch (err) {
        console.error('Error handling PDF upload:', err);
        alert('Failed to upload PDF. Please try again.');
      }
    } else {
      alert('Please select a valid PDF file.');
    }
  }

  function handleDragStart(e, item) {
    if (item.isPdfUpload) {
      fileInput.click();
      e.preventDefault();
      return;
    }

    const dragData = {
      id: item.id,
      type: item.isPdf ? 'pdf' : (item.isScreenShare ? 'screen' : (item.id === 'camera' ? 'camera' : 'image')),
      label: item.label,
      thumbnail: item.thumbnail,
      preview: item.preview,
      pdfUrl: item.pdfUrl,
      isScreenShare: item.isScreenShare || false,
      isPdf: item.isPdf || false,
      size: item.size,
      lastModified: item.lastModified
    };

    try {
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'copy';
      
      const sourceContent = e.target.closest('.source-content');
      if (sourceContent) {
        sourceContent.style.opacity = '0.5';
        setTimeout(() => {
          sourceContent.style.opacity = '1';
        }, 100);
      }

      dispatch('dragStart', { item: dragData });
    } catch (err) {
      console.error('Error starting drag:', err);
    }
  }

  function handleSearch(e) {
    searchQuery = e.target.value;
  }

  let container;
  let isDragging = false;
  let startY = 0;
  let scrollTop = 0;
  let currentRotation = 0;
  let items = [];
  let radius = 250;
  let itemHeight = 80;
  let itemWidth = 160;
  let centerOffset;
  let momentum = 0;
  let animationFrame;
  let sensitivity = 0.002;
  let isInitialized = false;
</script>

<!-- Add hidden file input -->
<input
  type="file"
  accept=".pdf"
  style="display: none"
  bind:this={fileInput}
  on:change={handleFileUpload}
/>

<div 
  class="sidebar-container" 
  bind:this={container}
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseUp}
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:touchend={handleTouchEnd}
  on:wheel={handleWheel}
>
  <div class="layout">
    <!-- Left Icon Menu -->
    <div class="icon-menu">
      <div class="logo">
<svg width="42" height="16" viewBox="0 0 42 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.63605 1.53687V8.51103H6.44657V3.73386L4.23487 8.51103H3.4118L1.18948 3.73641V8.51359H0V1.53687H1.28241L3.82864 7.00635L6.36426 1.53687H7.63605Z" fill="white"/>
<path d="M9.16285 4.24727C9.40181 3.81809 9.72839 3.48599 10.1426 3.24841C10.5568 3.01082 11.0134 2.89331 11.5153 2.89331C11.9666 2.89331 12.3622 2.97761 12.6994 3.14877C13.0366 3.31994 13.3048 3.53197 13.5066 3.78743V2.98528H14.7067V8.51608H13.5066V7.69348C13.3048 7.95405 13.0313 8.1712 12.6835 8.34491C12.3357 8.51863 11.9401 8.60549 11.494 8.60549C11.0002 8.60549 10.5488 8.48286 10.1373 8.24017C9.72573 7.99493 9.40181 7.65516 9.16285 7.21576C8.92389 6.77892 8.80176 6.28076 8.80176 5.72641C8.80176 5.17205 8.92124 4.679 9.16285 4.24982V4.24727ZM13.2623 4.74798C13.0977 4.46697 12.8853 4.25238 12.6198 4.10677C12.3543 3.9586 12.0702 3.88707 11.7648 3.88707C11.4595 3.88707 11.1728 3.9586 10.9099 4.10166C10.6444 4.24472 10.432 4.45675 10.2674 4.73265C10.1028 5.01111 10.0231 5.34066 10.0231 5.7213C10.0231 6.10194 10.1054 6.4366 10.2674 6.72527C10.4293 7.01395 10.647 7.23109 10.9152 7.38182C11.1834 7.53254 11.4675 7.60662 11.7648 7.60662C12.0622 7.60662 12.3569 7.53254 12.6198 7.38692C12.8853 7.23876 13.0977 7.02417 13.2623 6.7406C13.4269 6.45703 13.5066 6.12238 13.5066 5.74174C13.5066 5.36109 13.4243 5.02899 13.2623 4.74798Z" fill="white"/>
<path d="M18.5462 5.75205L21.196 8.51106H19.5896L17.4629 6.13269V8.51106H16.2734V1.08472H17.4629V5.39951L19.5498 2.98026H21.1986L18.5489 5.74949L18.5462 5.75205Z" fill="white"/>
<path d="M23.4367 3.91524V6.9757C23.4367 7.18262 23.4872 7.33079 23.5881 7.42276C23.689 7.51473 23.8615 7.55816 24.1058 7.55816H24.836V8.51104H23.8961C23.3597 8.51104 22.9508 8.39097 22.6641 8.15083C22.38 7.9107 22.2366 7.51728 22.2366 6.9757V3.91524H21.5596V2.9828H22.2366V1.6084H23.4367V2.9828H24.8333V3.91524H23.4367Z" fill="white"/>
<path d="M25.8923 4.24727C26.1313 3.81809 26.4579 3.48599 26.8721 3.24841C27.2863 3.01082 27.7429 2.89331 28.2448 2.89331C28.6961 2.89331 29.0917 2.97761 29.4289 3.14877C29.7661 3.31994 30.0369 3.53197 30.2361 3.78743V2.98528H31.4362V8.51608H30.2361V7.69348C30.0343 7.95405 29.7608 8.1712 29.413 8.34491C29.0652 8.51863 28.6696 8.60549 28.2235 8.60549C27.7297 8.60549 27.2783 8.48286 26.8668 8.24017C26.4552 7.99493 26.1313 7.65516 25.8923 7.21576C25.6534 6.77892 25.5312 6.28076 25.5312 5.72641C25.5312 5.17205 25.6507 4.679 25.8923 4.24982V4.24727ZM29.9918 4.74798C29.8272 4.46697 29.6148 4.25238 29.3493 4.10677C29.0838 3.9586 28.7997 3.88707 28.4943 3.88707C28.189 3.88707 27.9022 3.9586 27.6394 4.10166C27.3765 4.24472 27.1615 4.45675 26.9969 4.73265C26.8322 5.01111 26.7526 5.34066 26.7526 5.7213C26.7526 6.10194 26.8349 6.4366 26.9969 6.72527C27.1615 7.01395 27.3765 7.23109 27.6447 7.38182C27.9129 7.53254 28.197 7.60662 28.4943 7.60662C28.7917 7.60662 29.0864 7.53254 29.3493 7.38692C29.6148 7.23876 29.8272 7.02417 29.9918 6.7406C30.1538 6.45703 30.2361 6.12238 30.2361 5.74174C30.2361 5.36109 30.1538 5.02899 29.9918 4.74798Z" fill="white"/>
<path d="M35.0208 3.14887C35.3713 2.97771 35.7616 2.8934 36.1944 2.8934C36.7015 2.8934 37.1608 3.01092 37.5723 3.24594C37.9812 3.48097 38.3052 3.81307 38.5415 4.24481C38.7778 4.67654 38.8972 5.16959 38.8972 5.72395C38.8972 6.2783 38.7778 6.77646 38.5415 7.2133C38.3052 7.6527 37.9786 7.99247 37.567 8.23771C37.1528 8.48296 36.6962 8.60303 36.1944 8.60303C35.7483 8.60303 35.3553 8.51872 35.0102 8.35267C34.665 8.18662 34.3915 7.97203 34.1924 7.71146V8.51361H33.0029V1.08472H34.1924V3.80541C34.3942 3.53717 34.6703 3.31747 35.0208 3.14887ZM37.4396 4.73274C37.275 4.45429 37.0599 4.24481 36.7917 4.10175C36.5236 3.95869 36.2368 3.88716 35.9315 3.88716C35.6262 3.88716 35.35 3.96124 35.0819 4.10686C34.8137 4.25503 34.5986 4.46706 34.434 4.74807C34.2694 5.02908 34.1898 5.36119 34.1898 5.74183C34.1898 6.12247 34.2721 6.45713 34.434 6.74069C34.596 7.02426 34.8137 7.2414 35.0819 7.38702C35.35 7.53519 35.6341 7.60672 35.9315 7.60672C36.2289 7.60672 36.5236 7.53263 36.7917 7.38191C37.0599 7.23118 37.275 7.01148 37.4396 6.72536C37.6042 6.43924 37.6839 6.10203 37.6839 5.72139C37.6839 5.34075 37.6015 5.0112 37.4396 4.73274Z" fill="white"/>
<path d="M40.1367 2.0401C39.9906 1.8996 39.9189 1.72588 39.9189 1.51896C39.9189 1.31203 39.9906 1.13832 40.1367 0.997811C40.2827 0.857305 40.4632 0.78833 40.6783 0.78833C40.8934 0.78833 41.0633 0.857305 41.2093 0.997811C41.3554 1.13832 41.4297 1.31203 41.4297 1.51896C41.4297 1.72588 41.3554 1.8996 41.2093 2.0401C41.0633 2.18061 40.8854 2.25214 40.6783 2.25214C40.4712 2.25214 40.2827 2.18061 40.1367 2.0401ZM41.2624 2.98277V8.51357H40.0729V2.98277H41.2624Z" fill="white"/>
<path d="M27.8761 10.6953V11.3595H26.5008V15.6666H25.6538V11.3595H24.2705V10.6953H27.8761Z" fill="white"/>
<path d="M32.4528 13.9985H29.3225C29.3464 14.3127 29.4685 14.5656 29.6862 14.7572C29.9039 14.9488 30.1721 15.0433 30.4881 15.0433C30.9447 15.0433 31.266 14.8594 31.4545 14.4915H32.3679C32.2431 14.8543 32.02 15.1506 31.6961 15.3831C31.3722 15.6156 30.9686 15.7305 30.4881 15.7305C30.0951 15.7305 29.7446 15.6462 29.4366 15.4776C29.126 15.309 28.8844 15.0689 28.7091 14.7623C28.5339 14.4558 28.4463 14.0981 28.4463 13.6919C28.4463 13.2858 28.5313 12.9307 28.7038 12.6215C28.8738 12.315 29.1154 12.0774 29.426 11.9088C29.7367 11.7402 30.0924 11.6584 30.4934 11.6584C30.8943 11.6584 31.2235 11.7402 31.5262 11.9011C31.8289 12.0621 32.0652 12.292 32.2325 12.5832C32.3997 12.877 32.4847 13.2142 32.4847 13.5949C32.4847 13.743 32.4741 13.8759 32.4555 13.9959L32.4528 13.9985ZM31.5979 13.3394C31.5926 13.038 31.4811 12.7978 31.2633 12.6164C31.0456 12.4351 30.7748 12.3456 30.4535 12.3456C30.1615 12.3456 29.9119 12.4351 29.7021 12.6139C29.4951 12.7927 29.3703 13.0354 29.3304 13.3394H31.5979Z" fill="white"/>
<path d="M33.29 12.6215C33.46 12.315 33.6989 12.0774 33.999 11.9088C34.299 11.7402 34.6495 11.6584 35.0398 11.6584C35.5363 11.6584 35.9451 11.7709 36.2691 11.9982C36.593 12.2256 36.8134 12.5475 36.9275 12.9664H36.0142C35.9398 12.7723 35.8204 12.619 35.6584 12.5091C35.4938 12.3993 35.2893 12.3456 35.0424 12.3456C34.6946 12.3456 34.4185 12.4632 34.214 12.7007C34.0096 12.9383 33.906 13.2679 33.906 13.6919C33.906 14.116 34.0096 14.4481 34.214 14.6857C34.4185 14.9233 34.6972 15.0433 35.0424 15.0433C35.5336 15.0433 35.8575 14.8364 36.0168 14.42H36.9302C36.8107 14.8211 36.5877 15.1379 36.2611 15.3755C35.9345 15.6105 35.5283 15.7305 35.0424 15.7305C34.6521 15.7305 34.3043 15.6462 34.0016 15.4776C33.6989 15.309 33.4626 15.0689 33.2927 14.7623C33.1228 14.4558 33.0352 14.0981 33.0352 13.6919C33.0352 13.2858 33.1201 12.9307 33.2927 12.6215H33.29Z" fill="white"/>
<path d="M40.7315 11.8525C40.9758 11.9803 41.1696 12.1719 41.3103 12.4248C41.451 12.6777 41.5227 12.9817 41.5227 13.3393V15.6641H40.6837V13.462C40.6837 13.1094 40.5908 12.8386 40.4076 12.6496C40.2244 12.4605 39.9748 12.366 39.6562 12.366C39.3376 12.366 39.088 12.4605 38.9021 12.6496C38.7163 12.8386 38.6233 13.1094 38.6233 13.462V15.6641H37.7764V10.3708H38.6233V12.1795C38.7667 12.0135 38.9499 11.8832 39.1703 11.7938C39.3907 11.7044 39.6323 11.6584 39.8951 11.6584C40.2084 11.6584 40.4872 11.7223 40.7315 11.8525Z" fill="white"/>
</svg>

      </div>

      <nav class="menu-items">
        {#each menuItems as item}
          <button
            class="menu-item"
            class:active={activeMenuItem === item.id}
            on:click={() => handleMenuClick(item.id)}
          >
            <span class="icon">
              <img src={item.icon} alt={item.label} class="menu-icon" />
            </span>
          </button>
        {/each}
      </nav>

      <div class="bottom-icons">
        <button class="menu-item">
          <span class="icon"><svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.75 7.59163V12.4C2.75 14.1666 2.75 14.1666 4.58333 15.2916L9.625 17.9416C10.3858 18.3416 11.6233 18.3416 12.375 17.9416L17.4167 15.2916C19.25 14.1666 19.25 14.1666 19.25 12.4083V7.59163C19.25 5.8333 19.25 5.8333 17.4167 4.7083L12.375 2.0583C11.6233 1.6583 10.3858 1.6583 9.625 2.0583L4.58333 4.7083C2.75 5.8333 2.75 5.8333 2.75 7.59163Z" stroke="#BFBFBF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="mix-blend-mode:plus-darker"/>
            <path d="M11 12.5C12.5188 12.5 13.75 11.3807 13.75 10C13.75 8.61929 12.5188 7.5 11 7.5C9.48122 7.5 8.25 8.61929 8.25 10C8.25 11.3807 9.48122 12.5 11 12.5Z" stroke="#BFBFBF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="mix-blend-mode:plus-darker"/>
            </svg>
            </span>
        </button>
        <button class="menu-item exit">
          <span class="icon"><svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.9698 18.5583H13.8506C9.78064 18.5583 7.81898 17.1 7.47981 13.8333C7.44314 13.4917 7.71814 13.1833 8.10314 13.15C8.47898 13.1166 8.81814 13.375 8.85481 13.7167C9.12064 16.3333 10.4773 17.3083 13.8598 17.3083H13.979C17.7098 17.3083 19.0298 16.1083 19.0298 12.7167V7.28332C19.0298 3.89165 17.7098 2.69165 13.979 2.69165H13.8598C10.459 2.69165 9.10231 3.68332 8.85481 6.34998C8.80898 6.69165 8.49731 6.94998 8.10314 6.91665C7.71814 6.89165 7.44314 6.58332 7.47064 6.24165C7.78231 2.92498 9.75314 1.44165 13.8506 1.44165H13.9698C18.4706 1.44165 20.3956 3.19165 20.3956 7.28332V12.7167C20.3956 16.8083 18.4706 18.5583 13.9698 18.5583Z" fill="#FF453A"/>
            <path d="M13.6397 10.625H1.83301C1.45717 10.625 1.14551 10.3417 1.14551 10C1.14551 9.65833 1.45717 9.375 1.83301 9.375H13.6397C14.0155 9.375 14.3272 9.65833 14.3272 10C14.3272 10.3417 14.0247 10.625 13.6397 10.625Z" fill="#FF453A"/>
            <path d="M11.5954 13.4167C11.4212 13.4167 11.247 13.3584 11.1095 13.2334C10.8437 12.9917 10.8437 12.5917 11.1095 12.35L13.6945 10L11.1095 7.65003C10.8437 7.40837 10.8437 7.00837 11.1095 6.7667C11.3754 6.52503 11.8154 6.52503 12.0812 6.7667L15.152 9.55837C15.4179 9.80003 15.4179 10.2 15.152 10.4417L12.0812 13.2334C11.9437 13.3584 11.7695 13.4167 11.5954 13.4167Z" fill="#FF453A"/>
            </svg>
            </span>
        </button>
      </div>
    </div>

    <!-- Source Panel -->
    <div class="source-panel">
      <h3 class="section-title">Source</h3>
      <div class="search-container">
        <input
          type="text"
          placeholder="Search sources..."
          value={searchQuery}
          on:input={handleSearch}
          class="search-input"
        />
      </div>

      <div class="source-section">
        <div class="sources-container">
          {#each items as item, i (item.id + i)}
            <div 
              class="source-item"
              draggable="true"
              on:dragstart={(e) => handleDragStart(e, item)}
              style={item.style}
            >
              <div class="source-content">
                <img
                  src={item.thumbnail}
                  alt={item.preview}
                  class="thumbnail-img"
                />
                <span class="source-label">{item.label}</span>
              </div>
              </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 317px;
  }
  .layout {
    display: flex;
    height: 100vh;
    position: relative;
    width: 100%;
    color: white;
  }

  /* Icon Menu Styles */
  .icon-menu {
    width: 6vw;
    background-color: black;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 7px 0;
    box-sizing: border-box;
    border-top-left-radius: 24px;
    border-bottom-left-radius: 24px;
    margin-left: 1px;
  }

  .logo {
    width: 100%;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    margin-top: 10px;
  }

  .logo img {
    width: 100%;
    height: auto;
  }

  .menu-items {
    margin-top: 7vh;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    border-radius: 24px;
    color: white;
    align-items: center;
    /* padding: 0px 10px; */
  }

  .menu-item {
    width: 40px;
    height: 40px;
    background: #20242B;
    border: none;
    color: #ffffff;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.2s ease;
    font-size: 1.2rem;
    font-family: "Segoe UI Symbol", "Apple Color Emoji", sans-serif;
    border-radius: 24px;
  }

  .menu-item:hover {
    background-color: #20242B;
    color: #ffffff;
    transform: scale(1.1);
  }

  .menu-item.active {
    color: #ffffff;
    background-color: rgba(2, 136, 6, 0.938);
    border-radius: 24px;
  }

  .bottom-icons {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    background-color: none !important;
    align-items: center;
  }

  .exit {
    margin-bottom: 10px;
  }

  .exit .icon {
    background-color: none !important;
  }

  /* Source Panel Styles */
  .source-panel {
    width: 267px;
    background-color: black;
    padding: 1rem 0.5rem;
    box-sizing: border-box;
    color: #ffffff;
    border-left: 1px solid #1a1a1a;
    display: flex;
    flex-direction: column;
    height: 100vh;
    border-top-right-radius: 24px;
    border-bottom-right-radius: 24px;
    perspective: 2000px;
    overflow: hidden;
    position: relative;
  }

  .search-container {
    position: relative;
    width: 100%;
    flex-shrink: 0;
    margin-bottom: 1.5rem;
  }

  .source-section {
    flex: 1;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .section-title {
    color: #666666;
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0 0 1rem 0;
    flex-shrink: 0;
  }

  .sources-container {
    position: relative;
    width: 100%;
    height: calc(100vh - 200px);
    transform-style: preserve-3d;
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 1200px;
    overflow: visible;
    margin: 20px 0;
  }

  .source-item {
    position: absolute;
    width: 160px;
    height: 80px;
    left: 50%;
    transform-origin: 50% 50% -250px;
    cursor: grab;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .source-content {
    width: 100%;
    height: 100%;
    padding: 0;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease-out;
    transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-font-smoothing: subpixel-antialiased;
  }

  .source-content:hover {
    transform: scale(1.05) translateZ(0);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .source-content:active {
    transform: scale(0.98) translateZ(0);
  }

  .source-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    pointer-events: none;
  }

  .source-label {
    position: absolute;
    bottom: 8px;
    left: 8px;
    color: white;
    font-size: 12px;
    font-weight: 500;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 16px);
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    backdrop-filter: blur(4px);
  }

  .source-item:active {
    cursor: grabbing;
  }

  .search-input {
    width: 80%;
    padding: 0.75rem 1rem;
    background-color: #0c0c0c;
    border: none;
    border-radius: 8px;
    color: #ffffff;
    font-size: 0.9rem;
  }

  .search-input::placeholder {
    color: #666666;
  }

  .search-input:focus {
    outline: none;
    background-color: #1a1a1a;
  }

  .icon {
    font-size: 1.25rem;
  }

  .menu-item .icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-icon {
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(1);
  }

  .sidebar-container:active {
    cursor: grabbing;
  }

  /* Add smooth scrollbar for touch devices */
  @media (hover: none) {
    .sidebar-container {
      overflow-y: auto;
      scroll-behavior: smooth;
    }

    .sidebar-container::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }
  }

  .source-item[data-pdf-upload="true"] .source-content {
    background: rgba(255, 68, 51, 0.1);
    border: 1px dashed rgba(255, 68, 51, 0.5);
  }

  .source-item[data-pdf-upload="true"]:hover .source-content {
    background: rgba(255, 68, 51, 0.15);
    border: 1px dashed rgba(255, 68, 51, 0.7);
  }

  .source-item[data-pdf-upload="true"] img {
    width: 40px;
    height: 40px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    object-fit: contain;
  }

  /* Improve performance */
  .sources-container {
    transform: translateZ(0);
    backface-visibility: hidden;
    will-change: transform;
  }

  @media (max-width: 768px) {
    .sidebar-container {
      width: 100%;
    }
    
    .icon-menu {
      width: 60px;
    }
    
    .source-panel {
      width: calc(100% - 60px);
    }
  }
</style>
