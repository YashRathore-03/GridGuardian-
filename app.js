// Cyclone Outage Risk Monitor - Dashboard JavaScript

class CycloneMonitor {
    constructor() {
        this.isConnected = false;
        this.dataHistory = {
            windSpeed: [],
            precipitation: [],
            floodRisk: [],
            cycloneCategory: [],
            vegetationDensity: [],
            outageRisk: []
        };
        this.maxHistoryPoints = 60;
        this.gridAge = 25;
        this.charts = {};
        this.dataInterval = null;
        this.chartLabels = [];
        
        // Start initialization
        this.init();
    }

    init() {
        console.log('Initializing Cyclone Monitor...');
        
        // Wait for Chart.js to load
        if (typeof Chart === 'undefined') {
            console.log('Chart.js not loaded yet, waiting...');
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.setupEventListeners();
        this.simulateConnection();
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        // Add any additional event listeners here
    }

    simulateConnection() {
        console.log('Starting connection simulation...');
        
        // Simulate connection process
        this.updateConnectionStatus('connecting', 'Connecting...');
        
        setTimeout(() => {
            console.log('Connection established');
            this.isConnected = true;
            this.updateConnectionStatus('connected', 'Connected');
            this.initializeCharts();
            this.startDataSimulation();
        }, 2000);
    }

    updateConnectionStatus(status, text) {
        console.log(`Connection status: ${status} - ${text}`);
        
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (statusDot) {
            statusDot.className = `status-dot ${status}`;
        }
        if (statusText) {
            statusText.textContent = text;
        }
    }

    generateRealisticData() {
        // Generate cyclone scenario with realistic correlations
        const time = Date.now();
        const baseWindSpeed = 80 + Math.sin(time / 10000) * 40 + Math.random() * 30;
        const windSpeed = Math.max(0, Math.min(200, baseWindSpeed));
        
        // Precipitation correlates with wind speed
        const basePrecipitation = (windSpeed / 200) * 80 + Math.random() * 40;
        const precipitation = Math.max(0, Math.min(150, basePrecipitation));
        
        // Flood risk correlates with precipitation
        const baseFloodRisk = (precipitation / 150) * 6 + Math.random() * 3;
        const floodRisk = Math.max(0, Math.min(10, baseFloodRisk));
        
        // Cyclone category based on wind speed
        let cycloneCategory;
        if (windSpeed < 74) cycloneCategory = 1;
        else if (windSpeed < 96) cycloneCategory = 2;
        else if (windSpeed < 111) cycloneCategory = 3;
        else if (windSpeed < 130) cycloneCategory = 4;
        else cycloneCategory = 5;
        
        // Add some variation
        cycloneCategory = Math.max(1, Math.min(5, cycloneCategory + Math.round((Math.random() - 0.5) * 0.8)));
        
        // Vegetation density (0-1 scale)
        const vegetationDensity = 0.3 + Math.random() * 0.5;
        
        return {
            windSpeed: Math.round(windSpeed * 10) / 10,
            precipitation: Math.round(precipitation * 10) / 10,
            floodRisk: Math.round(floodRisk * 10) / 10,
            cycloneCategory: cycloneCategory,
            vegetationDensity: Math.round(vegetationDensity * 100) / 100,
            timestamp: new Date()
        };
    }

    calculateOutageRisk(data) {
        const { windSpeed, precipitation, floodRisk, vegetationDensity } = data;
        
        const risk = 0.35 * (windSpeed / 45) + 
                    0.25 * (precipitation / 150) + 
                    0.20 * (floodRisk / 2) + 
                    0.15 * vegetationDensity + 
                    0.05 * (this.gridAge / 50);
        
        return Math.min(1.0, Math.max(0.0, risk));
    }

    getRiskLevel(risk) {
        if (risk <= 0.3) return { level: 'Low', class: 'low' };
        if (risk <= 0.6) return { level: 'Medium', class: 'medium' };
        if (risk <= 0.8) return { level: 'High', class: 'high' };
        return { level: 'Critical', class: 'critical' };
    }

    getParameterStatus(parameter, value) {
        const thresholds = {
            windSpeed: { safe: 74, caution: 110, danger: 156 },
            precipitation: { safe: 25, caution: 50, danger: 100 },
            floodRisk: { safe: 3, caution: 6, danger: 8 },
            cycloneCategory: { safe: 1, caution: 2, danger: 3 },
            vegetationDensity: { safe: 0.3, caution: 0.6, danger: 0.8 }
        };

        const threshold = thresholds[parameter];
        if (!threshold) return { status: 'Unknown', class: 'safe' };
        
        if (value <= threshold.safe) return { status: 'Safe', class: 'safe' };
        if (value <= threshold.caution) return { status: 'Caution', class: 'caution' };
        if (value <= threshold.danger) return { status: 'Danger', class: 'danger' };
        return { status: 'Critical', class: 'critical' };
    }

    updateParameterCard(parameter, value, unit) {
        const valueElement = document.getElementById(`${parameter}Value`);
        const statusElement = document.getElementById(`${parameter}Status`);
        const cardElement = document.getElementById(`${parameter}Card`);
        
        if (valueElement) {
            // Format value display
            let displayValue = value;
            if (parameter === 'vegetationDensity') {
                displayValue = Math.round(value * 100) + '%';
            } else if (parameter === 'cycloneCategory') {
                displayValue = Math.round(value);
            } else {
                displayValue = value.toFixed(1);
            }
            
            valueElement.textContent = displayValue;
        }
        
        if (statusElement) {
            const statusInfo = this.getParameterStatus(parameter, value);
            statusElement.textContent = statusInfo.status;
        }
        
        if (cardElement) {
            const statusInfo = this.getParameterStatus(parameter, value);
            cardElement.className = `parameter-card ${statusInfo.class}`;
        }
    }

    updateRiskDisplay(risk) {
        const riskScoreElement = document.getElementById('riskScore');
        const riskLevelElement = document.getElementById('riskLevel');
        const riskCardElement = document.getElementById('riskCard');
        
        if (riskScoreElement) {
            riskScoreElement.textContent = `${Math.round(risk * 100)}%`;
        }
        
        if (riskLevelElement) {
            const riskInfo = this.getRiskLevel(risk);
            riskLevelElement.textContent = riskInfo.level;
        }
        
        if (riskCardElement) {
            const riskInfo = this.getRiskLevel(risk);
            riskCardElement.className = `risk-card ${riskInfo.class}`;
        }
    }

    updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            lastUpdateElement.textContent = `Last Update: ${timeString}`;
        }
    }

    addDataToHistory(data, risk) {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString();
        
        // Add to labels
        this.chartLabels.push(timeLabel);
        
        // Add data points
        this.dataHistory.windSpeed.push(data.windSpeed);
        this.dataHistory.precipitation.push(data.precipitation);
        this.dataHistory.floodRisk.push(data.floodRisk);
        this.dataHistory.cycloneCategory.push(data.cycloneCategory);
        this.dataHistory.vegetationDensity.push(data.vegetationDensity * 100);
        this.dataHistory.outageRisk.push(risk * 100);
        
        // Keep only last 60 points
        if (this.chartLabels.length > this.maxHistoryPoints) {
            this.chartLabels.shift();
            Object.keys(this.dataHistory).forEach(key => {
                this.dataHistory[key].shift();
            });
        }
    }

    initializeCharts() {
        console.log('Initializing charts...');
        
        const chartConfigs = {
            windSpeedChart: {
                data: 'windSpeed',
                color: '#1FB8CD',
                label: 'Wind Speed (mph)',
                yMax: 200
            },
            precipitationChart: {
                data: 'precipitation',
                color: '#FFC185',
                label: 'Precipitation (mm/hr)',
                yMax: 150
            },
            floodRiskChart: {
                data: 'floodRisk',
                color: '#B4413C',
                label: 'Flood Risk (scale)',
                yMax: 10
            },
            cycloneCategoryChart: {
                data: 'cycloneCategory',
                color: '#5D878F',
                label: 'Cyclone Category',
                yMax: 5
            },
            vegetationDensityChart: {
                data: 'vegetationDensity',
                color: '#DB4545',
                label: 'Vegetation Density (%)',
                yMax: 100
            },
            outageRiskChart: {
                data: 'outageRisk',
                color: '#D2BA4C',
                label: 'Outage Risk (%)',
                yMax: 100
            }
        };

        Object.keys(chartConfigs).forEach(chartId => {
            const canvas = document.getElementById(chartId);
            if (canvas) {
                const config = chartConfigs[chartId];
                const dataKey = config.data;
                
                try {
                    this.charts[chartId] = new Chart(canvas, {
                        type: 'line',
                        data: {
                            labels: this.chartLabels,
                            datasets: [{
                                label: config.label,
                                data: this.dataHistory[dataKey],
                                borderColor: config.color,
                                backgroundColor: config.color + '20',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.4,
                                pointRadius: 2,
                                pointHoverRadius: 4,
                                pointBackgroundColor: config.color,
                                pointBorderColor: config.color
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false,
                                }
                            },
                            scales: {
                                x: {
                                    display: true,
                                    title: {
                                        display: true,
                                        text: 'Time'
                                    },
                                    ticks: {
                                        maxTicksLimit: 10,
                                        callback: function(value, index, values) {
                                            // Show every 6th label to avoid crowding
                                            if (index % 6 === 0 || index === values.length - 1) {
                                                return this.getLabelForValue(value);
                                            }
                                            return '';
                                        }
                                    }
                                },
                                y: {
                                    beginAtZero: true,
                                    max: config.yMax,
                                    title: {
                                        display: true,
                                        text: config.label.split(' ')[0]
                                    }
                                }
                            },
                            animation: {
                                duration: 500
                            },
                            interaction: {
                                mode: 'nearest',
                                axis: 'x',
                                intersect: false
                            }
                        }
                    });
                    console.log(`Chart ${chartId} initialized successfully`);
                } catch (error) {
                    console.error(`Error initializing chart ${chartId}:`, error);
                }
            } else {
                console.warn(`Canvas element ${chartId} not found`);
            }
        });
    }

    updateCharts() {
        Object.keys(this.charts).forEach(chartId => {
            const chart = this.charts[chartId];
            if (chart) {
                try {
                    chart.data.labels = this.chartLabels;
                    chart.update('none');
                } catch (error) {
                    console.error(`Error updating chart ${chartId}:`, error);
                }
            }
        });
    }

    processNewData(data) {
        console.log('Processing new data:', data);
        
        const outageRisk = this.calculateOutageRisk(data);
        
        // Update parameter cards
        this.updateParameterCard('windSpeed', data.windSpeed, 'mph');
        this.updateParameterCard('precipitation', data.precipitation, 'mm/hr');
        this.updateParameterCard('floodRisk', data.floodRisk, 'scale');
        this.updateParameterCard('cycloneCategory', data.cycloneCategory, 'category');
        this.updateParameterCard('vegetationDensity', data.vegetationDensity, 'scale');
        
        // Update risk display
        this.updateRiskDisplay(outageRisk);
        
        // Update timestamp
        this.updateLastUpdateTime();
        
        // Add to history and update charts
        this.addDataToHistory(data, outageRisk);
        this.updateCharts();
    }

    startDataSimulation() {
        console.log('Starting data simulation...');
        
        // Generate initial data immediately
        const initialData = this.generateRealisticData();
        this.processNewData(initialData);
        
        // Start generating data every second
        this.dataInterval = setInterval(() => {
            if (this.isConnected) {
                const newData = this.generateRealisticData();
                this.processNewData(newData);
            }
        }, 1000);
    }

    stop() {
        if (this.dataInterval) {
            clearInterval(this.dataInterval);
            this.dataInterval = null;
        }
        this.isConnected = false;
    }
}

// Global monitor instance
let monitor;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing monitor...');
    monitor = new CycloneMonitor();
});

// Fallback initialization
window.addEventListener('load', () => {
    console.log('Window loaded');
    if (!monitor) {
        console.log('Creating fallback monitor instance...');
        monitor = new CycloneMonitor();
    }
});