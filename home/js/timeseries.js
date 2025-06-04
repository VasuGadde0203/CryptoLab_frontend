// Plotly chart configurations
const layout = {
    autosize: true,
    height: 300,
    margin: { t: 30, b: 50, l: 50, r: 50 },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#e2e8f0' },
    xaxis: {
        gridcolor: 'rgba(255,255,255,0.1)',
        tickfont: { color: '#e2e8f0' },
        zeroline: false // Disable x-axis zeroline
    },
    yaxis: {
        gridcolor: 'rgba(255,255,255,0.1)',
        tickfont: { color: '#e2e8f0' },
        zeroline: false // Disable y-axis zeroline
    },
    showlegend: true,
    legend: { font: { color: '#e2e8f0' } }
};

// Function to format date to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Set default form values and fetch data
async function initializePage() {
    console.log('Initializing page...');
    
    // Load crypto list first
    const cryptoListLoaded = await loadCryptoList();
    if (!cryptoListLoaded) return;

    // Set default form values
    const coinSelect = document.getElementById('coin');
    const intervalSelect = document.getElementById('interval');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    // Set default coin and interval
    const defaultCoin = 'BTCUSDT';
    const defaultInterval = '5m';

    // Verify if default coin exists in the list
    const coinOptions = Array.from(coinSelect.options).map(opt => opt.value);
    if (!coinOptions.includes(defaultCoin)) {
        console.warn(`Default coin ${defaultCoin} not found in crypto list`);
        alert(`Default coin ${defaultCoin} not available. Please select another coin.`);
        return;
    }

    coinSelect.value = defaultCoin;
    intervalSelect.value = defaultInterval;

    // Set default dates (today and today - 2 days)
    const today = new Date(); // Current date: June 04, 2025
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 2); // June 02, 2025

    startDateInput.value = formatDate(pastDate);
    endDateInput.value = formatDate(today);

    console.log('Default form values set:', {
        coin: coinSelect.value,
        interval: intervalSelect.value,
        startDate: startDateInput.value,
        endDate: endDateInput.value
    });

    // Automatically fetch data and render charts (excluding comparison chart)
    await fetchAndUpdateCharts();

    // Set default coin2 and fetch comparison chart
    const coin2Select = document.getElementById('coin2');
    const defaultCoin2 = 'ETHUSDT';
    if (coinOptions.includes(defaultCoin2)) {
        coin2Select.value = defaultCoin2;
        await fetchAndUpdateCompareChart();
    } else {
        console.warn(`Default coin2 ${defaultCoin2} not found in crypto list`);
        coin2Select.value = '';
    }
}

// Load crypto list
async function loadCryptoList() {
    console.log('Attempting to load crypto list...');
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('No access token found in localStorage');
        alert('Please log in to access the application.');
        return false;
    }
    try {
        console.log('Fetching crypto list from http://localhost:8000/timeseries/crypto_list');
        const response = await fetch('http://localhost:8000/timeseries/crypto_list', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const coins = await response.json();
        console.log('Crypto list fetched:', coins);
        const coinSelect = document.getElementById('coin');
        const coin2Select = document.getElementById('coin2');
        coinSelect.innerHTML = '<option value="">Select Coin</option>';
        coin2Select.innerHTML = '<option value="">Select Second Coin (for Compare)</option>';
        coins.forEach(coin => {
            const option = document.createElement('option');
            option.value = coin;
            option.textContent = coin;
            coinSelect.appendChild(option);
            coin2Select.appendChild(option.cloneNode(true));
        });
        return true;
    } catch (error) {
        console.error('Error loading crypto list:', error);
        alert('Failed to load crypto list. Check console for details.');
        return false;
    }
}

// Form submission and refresh handler (excluding comparison chart)
async function fetchAndUpdateCharts() {
    console.log('fetchAndUpdateCharts called');
    const coin = document.getElementById('coin').value;
    const interval = document.getElementById('interval').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    console.log('Form inputs:', { coin, interval, startDate, endDate });

    if (!coin || !interval || !startDate || !endDate) {
        console.warn('Missing required fields');
        alert('Please fill all required fields');
        return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('No access token found');
        alert('Please log in to access the application.');
        return;
    }

    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block';

    try {
        console.log('Fetching data from APIs (excluding compare)...');
        const apiPromises = [
            fetch(`http://localhost:8000/timeseries/crypto_indicators?coin=${coin}&interval=${interval}&start_date=${startDate}&end_date=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            }).then(res => {
                console.log('Indicators response status:', res.status);
                return res.ok ? res.json() : Promise.reject(`Indicators API error: ${res.status}`);
            }),
            fetch(`http://localhost:8000/timeseries/crypto_macd?coin=${coin}&interval=${interval}&start_date=${startDate}&end_date=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            }).then(res => {
                console.log('MACD response status:', res.status);
                return res.ok ? res.json() : Promise.reject(`MACD API error: ${res.status}`);
            }),
            fetch(`http://localhost:8000/timeseries/crypto_rsi?coin=${coin}&interval=${interval}&start_date=${startDate}&end_date=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            }).then(res => {
                console.log('RSI response status:', res.status);
                return res.ok ? res.json() : Promise.reject(`RSI API error: ${res.status}`);
            }),
            fetch(`http://localhost:8000/timeseries/crypto_stochastic?coin=${coin}&interval=${interval}&start_date=${startDate}&end_date=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            }).then(res => {
                console.log('Stochastic response status:', res.status);
                return res.ok ? res.json() : Promise.reject(`Stochastic API error: ${res.status}`);
            }),
            fetch(`http://localhost:8000/timeseries/crypto_vwap?coin=${coin}&interval=${interval}&start_date=${startDate}&end_date=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            }).then(res => {
                console.log('VWAP response status:', res.status);
                return res.ok ? res.json() : Promise.reject(`VWAP API error: ${res.status}`);
            }),
            fetch(`http://localhost:8000/timeseries/crypto_data?coin=${coin}&interval=${interval}&start_date=${startDate}&end_date=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            }).then(res => {
                console.log('Data response status:', res.status);
                return res.ok ? res.json() : Promise.reject(`Data API error: ${res.status}`);
            })
        ];

        const [indicators, macd, rsi, stochastic, vwap, data] = await Promise.all(apiPromises);

        console.log('API data received:', { indicators, macd, rsi, stochastic, vwap, data });
        console.log('Updating charts (excluding compare)...');
        updateIndicatorsChart(indicators);
        updateMACDChart(macd);
        updatePriceMovementChart(data);
        updateRSIChart(rsi);
        updateStochasticChart(stochastic);
        updateVWAPChart(vwap);
        updateDataChart(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        alert(`Failed to fetch data: ${error}. Check console for details.`);
    } finally {
        spinner.style.display = 'none';
    }
}

// Fetch and update comparison chart
async function fetchAndUpdateCompareChart() {
    console.log('fetchAndUpdateCompareChart called');
    const coin1 = document.getElementById('coin').value;
    const coin2 = document.getElementById('coin2').value;
    const interval = document.getElementById('interval').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    console.log('Compare inputs:', { coin1, coin2, interval, startDate, endDate });

    if (!coin1 || !coin2 || !interval || !startDate || !endDate) {
        console.warn('Missing required fields for comparison chart');
        Plotly.purge('compare-chart');
        return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('No access token found');
        alert('Please log in to access the application.');
        return;
    }

    try {
        console.log('Fetching comparison data...');
        const response = await fetch(`http://localhost:8000/timeseries/crypto_compare?coin1=${coin1}&coin2=${coin2}&interval=${interval}&start_date=${startDate}&end_date=${endDate}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        console.log('Compare response status:', response.status);
        if (!response.ok) {
            throw new Error(`Compare API error: ${response.status}`);
        }
        const compare = await response.json();
        console.log('Compare data received:', compare);
        updateCompareChart(compare);
    } catch (error) {
        console.error('Error fetching compare data:', error);
        Plotly.purge('compare-chart');
        alert(`Failed to fetch comparison data: ${error}. Check console for details.`);
    }
}

// Form submission
document.getElementById('input-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    await fetchAndUpdateCharts();
    await fetchAndUpdateCompareChart();
});

// Refresh button
document.getElementById('refresh-btn').addEventListener('click', async () => {
    console.log('Refresh button clicked');
    await fetchAndUpdateCharts();
    await fetchAndUpdateCompareChart();
});

// Coin2 selection change
document.getElementById('coin2').addEventListener('change', async () => {
    console.log('Coin2 selection changed');
    await fetchAndUpdateCompareChart();
});

// Export chart as PNG
function exportChart(chartId) {
    console.log(`Exporting chart: ${chartId}`);
    Plotly.downloadImage(document.getElementById(chartId), {
        format: 'png',
        filename: `${chartId}-chart`,
        height: 300,
        width: 600
    });
}

// Update chart functions with Plotly.js
function updateIndicatorsChart(data) {
    console.log('Updating indicators chart', data);
    if (!data || !data.timestamps || data.timestamps.length === 0) {
        console.warn('No data available for indicators chart');
        Plotly.purge('indicator-chart');
        return;
    }
    const traces = [
        {
            x: data.timestamps,
            y: data.close,
            name: 'Close',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#3b82f6' }
        },
        {
            x: data.timestamps,
            y: data.sma_20,
            name: 'SMA 20',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#22c55e' }
        },
        {
            x: data.timestamps,
            y: data.ema_20,
            name: 'EMA 20',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#f59e0b' }
        },
        {
            x: data.timestamps,
            y: data.bollinger_upper,
            name: 'Bollinger Upper',
            type: 'scatter',
            mode: 'lines',
            line: { color: 'rgba(239,68,68,0.5)' },
            fill: 'tonexty',
            fillcolor: 'rgba(239,68,68,0.1)'
        },
        {
            x: data.timestamps,
            y: data.bollinger_lower,
            name: 'Bollinger Lower',
            type: 'scatter',
            mode: 'lines',
            line: { color: 'rgba(239,68,68,0.5)' }
        }
    ];
    const chartLayout = {
        ...layout,
        yaxis: { title: 'Price ($)', zeroline: false } // Explicitly disable zeroline
    };
    Plotly.newPlot('indicator-chart', traces, chartLayout, { responsive: true });
}

function updateMACDChart(data) {
    console.log('Updating MACD chart', data);
    if (!data || !data.timestamps || data.timestamps.length === 0) {
        console.warn('No data available for MACD chart');
        Plotly.purge('macd-chart');
        return;
    }
    const traces = [
        {
            x: data.timestamps,
            y: data.macd,
            name: 'MACD',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#3b82f6' }
        },
        {
            x: data.timestamps,
            y: data.signal,
            name: 'Signal',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#f59e0b' }
        },
        {
            x: data.timestamps,
            y: data.histogram,
            name: 'Histogram',
            type: 'bar',
            marker: { color: 'rgba(34,197,94,0.5)' }
        }
    ];
    const chartLayout = {
        ...layout,
        yaxis: { title: 'Value', zeroline: false } // Explicitly disable zeroline
        // Removed the zeroline shape at y=0
    };
    Plotly.newPlot('macd-chart', traces, chartLayout, { responsive: true });
}

function updatePriceMovementChart(data) {
    console.log('Updating price movement chart', data);
    if (!data || !data.close || data.close.length < 2) {
        console.warn('Insufficient data for price movement chart');
        Plotly.purge('price-movement-chart');
        return;
    }
    let positiveDays = 0;
    let negativeDays = 0;
    let unchangedDays = 0;
    for (let i = 1; i < data.close.length; i++) {
        const change = data.close[i] - data.close[i - 1];
        if (change > 0) positiveDays++;
        else if (change < 0) negativeDays++;
        else unchangedDays++;
    }
    const totalDays = positiveDays + negativeDays + unchangedDays;
    const positivePercentage = (positiveDays / totalDays) * 100;
    const negativePercentage = (negativeDays / totalDays) * 100;
    const unchangedPercentage = (unchangedDays / totalDays) * 100;
    const traces = [{
        labels: ['Positive', 'Negative', 'Unchanged'],
        values: [positivePercentage, negativePercentage, unchangedPercentage],
        type: 'pie',
        marker: {
            colors: ['#22c55e', '#ef4444', '#6b7280'],
            line: { color: '#1e293b', width: 1 }
        }
    }];
    const chartLayout = { ...layout, showlegend: true };
    Plotly.newPlot('price-movement-chart', traces, chartLayout, { responsive: true });
}

function updateCompareChart(data) {
    console.log('Updating compare chart', data);
    const coin1 = document.getElementById('coin').value;
    const coin2 = document.getElementById('coin2').value;
    if (!data || !data.timestamps || data.timestamps.length === 0) {
        Plotly.purge('compare-chart');
        return;
    }
    const traces = [
        {
            x: data.timestamps,
            y: data.coin1_returns,
            name: coin1,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#3b82f6' },
            yaxis: 'y1'
        },
        {
            x: data.timestamps,
            y: data.coin2_returns,
            name: coin2,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#22c55e' },
            yaxis: 'y2'
        }
    ];
    const chartLayout = {
        ...layout,
        yaxis: { title: `${coin1} Returns (%)`, zeroline: false },
        yaxis2: {
            title: `${coin2} Returns (%)`,
            overlaying: 'y',
            side: 'right',
            tickfont: { color: '#e2e8f0' },
            zeroline: false
        },
        title: { text: `Correlation: ${data.correlation_coefficient}`, font: { color: '#e2e8f0' } }
    };
    Plotly.newPlot('compare-chart', traces, chartLayout, { responsive: true });
}

function updateRSIChart(data) {
    console.log('Updating RSI chart', data);
    if (!data || !data.timestamps || data.timestamps.length === 0) {
        Plotly.purge('rsi-chart');
        return;
    }
    const traces = [
        {
            x: data.timestamps,
            y: data.rsi,
            name: 'RSI',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#8b5cf6' }
        }
    ];
    const chartLayout = {
        ...layout,
        yaxis: { title: 'RSI (%)', range: [0, 100], zeroline: false },
        shapes: [
            {
                type: 'line',
                x0: data.timestamps[0],
                x1: data.timestamps[data.timestamps.length - 1],
                y0: 70,
                y1: 70,
                line: { color: 'red', width: 1 },
                name: 'Overbought'
            },
            {
                type: 'line',
                x0: data.timestamps[0],
                x1: data.timestamps[data.timestamps.length - 1],
                y0: 30,
                y1: 30,
                line: { color: 'green', width: 1 },
                name: 'Oversold'
            }
        ]
    };
    Plotly.newPlot('rsi-chart', traces, chartLayout, { responsive: true });
}

function updateStochasticChart(data) {
    console.log('Updating stochastic chart', data);
    if (!data || !data.timestamps || data.timestamps.length === 0) {
        Plotly.purge('stochastic-chart');
        return;
    }
    const traces = [
        {
            x: data.timestamps,
            y: data.k,
            name: '%K',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#06b6d4' }
        },
        {
            x: data.timestamps,
            y: data.d,
            name: '%D',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#ec4899' }
        }
    ];
    const chartLayout = {
        ...layout,
        yaxis: { title: 'Stochastic (%)', range: [0, 100], zeroline: false },
        shapes: [
            {
                type: 'line',
                x0: data.timestamps[0],
                x1: data.timestamps[data.timestamps.length - 1],
                y0: 80,
                y1: 80,
                line: { color: 'red', width: 1 },
                name: 'Overbought'
            },
            {
                type: 'line',
                x0: data.timestamps[0],
                x1: data.timestamps[data.timestamps.length - 1],
                y0: 20,
                y1: 20,
                line: { color: 'green', width: 1 },
                name: 'Oversold'
            }
        ]
    };
    Plotly.newPlot('stochastic-chart', traces, chartLayout, { responsive: true });
}

function updateVWAPChart(data) {
    console.log('Updating VWAP chart', data);
    if (!data || !data.timestamps || data.timestamps.length === 0) {
        Plotly.purge('vwap-chart');
        return;
    }
    const traces = [
        {
            x: data.timestamps,
            y: data.close,
            name: 'Close',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#3b82f6' }
        },
        {
            x: data.timestamps,
            y: data.vwap,
            name: 'VWAP',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#eab308' },
            fill: 'tonexty',
            fillcolor: 'rgba(234,179,8,0.2)'
        }
    ];
    const chartLayout = {
        ...layout,
        yaxis: { title: 'Price ($)', zeroline: false }
    };
    Plotly.newPlot('vwap-chart', traces, chartLayout, { responsive: true });
}

function updateDataChart(data) {
    console.log('Updating data chart', data);
    if (!data || !data.timestamps || data.timestamps.length === 0) {
        Plotly.purge('data-chart');
        return;
    }
    const traces = [
        {
            x: data.timestamps,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            name: 'OHLC',
            type: 'candlestick',
            increasing: { line: { color: '#22c55e' } },
            decreasing: { line: { color: '#ef4444' } }
        },
        {
            x: data.timestamps,
            y: data.volume,
            name: 'Volume',
            type: 'bar',
            yaxis: 'y2',
            marker: { color: 'rgba(59,130,246,0.3)' }
        }
    ];
    const chartLayout = {
        ...layout,
        yaxis: { title: 'Price ($)', zeroline: false },
        yaxis2: {
            title: 'Volume',
            overlaying: 'y',
            side: 'right',
            tickfont: { color: '#e2e8f0' },
            zeroline: false
        }
    };
    Plotly.newPlot('data-chart', traces, chartLayout, { responsive: true });
}

// Chatbot Functionality
const chatbotIcon = document.getElementById('chatbot-icon');
const chatbotContainer = document.getElementById('chatbot-container');
const chatbotClose = document.getElementById('chatbot-close');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotInput = document.getElementById('chatbot-input');
const chatbotSend = document.getElementById('chatbot-send');

// Check if chatbot icon exists before adding event listener
if (!chatbotIcon) {
    console.error('Chatbot icon element not found in the DOM');
} else {
    // Toggle chatbot visibility
    chatbotIcon.addEventListener('click', () => {
        console.log('Chatbot icon clicked');
        const isVisible = chatbotContainer.style.display === 'flex';
        chatbotContainer.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) {
            chatbotInput.focus();
            scrollToBottom();
        }
    });
}

// Close chatbot
chatbotClose.addEventListener('click', () => {
    console.log('Chatbot close button clicked');
    chatbotContainer.style.display = 'none';
});

// Send message on button click
chatbotSend.addEventListener('click', sendMessage);

// Send message on Enter key
chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

// Function to format the chatbot response into HTML
function formatResponse(text) {
    // Escape HTML to prevent XSS
    function escapeHTML(str) {
        return str.replace(/&/g, '&')
                    .replace(/</g, '<')
                    .replace(/>/g, '>')
                    .replace(/"/g, '"')
                    .replace(/'/g, '');
    }

    // Replace **text** with <strong>text</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Split the text into paragraphs (separated by double newlines)
    const paragraphs = text.split(/\n\n/).filter(p => p.trim() !== '');

    let html = '';
    let inOrderedList = false;
    let inUnorderedList = false;
    let currentListItems = [];

    paragraphs.forEach(paragraph => {
        const lines = paragraph.split('\n').filter(line => line.trim() !== '');

        let paragraphHTML = '';
        lines.forEach((line, index) => {
            const numberedMatch = line.match(/^\d+\.\s*(.+)/);
            const bulletMatch = line.match(/^\-\s*(.+)/);
            const continuationMatch = line.match(/^\s{2,}(.+)/);

            if (numberedMatch) {
                if (inUnorderedList) {
                    paragraphHTML += `<ul>${currentListItems.join('')}</ul>`;
                    currentListItems = [];
                    inUnorderedList = false;
                }
                if (!inOrderedList) {
                    inOrderedList = true;
                }
                currentListItems.push(`<li>${escapeHTML(numberedMatch[1])}</li>`);
            } else if (bulletMatch) {
                if (inOrderedList) {
                    paragraphHTML += `<ol>${currentListItems.join('')}</ol>`;
                    currentListItems = [];
                    inOrderedList = false;
                }
                if (!inUnorderedList) {
                    inUnorderedList = true;
                }
                currentListItems.push(`<li>${escapeHTML(bulletMatch[1])}</li>`);
            } else if (continuationMatch && (inOrderedList || inUnorderedList)) {
                const lastItemIndex = currentListItems.length - 1;
                if (lastItemIndex >= 0) {
                    currentListItems[lastItemIndex] = currentListItems[lastItemIndex].replace(
                        '</li>',
                        ` ${escapeHTML(continuationMatch[1])}</li>`
                    );
                }
            } else {
                if (inOrderedList) {
                    paragraphHTML += `<ol>${currentListItems.join('')}</ol>`;
                    currentListItems = [];
                    inOrderedList = false;
                } else if (inUnorderedList) {
                    paragraphHTML += `<ul>${currentListItems.join('')}</ul>`;
                    currentListItems = [];
                    inUnorderedList = false;
                }
                paragraphHTML += `<p>${escapeHTML(line)}</p>`;
            }

            if (index === lines.length - 1) {
                if (inOrderedList) {
                    paragraphHTML += `<ol>${currentListItems.join('')}</ol>`;
                    inOrderedList = false;
                    currentListItems = [];
                } else if (inUnorderedList) {
                    paragraphHTML += `<ul>${currentListItems.join('')}</ul>`;
                    inUnorderedList = false;
                    currentListItems = [];
                }
            }
        });

        html += paragraphHTML;
    });

    return html || '<p>No content available.</p>';
}

// Function to send message and get response
async function sendMessage() {
    const query = chatbotInput.value.trim();
    if (!query) {
        console.warn('Empty query entered');
        return;
    }

    console.log('Sending message:', query);

    // Add user's message to chat
    const userMessage = document.createElement('div');
    userMessage.className = 'chatbot-message user';
    userMessage.textContent = query;
    chatbotMessages.appendChild(userMessage);

    // Clear input
    chatbotInput.value = '';

    // Scroll to bottom
    scrollToBottom();

    // Add loading indicator
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'chatbot-message bot loading';
    chatbotMessages.appendChild(loadingMessage);
    scrollToBottom();

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No access token found');
        }

        console.log('Fetching response from chatbot API...');
        const response = await fetch('http://localhost:8000/chat/query', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        console.log('Chatbot API response status:', response.status);
        if (!response.ok) {
            throw new Error(`Chatbot API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Chatbot response:', data);

        // Remove loading indicator
        loadingMessage.remove();

        // Format and add bot's response to chat
        const botMessage = document.createElement('div');
        botMessage.className = 'chatbot-message bot';
        botMessage.innerHTML = formatResponse(data.answer || 'Sorry, I couldn’t find an answer to that.');
        chatbotMessages.appendChild(botMessage);
    } catch (error) {
        console.error('Error fetching chatbot response:', error);
        loadingMessage.remove();
        const errorMessage = document.createElement('div');
        errorMessage.className = 'chatbot-message bot';
        errorMessage.textContent = 'Error: Unable to get a response. Please try again.';
        chatbotMessages.appendChild(errorMessage);
    }

    scrollToBottom();
}

// Function to scroll to the bottom of the chat
function scrollToBottom() {
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Initialize page on load
console.log('Page loaded, initializing...');
initializePage();