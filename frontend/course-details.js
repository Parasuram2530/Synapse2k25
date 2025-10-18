// Course Details JavaScript
const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000/api"
  : `${window.location.origin}/api`;

// DOM elements
let courseData = null;

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

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Something went wrong');
        }

        return result;
    } catch (error) {
        console.log(`API call to ${endpoint} failed, returning demo data`);
        return getDemoDataForEndpoint(endpoint);
    }
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
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(messageDiv, container.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
};

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

// Load course details
async function loadCourseDetails() {
    try {
        // Get course data from localStorage
        const storedCourse = localStorage.getItem('selectedCourse');
        if (!storedCourse) {
            showMessage('No course selected', 'error');
            setTimeout(() => {
                window.location.href = 'student-dashboard.html';
            }, 2000);
            return;
        }

        courseData = JSON.parse(storedCourse);

        // Populate course header
        populateCourseHeader(courseData);

        // Populate course description
        populateCourseDescription(courseData);

        // Populate course info
        populateCourseInfo(courseData);

        // Populate additional info
        populateAdditionalInfo(courseData);

        // Setup action buttons
        setupActionButtons(courseData);

    } catch (error) {
        console.error('Error loading course details:', error);
        showMessage('Error loading course details', 'error');
    }
}

// Populate course header
function populateCourseHeader(course) {
    const headerElement = document.getElementById('courseHeader');
    headerElement.innerHTML = `
        <div class="course-title-section">
            <h1 class="course-title">${course.title}</h1>
            <div class="course-meta">
                <span class="course-category">
                    <i class="fas fa-graduation-cap"></i>
                    ${course.category || 'General Education'}
                </span>
                <span class="course-level">
                    <i class="fas fa-signal"></i>
                    ${course.level || 'Beginner to Advanced'}
                </span>
            </div>
        </div>
        <div class="course-stats">
            <div class="stat-item">
                <span class="stat-value">${course.enrolledStudents?.length || 0}</span>
                <span class="stat-label">Students</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${course.duration}</span>
                <span class="stat-label">Duration</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${course.language || 'English'}</span>
                <span class="stat-label">Language</span>
            </div>
        </div>
    `;
}

// Populate course description
function populateCourseDescription(course) {
    const descriptionElement = document.getElementById('courseDescription');
    descriptionElement.innerHTML = `
        <p class="course-summary">${course.description}</p>
        ${course.prerequisites ? `
            <div class="course-prerequisites">
                <h4>Prerequisites</h4>
                <p>${course.prerequisites}</p>
            </div>
        ` : ''}
        ${course.skills ? `
            <div class="course-skills">
                <h4>Skills You'll Learn</h4>
                <ul>
                    ${course.skills.map(skill => `<li>${skill}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
}

// Populate course info
function populateCourseInfo(course) {
    document.getElementById('courseDuration').textContent = course.duration;
    document.getElementById('courseTeacher').textContent = course.teacher?.name || 'TBA';
    document.getElementById('enrolledCount').textContent = `${course.enrolledStudents?.length || 0} students`;
    document.getElementById('courseCreated').textContent = new Date(course.createdAt).toLocaleDateString();
}

// Populate additional info
function populateAdditionalInfo(course) {
    // Timeline
    populateTimeline(course);

    // Objectives
    populateObjectives(course);

    // Requirements
    populateRequirements(course);

    // Materials
    populateMaterials(course);
}

// Populate timeline
function populateTimeline(course) {
    const timelineElement = document.getElementById('courseTimeline');

    // Default timeline if not provided
    const defaultTimeline = [
        { week: 1, title: 'Introduction and Setup', description: 'Course overview and initial setup' },
        { week: 2, title: 'Core Concepts', description: 'Fundamental concepts and principles' },
        { week: 3, title: 'Practical Application', description: 'Hands-on exercises and projects' },
        { week: 4, title: 'Advanced Topics', description: 'Advanced concepts and techniques' },
        { week: 5, title: 'Final Project', description: 'Capstone project and assessment' }
    ];

    const timeline = course.timeline || defaultTimeline;

    timelineElement.innerHTML = timeline.map((item, index) => `
        <div class="timeline-item">
            <div class="timeline-marker">
                <span class="timeline-week">Week ${item.week || (index + 1)}</span>
            </div>
            <div class="timeline-content">
                <h4>${item.title}</h4>
                <p>${item.description}</p>
            </div>
        </div>
    `).join('');
}

// Populate objectives
function populateObjectives(course) {
    const objectivesElement = document.getElementById('courseObjectives');

    const defaultObjectives = [
        'Understand fundamental concepts and principles',
        'Apply knowledge through practical exercises',
        'Develop problem-solving skills',
        'Work on real-world projects',
        'Receive feedback and improve'
    ];

    const objectives = course.objectives || defaultObjectives;

    objectivesElement.innerHTML = `
        <ul class="objectives-list">
            ${objectives.map(objective => `<li>${objective}</li>`).join('')}
        </ul>
    `;
}

// Populate requirements
function populateRequirements(course) {
    const requirementsElement = document.getElementById('courseRequirements');

    const defaultRequirements = [
        'Basic computer literacy',
        'Access to a computer with internet connection',
        'Commitment to weekly assignments',
        'Willingness to learn and participate'
    ];

    const requirements = course.requirements || defaultRequirements;

    requirementsElement.innerHTML = `
        <ul class="requirements-list">
            ${requirements.map(requirement => `<li>${requirement}</li>`).join('')}
        </ul>
    `;
}

// Populate materials
function populateMaterials(course) {
    const materialsElement = document.getElementById('courseMaterials');

    const defaultMaterials = [
        'Video lectures and presentations',
        'Reading materials and articles',
        'Interactive quizzes and exercises',
        'Discussion forums',
        'Project templates and resources'
    ];

    const materials = course.materials || defaultMaterials;

    materialsElement.innerHTML = `
        <ul class="materials-list">
            ${materials.map(material => `<li>${material}</li>`).join('')}
        </ul>
    `;
}

// Setup action buttons
function setupActionButtons(course) {
    const enrollBtn = document.getElementById('enrollBtn');
    const shareBtn = document.getElementById('shareBtn');

    // Check if user is already enrolled
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isEnrolled = course.enrolledStudents?.some(student => student._id === user.id);

    if (isEnrolled) {
        enrollBtn.textContent = 'Already Enrolled';
        enrollBtn.disabled = true;
        enrollBtn.classList.add('disabled');
    } else {
        enrollBtn.addEventListener('click', () => enrollInCourse(course._id));
    }

    shareBtn.addEventListener('click', () => shareCourse(course));
}

// Enroll in course
async function enrollInCourse(courseId) {
    try {
        const result = await apiCallWithAuth(`/courses/${courseId}/enroll`, {}, 'POST');

        if (result.success) {
            showMessage('Successfully enrolled in course!', 'success');

            // Update the course data in localStorage to reflect enrollment
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!courseData.enrolledStudents.some(student => student._id === user.id)) {
                courseData.enrolledStudents.push({
                    _id: user.id,
                    name: user.name,
                    email: user.email
                });
                localStorage.setItem('selectedCourse', JSON.stringify(courseData));
            }

            // Update button state
            document.getElementById('enrollBtn').textContent = 'Already Enrolled';
            document.getElementById('enrollBtn').disabled = true;
            document.getElementById('enrollBtn').classList.add('disabled');

            // Update enrolled count display
            document.getElementById('enrolledCount').textContent = `${courseData.enrolledStudents.length} students`;

            // Update dashboard data if user navigates back
            updateDashboardAfterEnrollment();
        } else {
            showMessage(result.message || 'Failed to enroll');
        }
    } catch (error) {
        console.error('Enroll error:', error);
        showMessage(error.message || 'Failed to enroll');
    }
}

// Update dashboard data after enrollment
function updateDashboardAfterEnrollment() {
    // Store enrollment update flag in localStorage
    localStorage.setItem('enrollmentUpdated', 'true');

    // Optionally redirect back to dashboard after a delay
    setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'Student') {
            window.location.href = 'student-dashboard.html';
        }
    }, 2000);
}

// Share course
function shareCourse(course) {
    const url = window.location.href;
    const title = `Check out this course: ${course.title}`;

    if (navigator.share) {
        navigator.share({
            title: title,
            text: course.description,
            url: url
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${title}\n\n${course.description}\n\n${url}`)
            .then(() => showMessage('Course link copied to clipboard!', 'success'))
            .catch(() => showMessage('Failed to copy link', 'error'));
    }
}

// Go back function
function goBack() {
    // Check user role and redirect accordingly
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'Student') {
        window.location.href = 'student-dashboard.html';
    } else if (user.role === 'Teacher') {
        window.location.href = 'teacher-dashboard.html';
    } else {
        window.location.href = 'index.html';
    }
}

// Demo data function
function getDemoDataForEndpoint(endpoint) {
    return {
        success: true,
        data: []
    };
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    loadCourseDetails();
});