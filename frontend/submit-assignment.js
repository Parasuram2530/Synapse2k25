// API base URL - change this to your backend URL
const API_BASE_URL = 'http://localhost:5000/api';

// Get assignment ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const assignmentId = urlParams.get('assignmentId');

// DOM elements
const assignmentDetails = document.getElementById('assignmentDetails');
const assignmentTitle = document.getElementById('assignmentTitle');
const courseName = document.getElementById('courseName');
const dueDate = document.getElementById('dueDate');
const maxPoints = document.getElementById('maxPoints');
const assignmentDescription = document.getElementById('assignmentDescription');
const submissionForm = document.getElementById('submissionForm');
const contentTextarea = document.getElementById('content');
const charCount = document.getElementById('charCount');
const fileInput = document.getElementById('file');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileIcon = document.getElementById('fileIcon');
const removeFileBtn = document.getElementById('removeFile');
const submissionSummary = document.getElementById('submissionSummary');
const summaryFile = document.getElementById('summaryFile');
const summaryNotes = document.getElementById('summaryNotes');
const submitBtn = document.getElementById('submitBtn');
const successModal = document.getElementById('successModal');
const submittedTime = document.getElementById('submittedTime');
const backToDashboard = document.getElementById('backToDashboard');

// Utility functions
const getToken = () => {
    return localStorage.getItem('token');
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

    // Insert message at the top of the form
    submissionForm.insertBefore(messageDiv, submissionForm.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return 'fa-file-image';
    if (fileType === 'application/pdf') return 'fa-file-pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'fa-file-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fa-file-excel';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'fa-file-powerpoint';
    if (fileType.startsWith('video/')) return 'fa-file-video';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'fa-file-archive';
    return 'fa-file';
};

const updateCharCount = () => {
    const count = contentTextarea.value.length;
    charCount.textContent = count;
    charCount.style.color = count > 4500 ? '#e74c3c' : count > 4000 ? '#f39c12' : '#666';
};

const updateSubmissionSummary = () => {
    const hasFile = fileInput.files.length > 0;
    const hasNotes = contentTextarea.value.trim().length > 0;

    if (hasFile || hasNotes) {
        submissionSummary.classList.remove('hidden');

        if (hasFile) {
            const file = fileInput.files[0];
            summaryFile.textContent = `${file.name} (${formatFileSize(file.size)})`;
        } else {
            summaryFile.textContent = 'No file selected';
        }

        if (hasNotes) {
            const noteLength = contentTextarea.value.trim().length;
            summaryNotes.textContent = `${noteLength} character${noteLength !== 1 ? 's' : ''}`;
        } else {
            summaryNotes.textContent = 'No additional notes';
        }
    } else {
        submissionSummary.classList.add('hidden');
    }
};

// Load assignment details
async function loadAssignmentDetails() {
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const assignment = result.data.assignment;

            assignmentTitle.textContent = assignment.title;
            courseName.textContent = assignment.course.title;
            dueDate.textContent = new Date(assignment.dueDate).toLocaleString();
            maxPoints.textContent = `${assignment.maxPoints} points`;
            assignmentDescription.textContent = assignment.description;

            assignmentDetails.classList.remove('hidden');
        } else {
            showMessage(result.message || 'Failed to load assignment details');
        }
    } catch (error) {
        console.error('Error loading assignment details:', error);
        showMessage('Failed to load assignment details');
    }
}

// Handle file selection
const handleFileSelect = (file) => {
    if (file) {
        const maxSize = 50 * 1024 * 1024; // 50MB

        if (file.size > maxSize) {
            showMessage('File size exceeds 50MB limit');
            fileInput.value = '';
            return;
        }

        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileIcon.className = `fas ${getFileIcon(file.type)}`;

        fileInfo.classList.remove('hidden');
        fileUploadArea.style.display = 'none';

        updateSubmissionSummary();
    }
};

// Remove selected file
const removeFile = () => {
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    fileUploadArea.style.display = 'block';
    updateSubmissionSummary();
};

// Handle form submission
async function handleSubmission(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('assignmentId', assignmentId);

    const content = contentTextarea.value.trim();
    if (content) {
        formData.append('content', content);
    }

    const file = fileInput.files[0];
    if (!file) {
        showMessage('Please select a file to upload');
        return;
    }

    formData.append('file', file);

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
        const response = await fetch(`${API_BASE_URL}/submissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            submittedTime.textContent = new Date().toLocaleString();
            successModal.classList.remove('hidden');
        } else {
            showMessage(result.message || 'Failed to submit assignment');
        }
    } catch (error) {
        console.error('Error submitting assignment:', error);
        showMessage('Failed to submit assignment');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Assignment';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    if (!assignmentId) {
        showMessage('Assignment ID is required');
        return;
    }

    if (!getToken()) {
        window.location.href = 'index.html';
        return;
    }

    loadAssignmentDetails();

    // File upload area click
    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop functionality
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('drag-over');
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('drag-over');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFileSelect(file);
    });

    // Remove file button
    removeFileBtn.addEventListener('click', removeFile);

    // Content textarea
    contentTextarea.addEventListener('input', () => {
        updateCharCount();
        updateSubmissionSummary();
    });

    // Form submission
    submissionForm.addEventListener('submit', handleSubmission);

    // Success modal
    backToDashboard.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});