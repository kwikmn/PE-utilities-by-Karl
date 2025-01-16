document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('calculatorForm');
  const resultDiv = document.getElementById('result');
  const totalHoursInputDiv = document.getElementById('totalHoursInput');
  const weeklyHoursInputDiv = document.getElementById('weeklyHoursInput');
  const timeMethodRadios = document.querySelectorAll('input[name="timeMethod"]');

  // Toggle time input methods based on radio button selection
  timeMethodRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'total' && radio.checked) {
        totalHoursInputDiv.classList.remove('hidden');
        weeklyHoursInputDiv.classList.add('hidden');
        // Required attribute adjustments
        document.getElementById('totalHours').required = true;
        document.getElementById('hoursPerWeek').required = false;
        document.getElementById('weeksDuration').required = false;
      } else if (radio.value === 'weekly' && radio.checked) {
        totalHoursInputDiv.classList.add('hidden');
        weeklyHoursInputDiv.classList.remove('hidden');
        // Required attribute adjustments
        document.getElementById('totalHours').required = false;
        document.getElementById('hoursPerWeek').required = true;
        document.getElementById('weeksDuration').required = true;
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get unit selection and girth gain
    const unit = document.getElementById('unitSelect').value;
    const girthGain = parseFloat(document.getElementById('girthGain').value);
    
    let totalHours;
    const timeMethod = document.querySelector('input[name="timeMethod"]:checked').value;
    
    if (timeMethod === 'total') {
      totalHours = parseFloat(document.getElementById('totalHours').value);
    } else {
      const hoursPerWeek = parseFloat(document.getElementById('hoursPerWeek').value);
      const weeksDuration = parseFloat(document.getElementById('weeksDuration').value);
      totalHours = hoursPerWeek * weeksDuration;
    }

    if (isNaN(girthGain) || girthGain <= 0 || isNaN(totalHours) || totalHours <= 0) {
      resultDiv.textContent = 'Please enter valid, positive numbers.';
      return;
    }

    let hoursToGain;
    if (unit === 'inches') {
      hoursToGain = totalHours * (0.1 / girthGain);
    } else {
      // Convert 0.1 inches to mm
      const targetMm = 2.54;
      hoursToGain = totalHours * (targetMm / girthGain);
    }

    resultDiv.textContent = `Approximately ${hoursToGain.toFixed(2)} hours required per 0.1${unit === 'inches' ? ' inch' : ' mm'} of girth gain.`;
  });
});
