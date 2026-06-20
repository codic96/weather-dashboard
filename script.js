// --- Application Config State ---
const API_CONFIG = {
    KEY: 'a977d66d9b31ac8b7a763211a0521fb9',
    BASE_URL: 'https://api.openweathermap.org/data/2.5/'
};

// --- DOM Node Architecture Setup ---
const elements = {
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    themeToggle: document.getElementById('theme-toggle'),
    historyList: document.getElementById('history-list'),
    errorMessage: document.getElementById('error-message'),
    loadingSpinner: document.getElementById('loading-spinner'),
    welcomeMessage: document.getElementById('welcome-message'),
    dashboardView: document.getElementById('weather-dashboard-view'),
    currentWeather: document.getElementById('current-weather'),
    forecastContainer: document.getElementById('forecast-container')
};

// --- Core Application Execution Lifecycle ---
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    renderSearchHistory();
    setupEventListeners();
});

function setupEventListeners() {
    elements.searchForm.addEventListener('submit', handleSearchSubmit);
    elements.themeToggle.addEventListener('click', toggleTheme);
}

// --- Dynamic Business Logic Features ---

// 1. Weather Data Acquisition Flow
async function fetchWeatherData(city) {
    showLoader();
    clearErrors();
    
    try {
        // Fetch Current Conditions
        const currentRes = await fetch(`${API_CONFIG.BASE_URL}weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_CONFIG.KEY}`);
        if (!currentRes.ok) throw new Error(currentRes.status === 404 ? 'City not discovered. Check naming syntax.' : 'Server connection anomaly.');
        const currentData = await currentRes.json();

        // Fetch 5-Day Forecast
        const forecastRes = await fetch(`${API_CONFIG.BASE_URL}forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_CONFIG.KEY}`);
        if (!forecastRes.ok) throw new Error('Failed to synchronize forecast timelines.');
        const forecastData = await forecastRes.json();

        // Execution path on total success
        updateWeatherUI(currentData, forecastData);
        saveToHistory(currentData.name);
        
    } catch (error) {
        displayError(error.message);
    } finally {
        hideLoader();
    }
}

function handleSearchSubmit(e) {
    e.preventDefault();
    const targetCity = elements.searchInput.value.trim();
    if (targetCity) {
        fetchWeatherData(targetCity);
        elements.searchInput.value = '';
    }
}

// 2. Local View Engine Updates
function updateWeatherUI(current, forecast) {
    elements.welcomeMessage.classList.add('hidden');
    elements.dashboardView.classList.remove('hidden');

    // Build Current Conditions View Layout
    elements.currentWeather.innerHTML = `
        <div class="current-header">
            <div>
                <h2>${current.name}, ${current.sys.country}</h2>
                <p class="date">Current Conditions</p>
            </div>
            <img src="https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png" alt="${current.weather[0].description}">
        </div>
        <div class="current-main">
            <span class="temp">${Math.round(current.main.temp)}°C</span>
            <span class="desc">${current.weather[0].description}</span>
        </div>
        <div class="metrics-grid">
            <div class="metric-item">
                <i class="fa-solid fa-temperature-three-quarters"></i>
                <div class="metric-info"><span>Feels Like</span><strong>${Math.round(current.main.feels_like)}°C</strong></div>
            </div>
            <div class="metric-item">
                <i class="fa-solid fa-droplet"></i>
                <div class="metric-info"><span>Humidity</span><strong>${current.main.humidity}%</strong></div>
            </div>
            <div class="metric-item">
                <i class="fa-solid fa-wind"></i>
                <div class="metric-info"><span>Wind Speed</span><strong>${current.wind.speed} m/s</strong></div>
            </div>
            <div class="metric-item">
                <i class="fa-solid fa-gauge"></i>
                <div class="metric-info"><span>Pressure</span><strong>${current.main.pressure} hPa</strong></div>
            </div>
        </div>
    `;

    // Process & Structure 5-Day Forecast Timestamps (Selecting mid-day data blocks)
    elements.forecastContainer.innerHTML = '';
    const filteredForecasts = forecast.list.filter(item => item.dt_txt.includes("12:00:00"));

    filteredForecasts.forEach(day => {
        const dateObj = new Date(day.dt * 1000);
        const formatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        
        const cardHTML = `
            <div class="forecast-card">
                <p class="date">${dateObj.toLocaleDateString('en-US', formatOptions)}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
                <p class="temp">${Math.round(day.main.temp)}°C</p>
                <p class="desc">${day.weather[0].main}</p>
            </div>
        `;
        elements.forecastContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// 3. LocalStorage Search History Architecture
function saveToHistory(cityName) {
    let history = JSON.parse(localStorage.getItem('skycast_history')) || [];
    // Prevent duplicate entries
    history = history.filter(city => city.toLowerCase() !== cityName.toLowerCase());
    history.unshift(cityName);
    
    if (history.length > 5) history.pop(); // Hard clamp to maximum 5 items per PRD
    
    localStorage.setItem('skycast_history', JSON.stringify(history));
    renderSearchHistory();
}

function renderSearchHistory() {
    const history = JSON.parse(localStorage.getItem('skycast_history')) || [];
    elements.historyList.innerHTML = history.length === 0 
        ? '<p style="font-size:0.85rem; color:var(--text-secondary)">No items tracked yet.</p>' 
        : '';

    history.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        li.addEventListener('click', () => fetchWeatherData(city));
        elements.historyList.appendChild(li);
    });
}

// 4. Persistence Layout Themes
function initializeTheme() {
    const cachedTheme = localStorage.getItem('skycast_theme') || 'light';
    document.documentElement.setAttribute('data-theme', cachedTheme);
    updateThemeIcon(cachedTheme);
}

function toggleTheme() {
    const activeTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem('skycast_theme', activeTheme);
    updateThemeIcon(activeTheme);
}

function updateThemeIcon(theme) {
    const icon = elements.themeToggle.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fa-solid fa-sun';
    } else {
        icon.className = 'fa-solid fa-moon';
    }
}

// 5. Shared Interface Helpers
function showLoader() { elements.loadingSpinner.classList.remove('hidden'); }
function hideLoader() { elements.loadingSpinner.classList.add('hidden'); }
function clearErrors() { elements.errorMessage.classList.add('hidden'); }
function displayError(msg) {
    elements.errorMessage.textContent = msg;
    elements.errorMessage.classList.remove('hidden');
}
