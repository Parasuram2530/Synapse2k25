// Create Assignment Page JavaScript
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const assignmentForm = document.getElementById('assignmentForm');
const backToDashboardBtn = document.getElementById('backToDashboard');
const logoutBtn = document.getElementById('logoutBtn');
const cancelBtn = document.getElementById('cancelBtn');
const previewBtn = document.getElementById('previewBtn');
const messageContainer = document.getElementById('messageContainer');
const previewModal = document.getElementById('previewModal');
const assignmentPreview = document.getElementById('assignmentPreview');

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
        button.innerHTML = '<i class="fas fa-save"></i> Create Assignment';
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

// Load teacher courses for assignment
const loadTeacherCourses = async () => {
    try {
        const user = getUser();
        if (!user || user.role !== 'Teacher') return;

        const result = await apiCallWithAuth(`/courses/teacher/${user.id}`);
        const courseSelect = document.getElementById('assignmentCourse');
        courseSelect.innerHTML = '<option value="">Select Course</option>';

        result.data.courses.forEach(course => {
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

// Form validation
const validateForm = () => {
    const title = document.getElementById('assignmentTitle').value.trim();
    const description = document.getElementById('assignmentDescription').value.trim();
    const courseId = document.getElementById('assignmentCourse').value;
    const dueDate = document.getElementById('assignmentDueDate').value;
    const maxPoints = document.getElementById('assignmentMaxPoints').value;

    if (!title) {
        showMessage('Assignment title is required', 'error');
        return false;
    }

    if (!description) {
        showMessage('Assignment description is required', 'error');
        return false;
    }

    if (!courseId) {
        showMessage('Please select a course', 'error');
        return false;
    }

    if (!dueDate) {
        showMessage('Due date is required', 'error');
        return false;
    }

    // Check if due date is in the future
    const now = new Date();
    const selectedDate = new Date(dueDate);
    if (selectedDate <= now) {
        showMessage('Due date must be in the future', 'error');
        return false;
    }

    if (!maxPoints || maxPoints < 1) {
        showMessage('Maximum points must be at least 1', 'error');
        return false;
    }

    return true;
};

// Handle assignment creation
const handleAssignmentCreation = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const submitBtn = assignmentForm.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(assignmentForm);
        const data = Object.fromEntries(formData);

        // Convert checkbox values
        data.allowLateSubmissions = data.allowLateSubmissions === 'true';
        data.showRubricToStudents = data.showRubricToStudents === 'true';
        data.isPublished = data.isPublished === 'true';
        data.sendNotification = data.sendNotification === 'true';

        // Convert numeric fields
        data.maxPoints = parseInt(data.maxPoints);
        if (data.maxFileSize) {
            data.maxFileSize = parseInt(data.maxFileSize);
        }

        console.log('Sending assignment data:', data); // Debug log

        // Try test route first to isolate the issue
        console.log('Trying test route first...');
        const testResult = await fetch('http://localhost:5000/api/test-assignments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (testResult.ok) {
            console.log('Test route worked! Server is responding.');
            const testData = await testResult.json();
            console.log('Test response:', testData);
        } else {
            console.log('Test route failed:', testResult.status, testResult.statusText);
        }

        // Now try the original route
        console.log('Trying original route...');
        const result = await apiCallWithAuth('/assignments', data, 'POST');

        console.log('Assignment creation result:', result); // Debug log

        if (result.success) {
            showMessage('Assignment created successfully!', 'success');

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showMessage(result.message || 'Failed to create assignment');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to create assignment');
    } finally {
        setLoading(submitBtn, false);
    }
};

// Preview assignment
const handlePreview = () => {
    const title = document.getElementById('assignmentTitle').value.trim();
    const description = document.getElementById('assignmentDescription').value.trim();
    const courseSelect = document.getElementById('assignmentCourse');
    const courseName = courseSelect.options[courseSelect.selectedIndex]?.text || 'Not selected';
    const type = document.getElementById('assignmentType').value;
    const dueDate = document.getElementById('assignmentDueDate').value;
    const maxPoints = document.getElementById('assignmentMaxPoints').value;
    const instructions = document.getElementById('submissionInstructions').value.trim();
    const rubric = document.getElementById('gradingRubric').value.trim();

    let previewHtml = `
        <div class="preview-section">
            <h3>${title || 'Assignment Title'}</h3>
            <div class="preview-meta">
                <div class="meta-item">
                    <div class="meta-label">Course</div>
                    <div class="meta-value">${courseName}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Type</div>
                    <div class="meta-value">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Due Date</div>
                    <div class="meta-value">${dueDate ? new Date(dueDate).toLocaleString() : 'Not set'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Points</div>
                    <div class="meta-value">${maxPoints || 'Not set'}</div>
                </div>
            </div>
        </div>

        <div class="preview-section">
            <h4>Description</h4>
            <p>${description || 'No description provided.'}</p>
        </div>
    `;

    if (instructions) {
        previewHtml += `
            <div class="preview-section">
                <h4>Submission Instructions</h4>
                <p>${instructions.replace(/\n/g, '<br>')}</p>
            </div>
        `;
    }

    if (rubric) {
        previewHtml += `
            <div class="preview-section">
                <h4>Grading Rubric</h4>
                <p>${rubric.replace(/\n/g, '<br>')}</p>
            </div>
        `;
    }

    assignmentPreview.innerHTML = previewHtml;
    previewModal.classList.remove('hidden');
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

// Modal close handler
const closeModal = () => {
    previewModal.classList.add('hidden');
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
        showMessage('Only teachers can create assignments', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    // Load courses for the teacher
    loadTeacherCourses();
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Event listeners
    assignmentForm.addEventListener('submit', handleAssignmentCreation);
    backToDashboardBtn.addEventListener('click', handleBackToDashboard);
    logoutBtn.addEventListener('click', handleLogout);
    cancelBtn.addEventListener('click', handleCancel);
    previewBtn.addEventListener('click', handlePreview);

    // Modal close
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            closeModal();
        }
    });

    // Add CSS link to head
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'create-assignment.css';
    document.head.appendChild(cssLink);
});