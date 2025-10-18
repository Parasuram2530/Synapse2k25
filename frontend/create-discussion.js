// Create Discussion Page JavaScript
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const discussionForm = document.getElementById('discussionForm');
const backToDashboardBtn = document.getElementById('backToDashboard');
const logoutBtn = document.getElementById('logoutBtn');
const cancelBtn = document.getElementById('cancelBtn');
const previewBtn = document.getElementById('previewBtn');
const refreshPreviewBtn = document.getElementById('refreshPreview');
const messageContainer = document.getElementById('messageContainer');

// Preview elements
const previewTitle = document.getElementById('previewTitle');
const previewAuthor = document.getElementById('previewAuthor');
const previewContent = document.getElementById('previewContent');
const previewTags = document.getElementById('previewTags');
const previewBadge = document.getElementById('previewBadge');

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
        button.innerHTML = '<i class="fas fa-paper-plane"></i> Create Discussion';
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

// Load courses for discussion
const loadCoursesForDiscussion = async () => {
    try {
        const user = getUser();
        let courses = [];

        if (user.role === 'Teacher') {
            const result = await apiCallWithAuth(`/courses/teacher/${user.id}`);
            courses = result.data.courses;
        } else {
            const result = await apiCallWithAuth('/courses/enrolled');
            courses = result.data.courses;
        }

        const courseSelect = document.getElementById('discussionCourse');
        courseSelect.innerHTML = '<option value="">Select Course</option>';

        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course._id;
            option.textContent = course.title;
            courseSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading courses:', error);
        showMessage('Failed to load courses', 'error');
    }
};

// Update preview
const updatePreview = () => {
    const title = document.getElementById('discussionTitle').value.trim();
    const content = document.getElementById('discussionContent').value.trim();
    const tags = document.getElementById('discussionTags').value.trim();
    const discussionType = document.querySelector('input[name="discussionType"]:checked').value;
    const user = getUser();

    // Update title
    previewTitle.textContent = title || 'Discussion Title';

    // Update author
    previewAuthor.textContent = user ? user.name : 'You';

    // Update content
    previewContent.textContent = content || 'Discussion content will appear here...';

    // Update announcement badge
    if (discussionType === 'announcement') {
        previewBadge.textContent = 'Announcement';
        previewBadge.classList.remove('hidden');
    } else {
        previewBadge.classList.add('hidden');
    }

    // Update tags
    if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        if (tagArray.length > 0) {
            previewTags.innerHTML = tagArray.map(tag => `<span class="tag">${tag}</span>`).join('');
            previewTags.classList.remove('hidden');
        } else {
            previewTags.classList.add('hidden');
        }
    } else {
        previewTags.classList.add('hidden');
    }
};

// Form validation
const validateForm = () => {
    const title = document.getElementById('discussionTitle').value.trim();
    const content = document.getElementById('discussionContent').value.trim();
    const courseId = document.getElementById('discussionCourse').value;

    if (!title) {
        showMessage('Discussion title is required', 'error');
        return false;
    }

    if (!content) {
        showMessage('Discussion content is required', 'error');
        return false;
    }

    if (!courseId) {
        showMessage('Please select a course', 'error');
        return false;
    }

    // Check if user is teacher and trying to create announcement
    const discussionType = document.querySelector('input[name="discussionType"]:checked').value;
    const user = getUser();

    if (discussionType === 'announcement' && user.role !== 'Teacher') {
        showMessage('Only teachers can create announcements', 'error');
        return false;
    }

    return true;
};

// Handle discussion creation
const handleDiscussionCreation = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const submitBtn = discussionForm.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(discussionForm);
        const data = Object.fromEntries(formData);

        // Convert checkbox values
        data.isAnnouncement = document.querySelector('input[name="discussionType"]:checked').value === 'announcement';
        data.isPinned = data.isPinned === 'true';
        data.isClosed = data.isClosed === 'true';
        data.sendNotification = data.sendNotification === 'true';

        // Process tags
        if (data.tags) {
            data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else {
            data.tags = [];
        }

        const result = await apiCallWithAuth('/discussions', data, 'POST');

        if (result.success) {
            showMessage('Discussion created successfully!', 'success');

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showMessage(result.message || 'Failed to create discussion');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to create discussion');
    } finally {
        setLoading(submitBtn, false);
    }
};

// Handle announcement option visibility
const handleDiscussionTypeChange = () => {
    const discussionType = document.querySelector('input[name="discussionType"]:checked').value;
    const user = getUser();

    // Only teachers can create announcements
    if (discussionType === 'announcement' && user.role !== 'Teacher') {
        showMessage('Only teachers can create announcements', 'error');
        // Reset to discussion
        document.querySelector('input[name="discussionType"][value="discussion"]').checked = true;
        return;
    }

    updatePreview();
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

    // Load courses for the user
    loadCoursesForDiscussion();

    // Set up announcement option based on user role
    const announcementOption = document.querySelector('input[name="discussionType"][value="announcement"]');
    const announcementLabel = announcementOption.closest('.type-option');

    if (user.role !== 'Teacher') {
        announcementLabel.style.opacity = '0.5';
        announcementLabel.style.pointerEvents = 'none';
        announcementLabel.title = 'Only teachers can create announcements';
    }
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Event listeners
    discussionForm.addEventListener('submit', handleDiscussionCreation);
    backToDashboardBtn.addEventListener('click', handleBackToDashboard);
    logoutBtn.addEventListener('click', handleLogout);
    cancelBtn.addEventListener('click', handleCancel);
    previewBtn.addEventListener('click', updatePreview);
    refreshPreviewBtn.addEventListener('click', updatePreview);

    // Discussion type change listener
    document.querySelectorAll('input[name="discussionType"]').forEach(radio => {
        radio.addEventListener('change', handleDiscussionTypeChange);
    });

    // Live preview updates
    document.getElementById('discussionTitle').addEventListener('input', updatePreview);
    document.getElementById('discussionContent').addEventListener('input', updatePreview);
    document.getElementById('discussionTags').addEventListener('input', updatePreview);

    // Add CSS link to head
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'create-discussion.css';
    document.head.appendChild(cssLink);

    // Initial preview update
    setTimeout(updatePreview, 100);
});