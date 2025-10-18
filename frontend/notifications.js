// Notifications Page JavaScript
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const backToDashboardBtn = document.getElementById('backToDashboard');
const logoutBtn = document.getElementById('logoutBtn');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const refreshBtn = document.getElementById('refreshBtn');
const filterType = document.getElementById('filterType');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const messageContainer = document.getElementById('messageContainer');

const notificationsList = document.getElementById('notificationsList');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const loadMoreContainer = document.getElementById('loadMoreContainer');

const totalNotifications = document.getElementById('totalNotifications');
const unreadNotifications = document.getElementById('unreadNotifications');
const todayNotifications = document.getElementById('todayNotifications');

// State variables
let currentPage = 1;
const pageSize = 20;
let currentFilter = 'all';
let allNotifications = [];
let filteredNotifications = [];

// Utility functions
const showMessage = (message, type = 'error') => {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;

    messageContainer.appendChild(messageDiv);
    messageContainer.classList.remove('hidden');

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
            if (messageContainer.children.length === 0) {
                messageContainer.classList.add('hidden');
            }
        }
    }, 5000);
};

const getToken = () => {
    return localStorage.getItem('token');
};

const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// API call function
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

// Format relative time
const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
};

// Check if notification is from today
const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
};

// Load notifications
const loadNotifications = async (page = 1, append = false) => {
    try {
        if (!append) {
            loadingState.classList.remove('hidden');
            notificationsList.innerHTML = '';
        }

        const response = await apiCallWithAuth(`/notifications?page=${page}&limit=${pageSize}`);
        const notifications = response.data.notifications;

        if (!append) {
            allNotifications = notifications;
        } else {
            allNotifications = [...allNotifications, ...notifications];
        }

        filterNotifications();
        updateStats();

        if (!append) {
            loadingState.classList.add('hidden');
        }

        // Show/hide load more button
        if (notifications.length === pageSize) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }

    } catch (error) {
        console.error('Error loading notifications:', error);
        loadingState.classList.add('hidden');
        showMessage('Failed to load notifications', 'error');
    }
};

// Filter notifications
const filterNotifications = () => {
    if (currentFilter === 'all') {
        filteredNotifications = allNotifications;
    } else if (currentFilter === 'unread') {
        filteredNotifications = allNotifications.filter(n => !n.isRead);
    } else {
        filteredNotifications = allNotifications.filter(n => n.type === currentFilter);
    }

    displayNotifications(filteredNotifications);
};

// Display notifications
const displayNotifications = (notifications) => {
    if (notifications.length === 0) {
        if (allNotifications.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            notificationsList.innerHTML = '<div class="no-results">No notifications match your filter.</div>';
        }
        return;
    }

    emptyState.classList.add('hidden');

    const notificationsHtml = notifications.map(notification => `
        <div class="notification-item ${notification.isRead ? 'read' : 'unread'}"
             data-notification-id="${notification._id}"
             onclick="markAsRead('${notification._id}')">
            <div class="notification-header">
                <h6>${notification.title}</h6>
                <span class="notification-time">${formatRelativeTime(notification.createdAt)}</span>
            </div>
            <div class="notification-content">
                <p>${notification.message}</p>
            </div>
            <div class="notification-meta">
                <span class="notification-type ${notification.type}">${notification.type.replace('_', ' ')}</span>
                ${notification.priority !== 'medium' ? `<span class="priority ${notification.priority}">${notification.priority}</span>` : ''}
            </div>
        </div>
    `).join('');

    notificationsList.innerHTML = notificationsHtml;
};

// Update statistics
const updateStats = () => {
    const total = allNotifications.length;
    const unread = allNotifications.filter(n => !n.isRead).length;
    const today = allNotifications.filter(n => isToday(n.createdAt)).length;

    totalNotifications.textContent = total;
    unreadNotifications.textContent = unread;
    todayNotifications.textContent = today;
};

// Mark notification as read
const markAsRead = async (notificationId) => {
    try {
        await apiCallWithAuth(`/notifications/${notificationId}/read`, {}, 'PUT');

        // Update local state
        const notification = allNotifications.find(n => n._id === notificationId);
        if (notification) {
            notification.isRead = true;
        }

        filterNotifications();
        updateStats();

        // Update dashboard badge if it exists
        if (window.parent && window.parent.updateNotificationBadge) {
            window.parent.updateNotificationBadge();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

// Mark all notifications as read
const markAllAsRead = async () => {
    try {
        await apiCallWithAuth('/notifications/read-all', {}, 'PUT');

        // Update local state
        allNotifications.forEach(n => n.isRead = true);

        filterNotifications();
        updateStats();
        showMessage('All notifications marked as read', 'success');

        // Update dashboard badge if it exists
        if (window.parent && window.parent.updateNotificationBadge) {
            window.parent.updateNotificationBadge();
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        showMessage('Failed to mark notifications as read', 'error');
    }
};

// Navigation handlers
const handleBackToDashboard = () => {
    window.location.href = 'index.html';
};

const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
};

// Event listeners
const setupEventListeners = () => {
    backToDashboardBtn.addEventListener('click', handleBackToDashboard);
    logoutBtn.addEventListener('click', handleLogout);
    markAllReadBtn.addEventListener('click', markAllAsRead);
    refreshBtn.addEventListener('click', () => loadNotifications(1, false));
    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        loadNotifications(currentPage, true);
    });

    filterType.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        filterNotifications();
    });
};

// Check authentication on page load
const checkAuth = () => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }

    // Load initial notifications
    loadNotifications();
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();

    // Add CSS link to head
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'notifications.css';
    document.head.appendChild(cssLink);
});