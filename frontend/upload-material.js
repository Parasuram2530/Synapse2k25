// Upload Material Page JavaScript
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const materialForm = document.getElementById('materialForm');
const backToDashboardBtn = document.getElementById('backToDashboard');
const logoutBtn = document.getElementById('logoutBtn');
const cancelBtn = document.getElementById('cancelBtn');
const messageContainer = document.getElementById('messageContainer');
const uploadArea = document.getElementById('uploadArea');
const materialFileInput = document.getElementById('materialFile');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileType = document.getElementById('fileType');
const removeFileBtn = document.getElementById('removeFile');
const uploadProgressModal = document.getElementById('uploadProgressModal');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// File handling variables
let selectedFile = null;

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
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-upload"></i> Upload Material';
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

// Load teacher courses for material upload
const loadTeacherCourses = async () => {
    try {
        const user = getUser();
        if (!user || user.role !== 'Teacher') return;

        const result = await apiCallWithAuth(`/courses/teacher/${user.id}`);
        const courseSelect = document.getElementById('materialCourse');
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

// File handling functions
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileType = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const typeMap = {
        'pdf': 'PDF Document',
        'doc': 'Word Document',
        'docx': 'Word Document',
        'ppt': 'PowerPoint',
        'pptx': 'PowerPoint',
        'xls': 'Excel Spreadsheet',
        'xlsx': 'Excel Spreadsheet',
        'txt': 'Text File',
        'jpg': 'JPEG Image',
        'jpeg': 'JPEG Image',
        'png': 'PNG Image',
        'gif': 'GIF Image',
        'mp4': 'MP4 Video',
        'avi': 'AVI Video',
        'mov': 'MOV Video',
        'zip': 'ZIP Archive',
        'rar': 'RAR Archive'
    };
    return typeMap[extension] || `${extension.toUpperCase()} File`;
};

const validateFile = (file) => {
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
        showMessage('File size must be less than 50MB', 'error');
        return false;
    }

    // Check file type
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'application/zip',
        'application/x-rar-compressed'
    ];

    if (!allowedTypes.includes(file.type) && !allowedTypes.some(type => file.name.toLowerCase().endsWith(type.split('/')[1]))) {
        showMessage('File type not supported. Please check the supported formats.', 'error');
        return false;
    }

    return true;
};

const handleFileSelect = (file) => {
    if (!validateFile(file)) {
        return;
    }

    selectedFile = file;

    // Update file info display
    fileName.textContent = file.name;
    fileSize.textContent = `Size: ${formatFileSize(file.size)}`;
    fileType.textContent = `Type: ${getFileType(file)}`;

    // Show file info section
    fileInfo.classList.remove('hidden');

    // Update upload area appearance
    uploadArea.classList.add('has-file');
};

const removeFile = () => {
    selectedFile = null;
    materialFileInput.value = '';
    fileInfo.classList.add('hidden');
    uploadArea.classList.remove('has-file');
};

// Drag and drop functionality
const handleDragOver = (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
};

const handleDragLeave = (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
};

const handleDrop = (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
};

const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileSelect(file);
    }
};

// Form validation
const validateForm = () => {
    const title = document.getElementById('materialTitle').value.trim();
    const courseId = document.getElementById('materialCourse').value;

    if (!title) {
        showMessage('Material title is required', 'error');
        return false;
    }

    if (!courseId) {
        showMessage('Please select a course', 'error');
        return false;
    }

    if (!selectedFile) {
        showMessage('Please select a file to upload', 'error');
        return false;
    }

    return true;
};

// Handle material upload
const handleMaterialUpload = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const submitBtn = materialForm.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    // Show upload progress modal
    uploadProgressModal.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressText.textContent = 'Preparing upload...';

    try {
        const formData = new FormData();

        // Add form fields
        formData.append('title', document.getElementById('materialTitle').value.trim());
        formData.append('description', document.getElementById('materialDescription').value.trim());
        formData.append('courseId', document.getElementById('materialCourse').value);
        formData.append('category', document.getElementById('materialCategory').value);
        formData.append('tags', document.getElementById('materialTags').value);
        formData.append('isPublic', document.getElementById('materialPublic').checked ? 'true' : 'false');
        formData.append('sendNotification', document.getElementById('sendNotification').checked ? 'true' : 'false');

        // Add file
        formData.append('file', selectedFile);

        // Simulate progress updates
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Uploading... ${Math.round(progress)}%`;
        }, 200);

        const response = await fetch(`${API_BASE_URL}/materials/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });

        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        progressText.textContent = 'Processing...';

        const result = await response.json();

        if (response.ok && result.success) {
            progressText.textContent = 'Upload complete!';
            showMessage('Material uploaded successfully!', 'success');

            // Hide progress modal and redirect after a short delay
            setTimeout(() => {
                uploadProgressModal.classList.add('hidden');
                window.location.href = 'index.html';
            }, 2000);
        } else {
            uploadProgressModal.classList.add('hidden');
            showMessage(result.message || 'Failed to upload material');
        }
    } catch (error) {
        uploadProgressModal.classList.add('hidden');
        showMessage(error.message || 'Failed to upload material');
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
        showMessage('Only teachers can upload materials', 'error');
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
    materialForm.addEventListener('submit', handleMaterialUpload);
    backToDashboardBtn.addEventListener('click', handleBackToDashboard);
    logoutBtn.addEventListener('click', handleLogout);
    cancelBtn.addEventListener('click', handleCancel);

    // File handling event listeners
    uploadArea.addEventListener('click', () => materialFileInput.click());
    materialFileInput.addEventListener('change', handleFileInputChange);
    removeFileBtn.addEventListener('click', removeFile);

    // Drag and drop event listeners
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Add CSS link to head
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'upload-material.css';
    document.head.appendChild(cssLink);
});