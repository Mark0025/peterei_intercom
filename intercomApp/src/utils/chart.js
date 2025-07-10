/**
 * Chart.js Utility Functions
 *
 * Usage:
 *   Import and use these helpers to create and update Chart.js charts in your app.
 *   Example: createBarChart(ctx, labels, data, options)
 */

// Chart.js must be loaded in the environment (via CDN or import)

/**
 * Create a bar chart
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string[]} labels - X-axis labels
 * @param {number[]} data - Data values
 * @param {object} [options] - Chart.js options
 * @returns {Chart} - The Chart.js instance
 */
function createBarChart(ctx, labels, data, options = {}) {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: options.label || 'Data',
        data,
        backgroundColor: options.backgroundColor || 'rgba(45, 114, 210, 0.7)',
        borderColor: options.borderColor || 'rgba(45, 114, 210, 1)',
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: !!options.title, text: options.title },
      },
      ...options.chartOptions,
    },
  });
}

module.exports = {
  createBarChart,
}; 