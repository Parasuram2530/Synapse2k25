// Create Course Page JavaScript
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const courseForm = document.getElementById('courseForm');
const backToDashboardBtn = document.getElementById('backToDashboard');
const logoutBtn = document.getElementById('logoutBtn');
const cancelBtn = document.getElementById('cancelBtn');
const messageContainer = document.getElementById('messageContainer');

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

const setLoading = (button, loading = true) => {
    if (loading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-save"></i> Create Course';
    }
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

// Form validation
const validateForm = () => {
    const title = document.getElementById('courseTitle').value.trim();
    const description = document.getElementById('courseDescription').value.trim();
    const duration = document.getElementById('courseDuration').value.trim();

    if (!title) {
        showMessage('Course title is required', 'error');
        return false;
    }

    if (!description) {
        showMessage('Course description is required', 'error');
        return false;
    }

    if (!duration) {
        showMessage('Course duration is required', 'error');
        return false;
    }

    // Validate date range if both dates are provided
    const startDate = document.getElementById('courseStartDate').value;
    const endDate = document.getElementById('courseEndDate').value;

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        showMessage('End date must be after start date', 'error');
        return false;
    }

    return true;
};

// Handle course creation
const handleCourseCreation = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const submitBtn = courseForm.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(courseForm);
        const data = Object.fromEntries(formData);

        // Convert empty strings to null for optional fields
        Object.keys(data).forEach(key => {
            if (data[key] === '') {
                data[key] = null;
            }
        });

        const result = await apiCallWithAuth('/courses', data, 'POST');

        if (result.success) {
            showMessage('Course created successfully!', 'success');

            // Store course creation flag for dashboard refresh
            localStorage.setItem('courseCreated', 'true');

            // Redirect to teacher dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'teacher-dashboard.html';
            }, 2000);
        } else {
            showMessage(result.message || 'Failed to create course');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to create course');
    } finally {
        setLoading(submitBtn, false);
    }
};

// Navigation handlers
const handleBackToDashboard = () => {
    if (confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
        window.location.href = 'index.html';
    }
};

const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
};

const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
        window.location.href = 'index.html';
    }
};

// Check authentication on page load
const checkAuth = () => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }

    // Check if user is a teacher
    if (user.role !== 'Teacher') {
        showMessage('Only teachers can create courses', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Event listeners
    courseForm.addEventListener('submit', handleCourseCreation);
    backToDashboardBtn.addEventListener('click', handleBackToDashboard);
    logoutBtn.addEventListener('click', handleLogout);
    cancelBtn.addEventListener('click', handleCancel);

    // Add CSS link to head
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'create-course.css';
    document.head.appendChild(cssLink);
});