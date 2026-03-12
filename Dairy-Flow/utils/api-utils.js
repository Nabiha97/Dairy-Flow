// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Alert notification system
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.getElementById('dataRetentionAlert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.id = 'dataRetentionAlert';
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'warning' ? '#f59e0b' : type === 'critical' ? '#dc2626' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        max-width: 400px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    alertDiv.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;font-size:20px;margin-left:10px;">&times;</button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 10 seconds for info, 30 seconds for warnings/critical
    const timeout = type === 'info' ? 10000 : 30000;
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, timeout);
}

// Check data retention alerts
async function checkDataRetentionAlerts() {
    try {
        const response = await fetch(`${API_BASE_URL}/alerts/retention`);
        if (!response.ok) return;
        
        const alerts = await response.json();
        if (alerts && alerts.length > 0) {
            alerts.forEach(alert => {
                if (alert.alert_status === 'active') {
                    showAlert(alert.alert_message, alert.alert_type || 'warning');
                }
            });
        }
    } catch (error) {
        console.error('Error checking retention alerts:', error);
    }
}

// Check alerts on page load and periodically
document.addEventListener('DOMContentLoaded', () => {
    checkDataRetentionAlerts();
    // Check every hour
    setInterval(checkDataRetentionAlerts, 3600000);
});

// Generic API fetch wrapper
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Export functions
window.API_BASE_URL = API_BASE_URL;
window.apiFetch = apiFetch;
window.showAlert = showAlert;
window.checkDataRetentionAlerts = checkDataRetentionAlerts;
