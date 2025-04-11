<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { slide } from 'svelte/transition';
  import copyLink from './icons/copy-link.svg';
  import micIcon from './icons/mic.svg';
  import micCloseIcon from './icons/mic-close.svg';
  import audioLevelIcon from './icons/audio-level.svg';
  import audioCloseIcon from './icons/audio-close.svg';
  import cameraOpenIcon from './icons/camera-open.svg';
  import cameraCloseIcon from './icons/camera-close.svg';
  import recordIcon from './icons/record.svg';
  import recordCloseIcon from './icons/record-close.svg';
  import shareIcon from './icons/share.svg';
  import addPersonIcon from './icons/add-person.svg';
  import aiIcon from './icons/ai.svg';
  import exitMeetingIcon from './icons/exit-meeting.svg';
  import saveIcon from './icons/save.svg';
  const dispatch = createEventDispatcher();

  // State management
  let activeMenuItem = 'mic';
  let isMicOn = true;
  let isSpeakerOn = true;
  let isVideoOn = true;
  let isScreenSharing = false;
  let isRecording = false;
  let showVolumeSlider = false;
  let volume = 75;

  // Media stream management
  let micStream = null;
  let videoStream = null;
  let screenStream = null;
  let mediaRecorder = null;
  let recordedChunks = [];

  // Device permissions state
  let hasMicPermission = false;
  let hasVideoPermission = false;

  // Initialize volume slider gradient and check permissions
  onMount(async () => {
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      slider.style.setProperty('--volume-percent', `${volume}%`);
    }

    // Check initial permissions
    try {
      const permissions = await navigator.permissions.query({ name: 'microphone' });
      hasMicPermission = permissions.state === 'granted';
    } catch (e) {
      console.log('Microphone permission check failed:', e);
    }

    try {
      const permissions = await navigator.permissions.query({ name: 'camera' });
      hasVideoPermission = permissions.state === 'granted';
    } catch (e) {
      console.log('Camera permission check failed:', e);
    }
  });

  // Cleanup function for media streams
  function stopStream(stream) {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  // Cleanup on component destroy
  onDestroy(() => {
    stopStream(micStream);
    stopStream(videoStream);
    stopStream(screenStream);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  });

  async function startMicrophone() {
    try {
      if (micStream) {
        stopStream(micStream);
      }
      micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      hasMicPermission = true;
      return true;
    } catch (e) {
      console.log('Microphone start failed:', e);
      hasMicPermission = false;
      return false;
    }
  }

  async function startCamera() {
    try {
      if (videoStream) {
        stopStream(videoStream);
      }
      videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      });
      hasVideoPermission = true;
      
      // Update video element with stream
      const videoElement = document.getElementById('camera-feed');
      if (videoElement) {
        videoElement.srcObject = videoStream;
        videoElement.play();
      }
      
      return true;
    } catch (e) {
      console.log('Camera start failed:', e);
      hasVideoPermission = false;
      return false;
    }
  }

  async function startScreenRecording() {
    try {
      // Get screen stream
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });

      // Create MediaRecorder
      mediaRecorder = new MediaRecorder(screenStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
      });

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `recording-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);

        // Reset recording state and dispatch events
        recordedChunks = [];
        stopStream(screenStream);
        screenStream = null;
        mediaRecorder = null;
        isRecording = false;
        dispatch('recordingToggle', { isRecording });
        
        // Dispatch recording stopped event
        window.dispatchEvent(new Event('recordingStopped'));
      };

      // Start recording
      mediaRecorder.start();
      
      // Dispatch recording started event
      window.dispatchEvent(new Event('recordingStarted'));
      
      return true;
    } catch (e) {
      console.error('Screen recording failed:', e);
      return false;
    }
  }

  function stopScreenRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  async function toggleRecording() {
    isRecording = !isRecording;
    dispatch('recordingToggle', { isRecording });
    
    if (isRecording) {
      const success = await startScreenRecording();
      if (!success) {
        isRecording = false;
        dispatch('recordingToggle', { isRecording });
        dispatch('error', { message: 'Failed to start recording' });
      }
    } else {
      stopScreenRecording();
    }
  }

  const menuItems = [
    { 
      id: 'copylink',
      icon: () => copyLink,
      label: 'Copy Link',
      action: () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
          dispatch('notification', { message: 'Meeting link copied to clipboard!' });
        }).catch(() => {
          dispatch('error', { message: 'Failed to copy link' });
        });
      }
    },
    { 
      id: 'mic',
      icon: (active) => active ? micIcon : micCloseIcon,
      label: 'Microphone',
      action: async () => {
        try {
          if (!isMicOn) {
            const success = await startMicrophone();
            if (!success) {
              dispatch('error', { message: 'Failed to start microphone' });
              return;
            }
          } else {
            stopStream(micStream);
            micStream = null;
          }
          isMicOn = !isMicOn;
          dispatch('micToggle', { 
            active: isMicOn,
            action: isMicOn ? 'unmute' : 'mute',
            stream: isMicOn ? micStream : null
          });
        } catch (e) {
          console.error('Microphone toggle failed:', e);
          dispatch('error', { message: 'Failed to toggle microphone' });
        }
      }
    },
    { 
      id: 'speaker',
      icon: (active) => {
        if (!active) return audioCloseIcon;
        if (volume === 0) return audioCloseIcon;
        if (volume < 33) return audioLevelIcon;
        if (volume < 66) return audioLevelIcon;
        return audioLevelIcon;
      },
      label: 'Speaker',
      action: () => {
        if (showVolumeSlider) {
          isSpeakerOn = !isSpeakerOn;
          dispatch('speakerToggle', { active: isSpeakerOn });
        }
        showVolumeSlider = !showVolumeSlider;
      }
    },
    { 
      id: 'video',
      icon: (active) => active ? cameraOpenIcon : cameraCloseIcon,
      label: 'Video',
      action: async () => {
        try {
          if (!isVideoOn) {
            const success = await startCamera();
            if (!success) {
              dispatch('error', { message: 'Failed to start camera' });
              return;
            }
          } else {
            stopStream(videoStream);
            videoStream = null;
          }
          isVideoOn = !isVideoOn;
          dispatch('videoToggle', { 
            active: isVideoOn,
            action: isVideoOn ? 'startVideo' : 'stopVideo',
            stream: isVideoOn ? videoStream : null
          });
        } catch (e) {
          console.error('Camera toggle failed:', e);
          dispatch('error', { message: 'Failed to toggle camera' });
        }
      }
    },
    { 
      id: 'record',
      icon: (active) => active ? recordIcon : recordCloseIcon,
      label: 'Record',
      action: toggleRecording
    },
    { 
      id: 'screen',
      icon: (active) => active ? shareIcon : shareIcon,
      label: 'Screen Share',
      action: async () => {
        try {
          if (!isScreenSharing) {
            await navigator.mediaDevices.getDisplayMedia({ video: true });
            isScreenSharing = true;
            dispatch('screenShare', { 
              active: true,
              action: 'startSharing'
            });
          } else {
            dispatch('screenShare', { 
              active: false,
              action: 'stopSharing'
            });
            isScreenSharing = false;
          }
        } catch (e) {
          console.log('Screen sharing error:', e);
          dispatch('error', { message: 'Screen sharing failed or was denied' });
          isScreenSharing = false;
        }
      }
    },
    { 
      id: 'add',
      icon: () => addPersonIcon,
      label: 'Share',
      action: () => {
        dispatch('share');
      }
    },
    { 
      id: 'ai',
      icon: () => aiIcon,
      label: 'AI Assistant',
      action: async () => {
        const aiWindow = window.open('', 'AI Assistant', 'width=400,height=600');
        try {
          const response = await fetch('/ai-assistant.html');
          const htmlContent = await response.text();
          aiWindow.document.write(htmlContent);
        } catch (error) {
          console.error('Failed to load AI assistant:', error);
          aiWindow.document.write('<h1>Error</h1><p>Failed to load AI assistant. Please try again later.</p>');
        }
      }
    },
    { 
      id: 'exit',
      icon: () => exitMeetingIcon,
      label: 'Exit Meeting',
      action: () => {
        dispatch('exit');
      }
    },
    { 
      id: 'save',
      icon: () => saveIcon,
      label: 'Save',
      action: () => {
        dispatch('save');
      }
    },
  ];

  function handleMenuClick(item) {
    item.action();
  }

  function handleVolumeChange(event) {
    volume = event.target.value;
    const slider = event.target;
    slider.style.setProperty('--volume-percent', `${volume}%`);
    dispatch('volumeChange', { volume: parseInt(volume) });
  }

  // Add click handler for closing volume slider when clicking outside
  function handleClickOutside(event) {
    if (showVolumeSlider && !event.target.closest('.menu-item-container')) {
      showVolumeSlider = false;
    }
  }

  $: activeStates = {
    mic: isMicOn,
    speaker: isSpeakerOn,
    video: isVideoOn,
    screen: isScreenSharing,
    record: isRecording
  };
</script>

<svelte:window on:click={handleClickOutside} />

<div class="right-menu">
  {#if isVideoOn && videoStream}
    <div class="camera-feed-container">
      <video 
        id="camera-feed"
        autoplay
        playsinline
        muted
        class="camera-feed"
      ></video>
    </div>
  {/if}
  
  <nav class="menu-items">
    {#each menuItems as item}
      <div class="menu-item-container">
        <button
          class="menu-item"
          class:active={activeStates[item.id]}
          class:record={item.id === 'record'}
          on:click={() => handleMenuClick(item)}
        >
          <span class="icon">
            <img src={item.icon(activeStates[item.id])} alt={item.label} class="menu-icon" />
          </span>
        </button>
        
        {#if item.id === 'speaker' && showVolumeSlider}
          <div class="volume-slider" 
            on:click|stopPropagation
            transition:slide>
            <input 
              type="range" 
              min="0" 
              max="100" 
              bind:value={volume}
              on:input={handleVolumeChange}
            />
          </div>
        {/if}
      </div>
    {/each}
  </nav>

  <div class="bottom-icons">
    <button class="menu-item" on:click={() => handleMenuClick(menuItems[menuItems.length - 1])}>
      <span class="icon">
        
        <img src={menuItems[menuItems.length - 1].icon()} alt={menuItems[menuItems.length - 1].label} class="menu-icon" />
      </span>
    </button>
  </div>
</div>

<style>
  .right-menu {
    width: 72px;
    background-color: #000000;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0;
    box-sizing: border-box;
    height: 100vh;
    border-top-left-radius: 50px;
    border-bottom-left-radius: 50px;
    position: relative;
    overflow: hidden;
    border-radius: 20px;
    margin-right: 1px;
  }

  .right-menu::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.945) 0%, rgb(0, 0, 0));
    border-top-left-radius: 50px;
    border-bottom-left-radius: 50px;
    pointer-events: none;
    border-radius: 50px;
  }

  .menu-items {
    margin-top: 0.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .menu-item-container {
    position: relative;
    display: flex;
    align-items: center;
  }
.menu-item-container:first-child{
  margin-bottom: 15vh;
}
  .menu-item{
    margin-left: 17px;
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    color: #4D4D4D;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.2s ease;
    font-family: "Segoe UI Symbol", "Apple Color Emoji", sans-serif;
    border-radius: 50%;
  }

  .menu-item:hover {
    background-color: rgba(255, 255, 255, 0.03);
    color: #808080;
  }

  /* .menu-item.active {
    color: #4CAF50;
    background-color: rgba(76, 175, 80, 0.08);
  } */

  .menu-item.record {
    color: #ff4444;
  }

  .menu-item.record:hover {
    color: #ff6666;
  }

  .bottom-icons {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    margin-top: 1rem;
  }

  .icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon svg {
    width: 100%;
    height: 100%;
  }

  .volume-slider {
    position: fixed;
    right: 82px;
    top: 21%;
    transform: translateY(-50%);
    background: #1a1a1a;
    padding: 15px 8px;
    border-radius: 12px;
    height: 140px;
    width: 35px;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .volume-slider input[type="range"] {
    width: 120px;
    height: 3px;
    background: #333333;
    border-radius: 4px;
    outline: none;
    -webkit-appearance: none;
    transform: rotate(-90deg);
    transform-origin: center;
    margin: 0;
    padding: 0;
  }

  .volume-slider input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: #ffffff;
    border-radius: 50%;
    cursor: pointer;
    margin-top: -4.5px;
  }

  .volume-slider input[type="range"]::-webkit-slider-runnable-track {
    background: linear-gradient(to top, #4CAF50 0%, #4CAF50 var(--volume-percent, 50%), #333333 var(--volume-percent, 50%), #333333 100%);
    border-radius: 4px;
    height: 3px;
    border: none;
  }

  .camera-feed-container {
    position: fixed;
    top: 0;
    right: 72px;
    width: 320px;
    height: 240px;
    background: #000;
    z-index: 1000;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .camera-feed {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1); /* Mirror the video */
  }
  .menu-item-container:last-child{
    margin-top: 6vh;
    margin-bottom: 0px;
  }
</style> 