document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('calculatorForm');
  const resultDiv = document.getElementById('result');
  const visualizationDiv = document.getElementById('visualization');
  const totalHoursInputDiv = document.getElementById('totalHoursInput');
  const weeklyHoursInputDiv = document.getElementById('weeklyHoursInput');
  const timeMethodRadios = document.querySelectorAll('input[name="timeMethod"]');

  // Toggle time input methods based on radio button selection
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

    // Grab user inputs
    const unit = document.getElementById('unitSelect').value;
    const girthGain = parseFloat(document.getElementById('girthGain').value);
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
    if (isNaN(girthGain) || girthGain <= 0 || isNaN(totalHours) || totalHours <= 0) {
      resultDiv.textContent = 'Please enter valid, positive numbers.';
      visualizationDiv.textContent = '';
      return;
    }

    // 1) Calculate hoursToGain (HtG₀.₁)
    let hoursToGain;
    if (unit === 'inches') {
      hoursToGain = totalHours * (0.1 / girthGain);
    } else {
      const targetMm = 2.54; // 0.1 inches in mm
      hoursToGain = totalHours * (targetMm / girthGain);
    }

    // Display the raw hoursToGain
    resultDiv.textContent = `Approximately ${hoursToGain.toFixed(2)} hours required per 0.1 ${unit === 'inches' ? 'inch' : 'mm'} of girth gain.`;

    // 2) Compare to distribution stats (mean=26, sd=10)
    const mean = 26;
    const sd = 10;

    // 2a) Determine faster/slower than average in percentage terms
    // difference% = ((HtG₀.₁ - mean) / mean) * 100
    const difference = (hoursToGain - mean) / mean * 100;
    const absDiff = Math.abs(difference).toFixed(1); // Format nicely

    // 2b) Determine normal-distribution percentile
    // z = (mean - HtG₀.₁) / sd
    // normalCDF(z) -> proportion that user is "faster" than
    const z = (mean - hoursToGain) / sd;
    const fasterThan = normalCDF(z) * 100; 
    const slowerThan = 100 - fasterThan;

    let message;
    if (Math.abs(difference) < 0.0001) {
      // Essentially on the mean
      message = `This is exactly the average (${mean} hours).`;
    } else if (difference < 0) {
      // hoursToGain < mean => user is faster than average
      message = `${absDiff}% faster than average and faster than ${fasterThan.toFixed(1)}% of gainers.`;
    } else {
      // hoursToGain > mean => user is slower than average
      message = `${absDiff}% slower than average and slower than ${slowerThan.toFixed(1)}% of gainers.`;
    }

    // Display the comparison message
    visualizationDiv.textContent = message;
  });

  // Approximation of the error function (erf)
  function erf(x) {
    let sign = (x >= 0) ? 1 : -1;
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

  // Standard Normal CDF using erf
  function normalCDF(z) {
    return (1 - erf(-z / Math.sqrt(2))) / 2;
  }
});
