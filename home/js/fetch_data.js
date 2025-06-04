// Retrieve JWT token
        const TOKEN = localStorage.getItem('access_token') || '';

        // Update endpoint dropdown based on category and history selection
        function updateEndpoint() {
            console.log("Dropdown change detected");
            var category = document.getElementById("type-dropdown").value;
            var endpointDropdown = document.getElementById("endpoint-dropdown");
            var history = document.getElementById("history-dropdown").value;
            var startDate = document.getElementById("start-date");
            var endDate = document.getElementById("end-date");

            // Clear existing options
            endpointDropdown.innerHTML = "";

            var endpoints = {
                spot: {
                    history: [
                        {value: 'spot_trade_list', text: 'Trade List'}, 
                        {value: 'spot_universal_transfer_history', text: 'Universal Transfer History'}
                    ], 
                    nonHistory: [
                        {value: 'spot_account_information', text: 'Account Information'}
                    ]
                }, 
                futures: {
                    history: [
                        {value: 'futures_trade_list', text: 'Trade List'}
                    ],
                    nonHistory: [
                        {value: 'futures_account_information_user_data', text: 'Account Information User Data'}, 
                        {value: 'futures_position_information', text: 'Position Information'},
                        {value: 'futures_account_balances', text: 'Futures Account Balances'}
                    ]
                }
            };

            // Show or hide the date fields based on the selected history option
            if (history === "history") {
                startDate.style.display = "block";
                endDate.style.display = "block";
            } else {
                startDate.style.display = "none";
                endDate.style.display = "none";
            }

            if (category && history) {
                var selectedEndpoints = endpoints[category][history];
                selectedEndpoints.forEach(function(endpoint) {
                    var option = document.createElement("option");
                    option.value = endpoint.value;
                    option.text = endpoint.text;
                    endpointDropdown.appendChild(option);
                });
            } else {
                var defaultOption = document.createElement("option");
                defaultOption.value = "";
                defaultOption.text = "Select a category and history first";
                endpointDropdown.appendChild(defaultOption);
            }
        }

        // Convert date to Unix timestamp in milliseconds
        function dateToTimestamp(dateStr) {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            return date.getTime();
        }

        // Handle form submission
        document.getElementById('fetch-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const errorMessage = document.getElementById('error-message');
            const dataSection = document.getElementById('data-section');
            const dataTitle = document.getElementById('data-title');
            const dataTable = document.getElementById('data-table');
            const noDataMessage = document.getElementById('no-data-message');
            const downloadDataBtn = document.getElementById('download-data-btn');
            const loadingSpinner = document.getElementById('loading-spinner');

            // Show loading spinner
            loadingSpinner.classList.remove('hidden');
            errorMessage.classList.add('hidden');
            dataSection.classList.add('hidden');
            noDataMessage.classList.add('hidden');

            if (!TOKEN) {
                loadingSpinner.classList.add('hidden');
                errorMessage.textContent = 'Please log in to fetch data.';
                errorMessage.classList.remove('hidden');
                return;
            }

            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            console.log('Form data:', data);

            // Convert dates to timestamps if provided
            if (data.start_date) data.start_time = dateToTimestamp(data.start_date);
            if (data.end_date) data.end_time = dateToTimestamp(data.end_date);
            delete data.start_date;
            delete data.end_date;

            // Map endpoints to API routes
            const endpointMap = {
                'spot_account_information': '/spot/account-information',
                'spot_trade_list': '/spot/trade-list',
                'spot_universal_transfer_history': '/spot/universal-transfer-history',
                'futures_account_information_user_data': '/futures/account-information',
                'futures_trade_list': '/futures/trade-list',
                'futures_position_information': '/futures/position-information',
                'futures_account_balances': '/futures/account-balances'
            };

            const apiEndpoint = endpointMap[data.endpoint];
            if (!apiEndpoint) {
                loadingSpinner.classList.add('hidden');
                errorMessage.textContent = 'Invalid endpoint selected.';
                errorMessage.classList.remove('hidden');
                return;
            }

            try {
                const response = await fetch(`http://localhost:8000${apiEndpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${TOKEN}`
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch data');
                }

                const result = await response.json();
                console.log('Fetch response:', result);

                // Display data in table
                const dataKeyMap = {
                    'spot_account_information': 'balances',
                    'spot_trade_list': 'trades',
                    'spot_universal_transfer_history': 'transfers',
                    'futures_account_information_user_data': 'assets',
                    'futures_trade_list': 'trades',
                    'futures_position_information': 'positions',
                    'futures_account_balances': 'balances'
                };

                const dataKey = dataKeyMap[data.endpoint];
                const items = result.data[dataKey] || [];

                if (items.length === 0) {
                    noDataMessage.textContent = "You don't have any data for this endpoint.";
                    noDataMessage.classList.remove('hidden');
                    loadingSpinner.classList.add('hidden');
                    return;
                }

                // Set table title
                const endpointText = document.querySelector(`#endpoint-dropdown option[value="${data.endpoint}"]`).text;
                dataTitle.textContent = `${endpointText} Data`;

                // Build table headers
                const thead = dataTable.querySelector('thead tr');
                thead.innerHTML = '';
                const tbody = dataTable.querySelector('tbody');
                tbody.innerHTML = '';

                const headers = Object.keys(items[0]);
                headers.forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header.charAt(0).toUpperCase() + header.slice(1).replace(/([A-Z])/g, ' $1');
                    th.className = 'py-2 px-4 border-b border-gray-700';
                    thead.appendChild(th);
                });

                // Build table rows
                items.forEach(item => {
                    const tr = document.createElement('tr');
                    headers.forEach(header => {
                        const td = document.createElement('td');
                        td.textContent = item[header] != null ? item[header] : '-';
                        td.className = 'py-2 px-4 border-b border-gray-700';
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });

                // Show table section
                dataSection.classList.remove('hidden');
                loadingSpinner.classList.add('hidden');

                // Add download button functionality
                downloadDataBtn.onclick = () => {
                    const csv = convertToCSV(items, headers);
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${data.account_name}_${data.endpoint}_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                };

            } catch (error) {
                console.error('Fetch error:', error);
                loadingSpinner.classList.add('hidden');
                errorMessage.textContent = 'Error fetching data: ' + error.message;
                errorMessage.classList.remove('hidden');
            }
        });

        // Convert table data to CSV
        function convertToCSV(data, headers) {
            const rows = data.map(item => 
                headers.map(header => `"${(item[header] != null ? item[header] : '').toString().replace(/"/g, '""')}"`).join(',')
            );
            return [headers.join(','), ...rows].join('\n');
        }