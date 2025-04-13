<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  export let width = '100%';
  export let height = '100%';

  let container;
  let charts = [];
  let data = {
    lineChart: {
      labels: [],
      values: []
    },
    barChart: {
      labels: ['Revenue', 'Expenses', 'Profit', 'Growth', 'Users'],
      values: []
    },
    pieChart: {
      labels: ['Product A', 'Product B', 'Product C', 'Product D'],
      values: []
    }
  };

  function generateRandomData() {
    // Generate random data for line chart
    const now = new Date();
    data.lineChart.labels = Array.from({length: 10}, (_, i) => {
      const d = new Date(now - i * 60000);
      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    }).reverse();
    data.lineChart.values = Array.from({length: 10}, () => Math.floor(Math.random() * 100));

    // Generate random data for bar chart
    data.barChart.values = Array.from({length: 5}, () => Math.floor(Math.random() * 100));

    // Generate random data for pie chart
    data.pieChart.values = Array.from({length: 4}, () => Math.floor(Math.random() * 100));
  }

  function createCharts() {
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    const barCtx = document.getElementById('barChart').getContext('2d');
    const pieCtx = document.getElementById('pieChart').getContext('2d');

    charts.push(new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: data.lineChart.labels,
        datasets: [{
          label: 'Real-time Metrics',
          data: data.lineChart.values,
          borderColor: '#34C759',
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(52, 199, 89, 0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500
        },
        plugins: {
          title: {
            display: true,
            text: 'Real-time Performance'
          }
        }
      }
    }));

    charts.push(new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: data.barChart.labels,
        datasets: [{
          label: 'Business Metrics',
          data: data.barChart.values,
          backgroundColor: [
            'rgba(52, 199, 89, 0.7)',
            'rgba(255, 149, 0, 0.7)',
            'rgba(0, 122, 255, 0.7)',
            'rgba(88, 86, 214, 0.7)',
            'rgba(255, 45, 85, 0.7)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Business Overview'
          }
        }
      }
    }));

    charts.push(new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: data.pieChart.labels,
        datasets: [{
          data: data.pieChart.values,
          backgroundColor: [
            'rgba(52, 199, 89, 0.7)',
            'rgba(0, 122, 255, 0.7)',
            'rgba(255, 149, 0, 0.7)',
            'rgba(88, 86, 214, 0.7)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Product Distribution'
          }
        }
      }
    }));
  }

  function updateCharts() {
    generateRandomData();
    charts.forEach((chart, index) => {
      if (index === 0) {
        chart.data.labels = data.lineChart.labels;
        chart.data.datasets[0].data = data.lineChart.values;
      } else if (index === 1) {
        chart.data.datasets[0].data = data.barChart.values;
      } else if (index === 2) {
        chart.data.datasets[0].data = data.pieChart.values;
      }
      chart.update('none');
    });
  }

  onMount(() => {
    generateRandomData();
    createCharts();
    const interval = setInterval(updateCharts, 3000);

    return () => {
      clearInterval(interval);
      charts.forEach(chart => chart.destroy());
    };
  });
</script>

<div class="dashboard-container" bind:this={container} style="width: {width}; height: {height};">
  <div class="charts-grid">
    <div class="chart-container">
      <canvas id="lineChart"></canvas>
    </div>
    <div class="chart-container">
      <canvas id="barChart"></canvas>
    </div>
    <div class="chart-container">
      <canvas id="pieChart"></canvas>
    </div>
  </div>
</div>

<style>
  .dashboard-container {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto auto;
    gap: 16px;
    height: 100%;
  }

  .chart-container {
    background: white;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    position: relative;
    min-height: 200px;
  }

  .chart-container:first-child {
    grid-column: 1 / -1;
  }

  @media (max-width: 768px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }

    .chart-container:first-child {
      grid-column: auto;
    }
  }
</style> 