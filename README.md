# CryptoLab Frontend

## Overview
- CryptoLab Frontend is the user interface for the CryptoLab application, a cryptocurrency price forecasting tool. It provides an intuitive dashboard for Bitcoin price forecasting, market sentiment analysis,       data fetching, time series visualization, and user query submission. The frontend is built with HTML, CSS, and JavaScript, using libraries like Chart.js and noUISlider. As of June 05, 2025, the frontend is in    development and has not yet been deployed.

## Features

- **Price Forecasting:** Displays forecasted Bitcoin prices using data from the backend.
- **Market Sentiment Analysis:** Visualizes sentiment probabilities (bullish, bearish, neutral) with a pie chart.
- **Data Fetching:** Allows users to fetch historical and real-time cryptocurrency data.
- **Time Series Visualization:** Shows historical and forecasted price trends.
- **Contact Form:** Enables users to submit queries, which are emailed via the backend.
- **Responsive Design:** Built with Tailwind CSS for a modern, responsive UI.

## Tech Stack

- **HTML, CSS, JavaScript:** Core technologies for the frontend.
- **Libraries:**
  - **Chart.js:** For rendering charts (forecast and sentiment).
  - **noUISlider:** For the date range slider in forecasting.
  - **Tailwind CSS:** For styling.


## Deployment: 
- Planned to use Netlify

## Project structure
frontend/
├── auth/
│   ├── auth.html        # login and register html pages
│   ├── auth.css         # authentication css code
│   ├── auth.js          # authentication js code
├── home/
│   ├── html/
│   │   ├── About.html      # About page code
│   │   ├── contact.html    # contact page code
│   │   ├── dashboard.html  # dashboard page code
│   │   ├── Fetchdata.html     # used to fetch data from binance rest apis
│   │   ├── forecasting.html # used to forecast future prices and other analysis
│   │   ├── Timeseries.html  # used to show timeseries analysis
│   ├── css/
│   │   ├── about.css     
│   │   ├── Fetchdata.css 
│   │   ├── forecasting.css 
│   │   ├── styles.css 
│   │   ├── Timeseries.css 
│   ├── js/
│   ├── scripts.js        # General scripts (e.g., contact form submission, navigation)
│   ├── forecasting.js    # Forecasting-specific scripts (API calls, chart rendering)
│   ├── contact.js      # contact specific scripts
│   ├── fetchdata.js      # Data fetching scripts
│   ├── timeseries.js     # Time series visualization scripts
└── README.md             # Project documentation

## Prerequisites

- Git
  - A modern web browser
  - Backend running locally or deployed (for API integration)

- Setup Instructions (Local Development)
  - Clone the Repository:
  - git clone https://github.com/your-username/cryptolab-frontend.git
  - cd frontend

- Run a Local Server:
  - python -m http.server 8000

- Access the app at http://localhost:8000/html/forecasting.html.

## Backend Integration:

- Ensure the backend is running (e.g., at http://localhost:8000).
- Update API URLs in forecasting.js and scripts.js to point to the backend:// Example in forecasting.js
- const response = await fetch('http://localhost:8000/api/forecast', { ... });

## Future Plans

- **Deployment:** Deploy the frontend to Netlify for public access.
  - Connect the repository to Netlify via GitHub.
  - Configure build settings (no build command needed, publish directory: .).

- **HTTPS Support:** Leverage Netlify’s automatic HTTPS for secure communication.
- **Custom Domain:** Set up a custom domain (e.g., www.cryptolab.com) on Netlify.
- **Backend Integration:** Update API URLs to point to the deployed backend (e.g., on AWS EC2).
- **Testing:** Add automated tests for UI components and API interactions.

## Contributing

- Fork the repository.
- Create a feature branch (git checkout -b feature-name).
- Commit your changes (git commit -m "Add feature").
- Push to the branch (git push origin feature-name).
- Open a Pull Request.


## Contact
- For inquiries, email vasugadde0203@gmail.com.
