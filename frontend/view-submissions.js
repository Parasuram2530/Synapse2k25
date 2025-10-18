// API base URL - change this to your backend URL
const API_BASE_URL = 'http://localhost:5000/api';

// Get assignment ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const assignmentId = urlParams.get('assignmentId');

// DOM elements
const assignmentInfo = document.getElementById('assignmentInfo');
const assignmentTitle = document.getElementById('assignmentTitle');
const courseName = document.getElementById('courseName');
const dueDate = document.getElementById('dueDate');
const maxPoints = document.getElementById('maxPoints');
const assignmentDescription = document.getElementById('assignmentDescription');
const submissionsList = document.getElementById('submissionsList');
const totalSubmissions = document.getElementById('totalSubmissions');
const gradedSubmissions = document.getElementById('gradedSubmissions');
const pendingSubmissions = document.getElementById('pendingSubmissions');
const gradingModal = document.getElementById('gradingModal');
const gradingForm = document.getElementById('gradingForm');
const loadingSpinner = document.getElementById('loadingSpinner');

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

const getToken = () => {
    return localStorage.getItem('token');
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

// Load assignment details
async function loadAssignmentDetails() {
    try {
        const result = await apiCallWithAuth(`/assignments/${assignmentId}`);
        const assignment = result.data.assignment;

        assignmentTitle.textContent = assignment.title;
        courseName.textContent = assignment.course.title;
        dueDate.textContent = new Date(assignment.dueDate).toLocaleString();
        maxPoints.textContent = assignment.maxPoints;
        assignmentDescription.innerHTML = `<p>${assignment.description}</p>`;

        if (assignment.submissionInstructions) {
            assignmentDescription.innerHTML += `<p><strong>Submission Instructions:</strong> ${assignment.submissionInstructions}</p>`;
        }

        assignmentInfo.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading assignment details:', error);
        showMessage('Error loading assignment details', 'error');
    }
}

// Load submissions
async function loadSubmissions() {
    try {
        loadingSpinner.classList.remove('hidden');
        const result = await apiCallWithAuth(`/submissions/assignment/${assignmentId}`);
        const submissions = result.data.submissions;

        displaySubmissions(submissions);
        updateSubmissionStats(submissions);
    } catch (error) {
        console.error('Error loading submissions:', error);
        showMessage('Error loading submissions', 'error');
        submissionsList.innerHTML = '<p>Failed to load submissions</p>';
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

// Display submissions
function displaySubmissions(submissions) {
    if (submissions.length === 0) {
        submissionsList.innerHTML = '<div class="no-submissions"><p>No submissions yet</p></div>';
        return;
    }

    submissionsList.innerHTML = submissions.map(submission => `
        <div class="submission-card ${submission.grade !== undefined ? 'graded' : 'pending'}">
            <div class="submission-header">
                <div class="student-info">
                    <h4>${submission.student.name}</h4>
                    <p class="student-email">${submission.student.email}</p>
                </div>
                <div class="submission-status">
                    ${submission.grade !== undefined ?
                        `<span class="status graded">Graded: ${submission.grade}/${submission.assignment.maxPoints}</span>` :
                        `<span class="status pending">Pending Grade</span>`
                    }
                </div>
            </div>

            <div class="submission-meta">
                <span class="meta-item">
                    <i class="fas fa-clock"></i>
                    Submitted: ${new Date(submission.submittedAt).toLocaleString()}
                </span>
                ${submission.fileName ? `
                    <span class="meta-item">
                        <i class="fas fa-file"></i>
                        File: ${submission.originalFileName} (${(submission.fileSize / 1024 / 1024).toFixed(2)} MB)
                    </span>
                ` : ''}
            </div>

            <div class="submission-content">
                <h5>Submission:</h5>
                <div class="content-text">
                    ${submission.content ? `<p>${submission.content}</p>` : '<p>No text content</p>'}
                </div>
                ${submission.fileName ? `
                    <div class="file-attachment">
                        <i class="fas fa-paperclip"></i>
                        <a href="${API_BASE_URL}/submissions/download/${submission._id}" target="_blank">
                            Download ${submission.originalFileName}
                        </a>
                    </div>
                ` : ''}
            </div>

            ${submission.feedback ? `
                <div class="submission-feedback">
                    <h5><i class="fas fa-comment"></i> Feedback:</h5>
                    <p>${submission.feedback}</p>
                </div>
            ` : ''}

            <div class="submission-actions">
                <button class="btn-primary grade-btn" data-submission-id="${submission._id}">
                    ${submission.grade !== undefined ? 'Update Grade' : 'Grade Submission'}
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners for grade buttons
    document.querySelectorAll('.grade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const submissionId = e.target.dataset.submissionId;
            openInlineGrading(submissionId, submissions);
        });
    });
}

// Update submission statistics
function updateSubmissionStats(submissions) {
    const total = submissions.length;
    const graded = submissions.filter(s => s.grade !== undefined).length;
    const pending = total - graded;

    totalSubmissions.textContent = total;
    gradedSubmissions.textContent = graded;
    pendingSubmissions.textContent = pending;
}

// Open inline grading section
function openInlineGrading(submissionId, submissions) {
    const submission = submissions.find(s => s._id === submissionId);

    if (submission) {
        // Populate student info
        document.getElementById('gradingStudentInfo').innerHTML = `
            <div class="student-info-card">
                <h4><i class="fas fa-user"></i> Student Information</h4>
                <div class="student-details">
                    <div class="detail-item">
                        <i class="fas fa-user"></i>
                        <span>${submission.student.name}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-envelope"></i>
                        <span>${submission.student.email}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar-check"></i>
                        <span>Submitted: ${new Date(submission.submittedAt).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;

        // Populate submission content
        document.getElementById('gradingSubmissionContent').innerHTML = `
            <div class="submission-content-card">
                <h4><i class="fas fa-file-alt"></i> Submission Content</h4>
                <div class="submission-text">
                    ${submission.content ? `<p>${submission.content.replace(/\n/g, '<br>')}</p>` : '<p class="no-content">No text content provided.</p>'}
                </div>
                ${submission.fileName ? `
                    <div class="submission-file">
                        <h5><i class="fas fa-paperclip"></i> Attached File</h5>
                        <div class="file-info">
                            <i class="fas ${getFileIcon(submission.fileType)}"></i>
                            <div class="file-details">
                                <a href="${API_BASE_URL.replace('/api', '')}/uploads/submissions/${submission.fileName}" target="_blank">
                                    ${submission.originalFileName || submission.fileName}
                                </a>
                                <span>${formatFileSize(submission.fileSize)}</span>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Set form values
        document.getElementById('inlineSubmissionId').value = submissionId;
        document.getElementById('inlineGrade').value = submission.grade || '';
        document.getElementById('inlineFeedback').value = submission.feedback || '';

        updateInlineCharCount();

        // Hide submissions list and show grading section
        document.getElementById('submissionsList').classList.add('hidden');
        document.getElementById('inlineGradingSection').classList.remove('hidden');

        // Scroll to grading section
        document.getElementById('inlineGradingSection').scrollIntoView({ behavior: 'smooth' });
    }
}

// Handle inline grading form submission
async function handleInlineGradingSubmission(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('inlineGradingForm').querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting Grade...';

    try {
        const formData = new FormData(document.getElementById('inlineGradingForm'));
        const submissionId = formData.get('submissionId');
        const grade = parseFloat(formData.get('grade'));

        // Validation
        if (grade < 1 || grade > 10) {
            showMessage('Grade must be between 1 and 10');
            return;
        }

        const data = {
            grade: grade,
            feedback: formData.get('feedback')
        };

        const result = await apiCallWithAuth(`/submissions/${submissionId}/grade`, data, 'PUT');

        if (result.success) {
            showMessage('Grade submitted successfully! Redirecting to dashboard...', 'success');

            // Redirect to dashboard after successful grading
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showMessage(result.message || 'Failed to submit grade');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to submit grade');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Cancel inline grading
function cancelInlineGrading() {
    document.getElementById('inlineGradingSection').classList.add('hidden');
    document.getElementById('submissionsList').classList.remove('hidden');
    document.getElementById('inlineGradingForm').reset();
}

// Update character count for inline feedback
function updateInlineCharCount() {
    const feedbackTextarea = document.getElementById('inlineFeedback');
    const charCount = document.getElementById('inlineFeedbackCharCount');
    const count = feedbackTextarea.value.length;
    charCount.textContent = count;
    charCount.style.color = count > 450 ? '#e74c3c' : count > 400 ? '#f39c12' : '#666';
}

// Check authentication
function checkAuth() {
    const token = getToken();
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const userData = JSON.parse(user);
        if (userData.role !== 'Teacher') {
            showMessage('Only teachers can view submissions', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
    } catch (error) {
        window.location.href = 'index.html';
        return;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    if (!assignmentId) {
        showMessage('Assignment ID is required', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    checkAuth();
    loadAssignmentDetails();
    loadSubmissions();

    // Event listeners
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            gradingModal.classList.add('hidden');
        });
    });

    // Inline grading form
    const inlineGradingForm = document.getElementById('inlineGradingForm');
    if (inlineGradingForm) {
        inlineGradingForm.addEventListener('submit', handleInlineGradingSubmission);
    }

    // Cancel inline grading
    const cancelBtn = document.getElementById('cancelInlineGrading');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelInlineGrading);
    }

    // Feedback character count
    const feedbackTextarea = document.getElementById('inlineFeedback');
    if (feedbackTextarea) {
        feedbackTextarea.addEventListener('input', updateInlineCharCount);
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === gradingModal) {
            gradingModal.classList.add('hidden');
        }
    });
});