// API base URL - change this to your backend URL
const API_BASE_URL = 'http://localhost:5000/api';

// DOM elements
const themeButtons = document.querySelectorAll('.theme-btn');
const dashboardLayout = document.getElementById('dashboardLayout');
const emailNotifications = document.getElementById('emailNotifications');
const assignmentReminders = document.getElementById('assignmentReminders');
const gradeNotifications = document.getElementById('gradeNotifications');
const discussionNotifications = document.getElementById('discussionNotifications');
const languageSelect = document.getElementById('languageSelect');
const timezoneSelect = document.getElementById('timezoneSelect');
const profileVisibility = document.getElementById('profileVisibility');
const activityStatus = document.getElementById('activityStatus');
const highContrast = document.getElementById('highContrast');
const reduceMotion = document.getElementById('reduceMotion');
const decreaseFont = document.getElementById('decreaseFont');
const increaseFont = document.getElementById('increaseFont');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');
const exportDataBtn = document.getElementById('exportDataBtn');
const clearCacheBtn = document.getElementById('clearCacheBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
const successModal = document.getElementById('successModal');
const refreshPageBtn = document.getElementById('refreshPageBtn');
const closeSuccessModal = document.getElementById('closeSuccessModal');

// Settings storage key
const SETTINGS_KEY = 'lms_user_settings';

// Default settings
const defaultSettings = {
    theme: 'light',
    dashboardLayout: 'grid',
    notifications: {
        email: true,
        assignmentReminders: true,
        gradeNotifications: true,
        discussionNotifications: true
    },
    language: 'en',
    timezone: 'Asia/Kolkata',
    privacy: {
        profileVisibility: 'public',
        activityStatus: true
    },
    accessibility: {
        fontSize: 'medium',
        highContrast: false,
        reduceMotion: false
    }
};

// Current settings
let currentSettings = { ...defaultSettings };

// Utility functions
const getToken = () => {
    return localStorage.getItem('token');
};

const apiCallWithAuth = async (endpoint, data = null, method = 'GET') => {
    const token = getToken();
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
        config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
    }

    return result;
};

const showMessage = (message, type = 'error') => {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    // Insert message at the top of the page
    const pageContainer = document.querySelector('.page-container');
    pageContainer.insertBefore(messageDiv, pageContainer.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
};

// Load settings from localStorage
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            currentSettings = { ...defaultSettings, ...JSON.parse(savedSettings) };
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        currentSettings = { ...defaultSettings };
    }
}

// Save settings to localStorage
function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// Apply settings to UI
function applySettingsToUI() {
    // Theme
    themeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === currentSettings.theme);
    });
    applyTheme(currentSettings.theme);

    // Dashboard layout
    dashboardLayout.value = currentSettings.dashboardLayout;

    // Notifications
    emailNotifications.checked = currentSettings.notifications.email;
    assignmentReminders.checked = currentSettings.notifications.assignmentReminders;
    gradeNotifications.checked = currentSettings.notifications.gradeNotifications;
    discussionNotifications.checked = currentSettings.notifications.discussionNotifications;

    // Language & Timezone
    languageSelect.value = currentSettings.language;
    timezoneSelect.value = currentSettings.timezone;

    // Privacy
    profileVisibility.value = currentSettings.privacy.profileVisibility;
    activityStatus.checked = currentSettings.privacy.activityStatus;

    // Accessibility
    highContrast.checked = currentSettings.accessibility.highContrast;
    reduceMotion.checked = currentSettings.accessibility.reduceMotion;
    fontSizeDisplay.textContent = currentSettings.accessibility.fontSize.charAt(0).toUpperCase() + currentSettings.accessibility.fontSize.slice(1);

    applyAccessibilitySettings();
}

// Apply theme
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
}

// Apply accessibility settings
function applyAccessibilitySettings() {
    // Font size
    document.documentElement.style.fontSize = getFontSizeValue(currentSettings.accessibility.fontSize);

    // High contrast
    document.documentElement.classList.toggle('high-contrast', currentSettings.accessibility.highContrast);

    // Reduce motion
    document.documentElement.style.setProperty('--animation-duration', currentSettings.accessibility.reduceMotion ? '0s' : '0.3s');
}

// Get font size value
function getFontSizeValue(size) {
    const sizes = {
        small: '14px',
        medium: '16px',
        large: '18px',
        xlarge: '20px'
    };
    return sizes[size] || sizes.medium;
}

// Update current settings from UI
function updateSettingsFromUI() {
    currentSettings = {
        theme: document.querySelector('.theme-btn.active')?.dataset.theme || 'light',
        dashboardLayout: dashboardLayout.value,
        notifications: {
            email: emailNotifications.checked,
            assignmentReminders: assignmentReminders.checked,
            gradeNotifications: gradeNotifications.checked,
            discussionNotifications: discussionNotifications.checked
        },
        language: languageSelect.value,
        timezone: timezoneSelect.value,
        privacy: {
            profileVisibility: profileVisibility.value,
            activityStatus: activityStatus.checked
        },
        accessibility: {
            fontSize: currentSettings.accessibility.fontSize,
            highContrast: highContrast.checked,
            reduceMotion: reduceMotion.checked
        }
    };
}

// Theme button handlers
themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theme = btn.dataset.theme;
        currentSettings.theme = theme;
        applyTheme(theme);
    });
});

// Font size controls
decreaseFont.addEventListener('click', () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(currentSettings.accessibility.fontSize);
    if (currentIndex > 0) {
        currentSettings.accessibility.fontSize = sizes[currentIndex - 1];
        fontSizeDisplay.textContent = currentSettings.accessibility.fontSize.charAt(0).toUpperCase() + currentSettings.accessibility.fontSize.slice(1);
        applyAccessibilitySettings();
    }
});

increaseFont.addEventListener('click', () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(currentSettings.accessibility.fontSize);
    if (currentIndex < sizes.length - 1) {
        currentSettings.accessibility.fontSize = sizes[currentIndex + 1];
        fontSizeDisplay.textContent = currentSettings.accessibility.fontSize.charAt(0).toUpperCase() + currentSettings.accessibility.fontSize.slice(1);
        applyAccessibilitySettings();
    }
});

// Accessibility toggles
highContrast.addEventListener('change', () => {
    currentSettings.accessibility.highContrast = highContrast.checked;
    applyAccessibilitySettings();
});

reduceMotion.addEventListener('change', () => {
    currentSettings.accessibility.reduceMotion = reduceMotion.checked;
    applyAccessibilitySettings();
});

// Export data
exportDataBtn.addEventListener('click', async () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const settings = currentSettings;

        const exportData = {
            user: user,
            settings: settings,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lms-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showMessage('Data exported successfully!', 'success');
    } catch (error) {
        showMessage('Error exporting data', 'error');
    }
});

// Clear cache
clearCacheBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all locally stored data? This action cannot be undone.')) {
        try {
            // Clear StudyZone-related localStorage items
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('lms_') || key === 'token' || key === 'user')) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Reset to defaults
            currentSettings = { ...defaultSettings };
            applySettingsToUI();

            showMessage('Cache cleared successfully!', 'success');
        } catch (error) {
            showMessage('Error clearing cache', 'error');
        }
    }
});

// Save settings
saveSettingsBtn.addEventListener('click', () => {
    updateSettingsFromUI();
    saveSettings();
    successModal.classList.remove('hidden');
});

// Reset settings
resetSettingsBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to their default values?')) {
        currentSettings = { ...defaultSettings };
        applySettingsToUI();
        saveSettings();
        showMessage('Settings reset to defaults!', 'success');
    }
});

// Modal handlers
refreshPageBtn.addEventListener('click', () => {
    window.location.reload();
});

closeSuccessModal.addEventListener('click', () => {
    successModal.classList.add('hidden');
});

// Check authentication
function checkAuth() {
    const token = getToken();
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Initialize settings page
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    loadSettings();
    applySettingsToUI();

    // Set initial timezone based on browser
    if (!currentSettings.timezone || currentSettings.timezone === 'Asia/Kolkata') {
        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            timezoneSelect.value = userTimezone;
            currentSettings.timezone = userTimezone;
        } catch (error) {
            console.error('Error detecting timezone:', error);
        }
    }

    // Listen for system theme changes when auto theme is selected
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (currentSettings.theme === 'auto') {
            applyTheme('auto');
        }
    });
});