<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let monitorItems = [
    {
      id: 'table-1',
      type: 'table',
      title: 'Participants',
      content: {
        headers: ['Name', 'Status', 'Duration', 'Quality'],
        rows: [
          ['John Doe', 'Active', '1:23:45', 'HD'],
          ['Jane Smith', 'Active', '1:20:15', 'HD'],
          ['Mike Johnson', 'Away', '0:45:30', 'SD']
        ]
      }
    },
    {
      id: 'chart-1',
      type: 'chart',
      title: 'Network Quality',
      content: {
        type: 'line',
        data: {
          labels: ['0s', '10s', '20s', '30s', '40s', '50s'],
          values: [95, 92, 98, 85, 90, 95]
        }
      }
    }
  ];

  let monitorGridRef;
  const SCROLL_AMOUNT = 300; // pixels to scroll each time
  let monitorHeight = 400; // Initial height
  const MIN_HEIGHT = 200;
  const MAX_HEIGHT = 800;
  const RESIZE_STEP = 100; // Amount to resize by each click
  let isFullscreen = false;
  let monitorContainerRef;

  function handleCloseAll() {
    monitorItems = [];
    dispatch('closeAll');
  }

  function handleSelectAll() {
    dispatch('selectAll', { items: monitorItems });
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function handleDrop(e) {
    e.preventDefault();
    const sourceType = e.dataTransfer.getData('sourceType');
    const sourceId = e.dataTransfer.getData('sourceId');
    const sourceData = e.dataTransfer.getData('sourceData');

    if (!monitorItems.find(item => item.id === sourceId)) {
      try {
        const content = sourceData ? JSON.parse(sourceData) : null;
        monitorItems = [...monitorItems, {
          id: sourceId,
          type: sourceType,
          title: content?.title || 'New Item',
          content
        }];
      } catch (err) {
        console.error('Failed to add monitor item:', err);
      }
    }
  }

  function handleScrollUp() {
    if (monitorGridRef) {
      monitorGridRef.scrollBy({
        top: -SCROLL_AMOUNT,
        behavior: 'smooth'
      });
    }
  }

  function handleScrollDown() {
    if (monitorGridRef) {
      monitorGridRef.scrollBy({
        top: SCROLL_AMOUNT,
        behavior: 'smooth'
      });
    }
  }

  function handleResizeUp() {
    if (monitorHeight < MAX_HEIGHT) {
      monitorHeight = Math.min(monitorHeight + RESIZE_STEP, MAX_HEIGHT);
    }
  }

  function handleResizeDown() {
    if (monitorHeight > MIN_HEIGHT) {
      monitorHeight = Math.max(monitorHeight - RESIZE_STEP, MIN_HEIGHT);
    }
  }

  function handleFullscreen() {
    if (!document.fullscreenElement) {
      if (monitorContainerRef.requestFullscreen) {
        monitorContainerRef.requestFullscreen();
      } else if (monitorContainerRef.webkitRequestFullscreen) {
        monitorContainerRef.webkitRequestFullscreen();
      } else if (monitorContainerRef.msRequestFullscreen) {
        monitorContainerRef.msRequestFullscreen();
      }
      isFullscreen = true;
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

<div class="monitor-container" style="height: {monitorHeight}px" bind:this={monitorContainerRef}>
  <div class="header">
    <div class="left">
      <!-- <h2>Table Monitor</h2> -->
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
              <path d="M6.66666 13.3333V16.6667H3.33332M13.3333 16.6667H16.6667V13.3333M16.6667 6.66667V3.33333H13.3333M3.33332 3.33333H6.66666V6.66667" stroke="#34C759" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {/if}
        </button>
        <button class="control-btn up-btn" on:click={handleResizeUp}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" width="20" height="20" rx="10" transform="rotate(90 20 0)" fill="#34C759"/>
            <path d="M9.99937 15.8594C9.81289 15.8594 9.63404 15.7854 9.50218 15.6535C9.37032 15.5216 9.29624 15.3428 9.29624 15.1563L9.29624 6.54303L6.27808 9.56178C6.14599 9.69387 5.96684 9.76808 5.78003 9.76808C5.59323 9.76808 5.41407 9.69387 5.28198 9.56178C5.14989 9.42969 5.07569 9.25054 5.07569 9.06374C5.07569 8.87693 5.14989 8.69778 5.28198 8.56569L9.50073 4.34694C9.56606 4.28139 9.64368 4.22938 9.72914 4.19389C9.81461 4.1584 9.90624 4.14014 9.99878 4.14014C10.0913 4.14014 10.183 4.1584 10.2684 4.19389C10.3539 4.22938 10.4315 4.28139 10.4968 4.34694L14.7156 8.56569C14.781 8.6311 14.8329 8.70874 14.8683 8.7942C14.9037 8.87965 14.9219 8.97124 14.9219 9.06374C14.9219 9.15623 14.9037 9.24782 14.8683 9.33328C14.8329 9.41873 14.781 9.49638 14.7156 9.56178C14.6502 9.62719 14.5725 9.67907 14.4871 9.71447C14.4016 9.74986 14.31 9.76808 14.2175 9.76808C14.125 9.76808 14.0334 9.74986 13.948 9.71447C13.8625 9.67907 13.7849 9.62719 13.7195 9.56178L10.7025 6.54303L10.7025 15.1563C10.7025 15.3428 10.6284 15.5216 10.4966 15.6535C10.3647 15.7854 10.1858 15.8594 9.99937 15.8594Z" fill="white"/>
          </svg>
        </button>
        <button class="control-btn down-btn" on:click={handleResizeDown}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="20" height="20" rx="10" transform="matrix(0 -1 -1 0 20 20)" fill="#34C759"/>
            <path d="M9.99937 4.14056C9.81289 4.14056 9.63404 4.21464 9.50218 4.3465C9.37032 4.47836 9.29624 4.6572 9.29624 4.84368L9.29624 13.457L6.27808 10.4382C6.14599 10.3061 5.96684 10.2319 5.78003 10.2319C5.59323 10.2319 5.41407 10.3061 5.28198 10.4382C5.14989 10.5703 5.07569 10.7495 5.07569 10.9363C5.07569 11.1231 5.14989 11.3022 5.28198 11.4343L9.50073 15.6531C9.56606 15.7186 9.64368 15.7706 9.72914 15.8061C9.81461 15.8416 9.90624 15.8599 9.99878 15.8599C10.0913 15.8599 10.183 15.8416 10.2684 15.8061C10.3539 15.7706 10.4315 15.7186 10.4968 15.6531L14.7156 11.4343C14.781 11.3689 14.8329 11.2913 14.8683 11.2058C14.9037 11.1203 14.9219 11.0288 14.9219 10.9363C14.9219 10.8438 14.9037 10.7522 14.8683 10.6667C14.8329 10.5813 14.781 10.5036 14.7156 10.4382C14.6502 10.3728 14.5725 10.3209 14.4871 10.2855C14.4016 10.2501 14.31 10.2319 14.2175 10.2319C14.125 10.2319 14.0334 10.2501 13.948 10.2855C13.8625 10.3209 13.7849 10.3728 13.7195 10.4382L10.7025 13.457L10.7025 4.84368C10.7025 4.6572 10.6284 4.47836 10.4966 4.3465C10.3647 4.21464 10.1858 4.14056 9.99937 4.14056Z" fill="white"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="right">
      <span class="drag-text">Monitor View</span>
      <span class="subtitle">Drag tables and charts</span>
    </div>
  </div>

  <div 
    class="monitor-grid" 
    bind:this={monitorGridRef}
    on:dragover={handleDragOver} 
    on:drop={handleDrop}
  >
    {#each monitorItems as item (item.id)}
      <div class="monitor-item">
        <div class="item-header">
          <h3>{item.title}</h3>
        </div>
        {#if item.type === 'table'}
          <div class="table-view">
            <table>
              <thead>
                <tr>
                  {#each item.content.headers as header}
                    <th>{header}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each item.content.rows as row}
                  <tr>
                    {#each row as cell}
                      <td>{cell}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else if item.type === 'chart'}
          <div class="chart-view">
            <div class="chart-container">
              <div class="chart-placeholder">
                <div class="chart-line">
                  {#each item.content.data.values as value, i}
                    <div class="chart-point" style="--value: {value}%">
                      <span class="point"></span>
                      <span class="label">{item.content.data.labels[i]}</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .monitor-container {
    width: 100%;
    background-color: white;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: height 0.3s ease;
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
    gap: 0.75rem;
    margin-left: 1rem;
  }

  .control-btn {
    width: 40px;
    height: 40px;
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
    background-color: rgba(0, 0, 0, 0.05);
  }

  .power-btn {
    color: #ff3e3e;
  }

  .power-btn:hover {
    background-color: rgba(255, 62, 62, 0.1);
  }

  .fullscreen-btn {
    color: #34C759;
  }

  .fullscreen-btn:hover {
    background-color: rgba(52, 199, 89, 0.1);
  }

  .up-btn {
    color: #0ead00;
  }

  .up-btn:hover {
    background-color: rgba(75, 167, 0, 0.1);
  }

  .down-btn {
    color: #0ead00;
  }

  .down-btn:hover {
    background-color: rgba(75, 167, 0, 0.1);
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
  }

  .monitor-grid {
    flex: 1;
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    overflow: auto;
    overflow-x: hidden;
    background-color: #f8f8f8;
  }

  .monitor-item {
    background: white;
    border-radius: 8px;
    border: 1px solid #eee;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .item-header {
    padding: 1rem;
    background-color: #f8f8f8;
    border-bottom: 1px solid #eee;
  }

  .item-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #333;
    font-weight: 500;
  }

  .table-view {
    padding: 1rem;
    overflow: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    background-color: #f8f8f8;
    font-weight: 500;
    color: #333;
  }

  td {
    color: #666;
  }

  .chart-view {
    padding: 1rem;
  }

  .chart-container {
    height: 200px;
    position: relative;
    padding: 1rem;
  }

  .chart-placeholder {
    width: 100%;
    height: 100%;
    position: relative;
    border-bottom: 1px solid #eee;
  }

  .chart-line {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  .chart-point {
    position: relative;
    height: var(--value);
    width: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .point {
    width: 8px;
    height: 8px;
    background-color: #4CAF50;
    border-radius: 50%;
    margin-bottom: 4px;
  }

  .label {
    font-size: 0.75rem;
    color: #999;
    transform: rotate(-45deg);
    transform-origin: top left;
    position: absolute;
    bottom: -20px;
    left: 50%;
  }

  .monitor-container:fullscreen {
    background-color: white;
    padding: 20px;
  }
</style> 