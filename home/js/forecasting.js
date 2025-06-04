// Initialize date inputs
const today = new Date('2025-06-04');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
startDateInput.value = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Tomorrow
endDateInput.value = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days from today
startDateInput.min = startDateInput.value; // Restrict past dates

// Initialize noUISlider
const slider = document.getElementById('date-slider');
noUiSlider.create(slider, {
    start: [1, 7],
    connect: true,
    range: {
        'min': 1,
        'max': 30
    },
    step: 1,
    format: {
        to: value => Math.round(value),
        from: value => Number(value)
    }
});
slider.noUiSlider.on('update', () => {
    const [startDays, endDays] = slider.noUiSlider.get();
    const newStartDate = new Date(today.getTime() + startDays * 24 * 60 * 60 * 1000);
    const newEndDate = new Date(today.getTime() + endDays * 24 * 60 * 60 * 1000);
    startDateInput.value = newStartDate.toISOString().split('T')[0];
    endDateInput.value = newEndDate.toISOString().split('T')[0];
});
startDateInput.addEventListener('change', () => updateSlider());
endDateInput.addEventListener('change', () => updateSlider());

function updateSlider() {
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    const startDays = Math.round((startDate - today) / (24 * 60 * 60 * 1000));
    const endDays = Math.round((endDate - today) / (24 * 60 * 60 * 1000));
    if (startDays >= 1 && endDays >= startDays) {
        slider.noUiSlider.set([startDays, endDays]);
    }
}

// Retrieve JWT token
const TOKEN = localStorage.getItem('access_token') || '';

// Fetch and display forecast data
async function fetchForecastData() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const errorMessage = document.getElementById('error-message');
    const fetchButton = document.getElementById('fetch-forecast');
    const loadingSpinner = document.getElementById('loading-spinner');

    if (!errorMessage || !fetchButton || !loadingSpinner) {
        console.error('Error: Required elements not found (error-message, fetch-forecast, or loading-spinner)');
        return;
    }

    // Show spinner, disable button, and hide error message
    loadingSpinner.style.display = 'block';
    fetchButton.disabled = true;
    fetchButton.classList.add('opacity-50', 'cursor-not-allowed');
    errorMessage.classList.add('hidden');

    if (!startDate || !endDate) {
        errorMessage.textContent = 'Please select both start and end dates.';
        errorMessage.classList.remove('hidden');
        loadingSpinner.style.display = 'none';
        fetchButton.disabled = false;
        fetchButton.classList.remove('opacity-50', 'cursor-not-allowed');
        return;
    }
    if (!TOKEN) {
        errorMessage.textContent = 'Please log in to access forecasts.';
        errorMessage.classList.remove('hidden');
        loadingSpinner.style.display = 'none';
        fetchButton.disabled = false;
        fetchButton.classList.remove('opacity-50', 'cursor-not-allowed');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/api/forecast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify({
                start_date: startDate,
                end_date: endDate
            })
        });
        const data = await response.json();

        if (data.error) {
            errorMessage.textContent = 'Error fetching forecast data: ' + data.error;
            errorMessage.classList.remove('hidden');
            return;
        }

        // Update historical statistics
        const histMean = document.getElementById('hist-mean');
        const histStd = document.getElementById('hist-std');
        const histMin = document.getElementById('hist-min');
        const histMax = document.getElementById('hist-max');
        if (histMean && histStd && histMin && histMax) {
            histMean.textContent = `$${data.historical.stats.mean.toFixed(2)}`;
            histStd.textContent = `$${data.historical.stats.std.toFixed(2)}`;
            histMin.textContent = `$${data.historical.stats.min.toFixed(2)}`;
            histMax.textContent = `$${data.historical.stats.max.toFixed(2)}`;
        } else {
            console.error('Error: Historical stat elements not found');
        }

        // Update forecast summary
        const forecastMin = document.getElementById('forecast-min');
        const forecastMax = document.getElementById('forecast-max');
        const forecastMean = document.getElementById('forecast-mean');
        const forecastPercent = document.getElementById('forecast-percent');
        if (forecastMin && forecastMax && forecastMean && forecastPercent) {
            forecastMin.textContent = `$${data.forecast.stats.min.toFixed(2)}`;
            forecastMax.textContent = `$${data.forecast.stats.max.toFixed(2)}`;
            forecastMean.textContent = `$${data.forecast.stats.mean.toFixed(2)}`;
            forecastPercent.textContent = `${data.forecast.stats.percent_change.toFixed(2)}%`;
        } else {
            console.error('Error: Forecast stat elements not found');
        }

        // Update sentiment pie chart
        const sentimentCanvas = document.getElementById('sentimentChart');
        const sentimentCtx = sentimentCanvas ? sentimentCanvas.getContext('2d') : null;
        if (sentimentCtx) {
            if (window.sentimentChart && typeof window.sentimentChart.destroy === 'function') {
                console.debug('Destroying existing sentiment chart');
                window.sentimentChart.destroy();
            }
            console.debug('Creating new sentiment chart');
            window.sentimentChart = new Chart(sentimentCtx, {
                type: 'pie',
                data: {
                    labels: ['Bullish', 'Bearish', 'Neutral'],
                    datasets: [{
                        data: [
                            data.forecast.sentiment_probabilities.bullish,
                            data.forecast.sentiment_probabilities.bearish,
                            data.forecast.sentiment_probabilities.neutral
                        ],
                        backgroundColor: ['#10b981', '#ef4444', '#6b7280'],
                        borderColor: '#1f2937',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#e2e8f0',
                                boxWidth: 15,
                                padding: 10,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += context.parsed.toFixed(2) + '%';
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            console.error('Error: sentimentChart canvas not found');
        }

        // Update forecast chart
        const forecastCanvas = document.getElementById('forecastChart');
        const forecastCtx = forecastCanvas ? forecastCanvas.getContext('2d') : null;
        if (forecastCtx) {
            if (window.forecastChart && typeof window.forecastChart.destroy === 'function') {
                console.debug('Destroying existing forecast chart');
                window.forecastChart.destroy();
            }
            console.debug('Creating new forecast chart');
            window.forecastChart = new Chart(forecastCtx, {
                type: 'line',
                data: {
                    labels: [...data.historical.dates, ...data.forecast.dates],
                    datasets: [
                        {
                            label: 'Historical Prices',
                            data: data.historical.prices,
                            borderColor: '#3b82f6',
                            fill: false,
                            pointRadius: 0
                        },
                        {
                            label: 'Forecasted Prices',
                            data: [...Array(data.historical.prices.length).fill(null), ...data.forecast.prices],
                            borderColor: '#ef4444',
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: { display: true, text: 'Date', color: '#e2e8f0' },
                            ticks: { color: '#e2e8f0' }
                        },
                        y: {
                            title: { display: true, text: 'Price (USD)', color: '#e2e8f0' },
                            ticks: { color: '#e2e8f0', stepSize: 5000 }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: '#e2e8f0' } }
                    }
                }
            });
            console.debug('Forecast chart created successfully');
        } else {
            console.error('Error: forecastChart canvas not found');
            errorMessage.textContent = 'Error: Unable to render chart';
            errorMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        errorMessage.textContent = 'Error fetching forecast data: ' + error.message;
        errorMessage.classList.remove('hidden');
    } finally {
        // Hide spinner and re-enable button
        loadingSpinner.style.display = 'none';
        fetchButton.disabled = false;
        fetchButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Event listeners
const fetchButton = document.getElementById('fetch-forecast');
if (fetchButton) {
    fetchButton.addEventListener('click', fetchForecastData);
} else {
    console.error('Error: fetch-forecast button not found');
}
document.addEventListener('DOMContentLoaded', () => {
    console.debug('DOM loaded, initializing slider and fetching data');
    updateSlider();
    fetchForecastData();
});