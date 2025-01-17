document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('calculatorForm');
  const resultDiv = document.getElementById('result');
  const visualizationDiv = document.getElementById('visualization');
  const totalHoursInputDiv = document.getElementById('totalHoursInput');
  const weeklyHoursInputDiv = document.getElementById('weeklyHoursInput');
  const timeMethodRadios = document.querySelectorAll('input[name="timeMethod"]');

  let myChart; // Chart.js instance

  // Toggle time input methods
  timeMethodRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'total' && radio.checked) {
        totalHoursInputDiv.classList.remove('hidden');
        weeklyHoursInputDiv.classList.add('hidden');
        document.getElementById('totalHours').required = true;
        document.getElementById('hoursPerWeek').required = false;
        document.getElementById('weeksDuration').required = false;
      } else if (radio.value === 'weekly' && radio.checked) {
        totalHoursInputDiv.classList.add('hidden');
        weeklyHoursInputDiv.classList.remove('hidden');
        document.getElementById('totalHours').required = false;
        document.getElementById('hoursPerWeek').required = true;
        document.getElementById('weeksDuration').required = true;
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const unit = document.getElementById('unitSelect').value;
    const girthGainRaw = parseFloat(document.getElementById('girthGain').value);
    const timeMethod = document.querySelector('input[name="timeMethod"]:checked').value;
    
    let totalHours;
    if (timeMethod === 'total') {
      totalHours = parseFloat(document.getElementById('totalHours').value);
    } else {
      const hoursPerWeek = parseFloat(document.getElementById('hoursPerWeek').value);
      const weeksDuration = parseFloat(document.getElementById('weeksDuration').value);
      totalHours = hoursPerWeek * weeksDuration;
    }

    // Basic validation
    if (
      isNaN(girthGainRaw) || girthGainRaw <= 0 ||
      isNaN(totalHours) || totalHours <= 0
    ) {
      resultDiv.textContent = 'Please enter valid, positive numbers.';
      visualizationDiv.textContent = '';
      clearChart();
      return;
    }

    // 1) Convert user-entered gain to inches if necessary
    // 1 inch = 25.4 mm
    let girthGainInches;
    if (unit === 'inches') {
      girthGainInches = girthGainRaw;
    } else {
      // user selected mm
      girthGainInches = girthGainRaw / 25.4; 
    }

    // 2) Calculate hoursToGain for 0.1 inch
    // hoursToGain = totalHours * (0.1 / girthGainInches)
    const hoursToGain = totalHours * (0.1 / girthGainInches);

    resultDiv.textContent =
      `Approximately ${hoursToGain.toFixed(2)} hours required per 0.1 inch of girth gain.`;

    // 3) Compare to distribution (mean=26, sd=10), show faster/slower info
    const mean = 26;
    const sd = 10;
    const difference = (hoursToGain - mean) / mean * 100;
    const absDiff = Math.abs(difference).toFixed(1);

    const z = (mean - hoursToGain) / sd;
    const fasterThan = normalCDF(z) * 100; 
    const slowerThan = 100 - fasterThan;

    let message;
    if (Math.abs(difference) < 0.001) {
      message = `This is exactly the average (${mean} hours).`;
    } else if (difference < 0) {
      message = `${absDiff}% faster than average and faster than ${fasterThan.toFixed(1)}% of gainers.`;
    } else {
      message = `${absDiff}% slower than average and slower than ${slowerThan.toFixed(1)}% of gainers.`;
    }
    visualizationDiv.textContent = message;

    // 4) Render the bell curve with the user’s vertical line
    createBellCurveChart(hoursToGain);
  });

  // Create or update the Chart.js chart
  function createBellCurveChart(hoursToGain) {
    clearChart();

    const mean = 26;
    const sd = 10;
    const xValues = [];
    const yValues = [];
    const step = 0.5;
    for (let x = 0; x <= 60; x += step) {
      xValues.push(x);
      yValues.push(normalPDF(x, mean, sd));
    }

    // vertical line from (hoursToGain,0) to (hoursToGain, pdf)
    const userY = normalPDF(hoursToGain, mean, sd);
    const userLineData = [
      { x: hoursToGain, y: 0 },
      { x: hoursToGain, y: userY }
    ];

    const ctx = document.getElementById('myChart').getContext('2d');
    myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: xValues,
        datasets: [
          {
            label: 'Normal Distribution (Mean=26, SD=10)',
            data: yValues,
            borderColor: 'blue',
            fill: false,
            tension: 0.1,
            pointRadius: 0
          },
          {
            label: 'Your HtG₀.₁',
            data: userLineData,
            borderColor: 'red',
            borderWidth: 2,
            showLine: true,
            fill: false,
            tension: 0,
            pointRadius: 0
          }
        ]
      },
      options: {
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Hours to Gain 0.1"'
            },
            min: 0,
            max: 60
          },
          y: {
            title: {
              display: true,
              text: 'Probability Density'
            },
            min: 0
          }
        }
      }
    });
  }

  function clearChart() {
    if (myChart) {
      myChart.destroy();
      myChart = null;
    }
  }

  // PDF for a normal distribution
  function normalPDF(x, mean, sd) {
    const exponent = -0.5 * ((x - mean) / sd) ** 2;
    return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
  }

  // Error function for normalCDF
  function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p  = 0.3275911;

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1)
              * t * Math.exp(-x * x);

    return sign * y;
  }

  // CDF for a standard normal
  function normalCDF(z) {
    return (1 - erf(-z / Math.sqrt(2))) / 2;
  }
});
