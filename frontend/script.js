// API base URL - change this to your backend URL
const API_BASE_URL = 'http://localhost:5000/api';

// Course-related DOM elements - will be set up after DOM loads
let teacherDashboard, studentDashboard, createCourseBtn, courseModal, courseForm, closeModal, coursesContainer, enrolledCoursesContainer, teacherCourses;
let courseSearchInput, courseSearchBtn;
let teacherCourseSearchInput, teacherCourseSearchBtn;
let allCourses = []; // Store all courses for search functionality
let allTeacherCourses = []; // Store all teacher courses for search functionality

// Assignment-related DOM elements
let createAssignmentBtn, assignmentModal, assignmentForm, submissionModal, submissionForm, gradingModal, gradingForm;
let assignmentsContainer, submissionsContainer, courseAssignmentsContainer, assignmentSubmissionsContainer;

// Grade-related DOM elements
let courseGradesContainer, myGradesContainer;

// Advanced features DOM elements
let uploadMaterialBtn, materialModal, materialForm, createDiscussionBtn, discussionModal, discussionForm, replyModal, replyForm;
let notificationsBtn, notificationsModal, courseMaterialsContainer, courseDiscussionsContainer, notificationBadge;

// DOM elements
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const dashboard = document.getElementById('dashboard');
const authContainer = document.querySelector('.auth-container');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const userMenuBtn = document.getElementById('userMenuBtn');
const userDropdown = document.getElementById('userDropdown');
const profileLink = document.getElementById('profileLink');
const settingsLink = document.getElementById('settingsLink');
const dashboardProfilePic = document.getElementById('dashboardProfilePic');
const defaultAvatar = document.getElementById('defaultAvatar');
const changePhotoBtn = document.getElementById('changePhotoBtn');
const avatarUploadInput = document.getElementById('avatarUploadInput');

// Tab switching
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
});

registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
});

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

    // Insert message at the top of the active form
    const activeForm = document.querySelector('.form-container.active');
    activeForm.insertBefore(messageDiv, activeForm.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
};

const setLoading = (button, loading = true) => {
    if (loading) {
        button.disabled = true;
        button.textContent = 'Loading...';
    } else {
        button.disabled = false;
        button.textContent = button === logoutBtn ? 'Logout' : (button.closest('#loginForm') ? 'Login' : 'Register');
    }
};

const saveToken = (token) => {
    localStorage.setItem('token', token);
};

const getToken = () => {
    return localStorage.getItem('token');
};

const removeToken = () => {
    localStorage.removeItem('token');
};

const showDashboard = (user) => {
    // Store user data in localStorage for later use
    localStorage.setItem('user', JSON.stringify(user));

    // Hide auth section and show dashboard
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.main-nav').style.display = 'none';
    dashboard.classList.remove('hidden');

    // Update welcome message with user data
    updateWelcomeMessage(user);

    // Get DOM elements after dashboard is shown
    teacherDashboard = document.getElementById('teacherDashboard');
    studentDashboard = document.getElementById('studentDashboard');
    coursesContainer = document.getElementById('coursesContainer');
    enrolledCoursesContainer = document.getElementById('enrolledCoursesContainer');
    teacherCourses = document.getElementById('teacherCourses');

    // Search elements
    courseSearchInput = document.getElementById('courseSearchInput');
    courseSearchBtn = document.getElementById('courseSearchBtn');

    // Teacher course search elements
    teacherCourseSearchInput = document.getElementById('teacherCourseSearchInput');
    teacherCourseSearchBtn = document.getElementById('teacherCourseSearchBtn');

    // Assignment-related elements
    createAssignmentBtn = document.getElementById('createAssignmentBtn');
    assignmentModal = document.getElementById('assignmentModal');
    assignmentForm = document.getElementById('assignmentForm');
    submissionModal = document.getElementById('submissionModal');
    submissionForm = document.getElementById('submissionForm');
    gradingModal = document.getElementById('gradingModal');
    gradingForm = document.getElementById('gradingForm');
    assignmentsContainer = document.getElementById('assignmentsContainer');
    submissionsContainer = document.getElementById('submissionsContainer');
    courseAssignmentsContainer = document.getElementById('courseAssignmentsContainer');
    assignmentSubmissionsContainer = document.getElementById('assignmentSubmissionsContainer');
    gradedAssignmentsContainer = document.getElementById('gradedAssignmentsContainer');

    // Grade-related elements
    courseGradesContainer = document.getElementById('courseGradesContainer');
    myGradesContainer = document.getElementById('myGradesContainer');

    // Advanced features elements
    uploadMaterialBtn = document.getElementById('uploadMaterialBtn');
    materialModal = document.getElementById('materialModal');
    materialForm = document.getElementById('materialForm');
    createDiscussionBtn = document.getElementById('createDiscussionBtn');
    discussionModal = document.getElementById('discussionModal');
    discussionForm = document.getElementById('discussionForm');
    replyModal = document.getElementById('replyModal');
    replyForm = document.getElementById('replyForm');
    notificationsBtn = document.getElementById('notificationsBtn');
    notificationsModal = document.getElementById('notificationsModal');
    courseMaterialsContainer = document.getElementById('courseMaterialsContainer');
    courseDiscussionsContainer = document.getElementById('courseDiscussionsContainer');
    notificationBadge = document.getElementById('notificationBadge');

    // Update profile picture display if user has one
    updateProfilePictureDisplay(user);

    // Update sidebar visibility based on role
    const teacherActions = document.getElementById('teacherActions');
    const studentActions = document.getElementById('studentActions');

    // Load real data based on role
    if (user.role === 'Teacher') {
        teacherActions.classList.remove('hidden');
        studentActions.classList.add('hidden');
        teacherDashboard.classList.remove('hidden');
        studentDashboard.classList.add('hidden');

        // Redirect to dedicated teacher dashboard
        window.location.href = 'teacher-dashboard.html';
    } else {
        // Redirect to dedicated student dashboard
        window.location.href = 'student-dashboard.html';
    }
};

const showAuth = () => {
    dashboard.classList.add('hidden');
    document.querySelector('.hero').style.display = 'block';
    document.querySelector('.main-nav').style.display = 'block';
    loginTab.click(); // Show login form by default
};

const logout = () => {
    removeToken();
    localStorage.removeItem('user');
    showAuth();
};

// Check if user is logged in on page load
const checkAuth = () => {
    const token = getToken();
    const user = localStorage.getItem('user');

    if (token && user) {
        try {
            const userData = JSON.parse(user);
            // Validate token by making a quick API call
            validateTokenAndShowDashboard(userData);
        } catch (error) {
            // If user data is corrupted, clear it
            console.error('User data corrupted:', error);
            removeToken();
            localStorage.removeItem('user');
        }
    }
};

// Validate token and show dashboard
async function validateTokenAndShowDashboard(userData) {
    try {
        // Make a quick API call to validate the token
        const result = await apiCallWithAuth('/auth/validate', {}, 'GET');
        if (result.success) {
            showDashboard(userData);
        } else {
            // Token is invalid, logout
            console.warn('Token validation failed, logging out');
            logout();
        }
    } catch (error) {
        console.error('Token validation error:', error);
        // If validation fails, try to show dashboard anyway (might be network issue)
        // But clear any cached data that might be stale
        showDashboard(userData);
    }
}

// API calls
const apiCall = async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
    }

    return result;
};

// API call with authentication
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

// Form handlers
loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = loginFormElement.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(loginFormElement);
        const data = Object.fromEntries(formData);

        const result = await apiCall('/auth/login', data);

        if (result.success) {
            saveToken(result.data.token);
            const user = result.data.user;
            showDashboard(user);
            showMessage('Login successful!', 'success');
        } else {
            showMessage(result.message || 'Login failed');
        }
    } catch (error) {
        showMessage(error.message || 'Login failed');
    } finally {
        setLoading(submitBtn, false);
    }
});

registerFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = registerFormElement.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(registerFormElement);
        const data = Object.fromEntries(formData);

        const result = await apiCall('/auth/register', data);

        if (result.success) {
            saveToken(result.data.token);
            showDashboard(result.data.user);
            showMessage('Registration successful!', 'success');
        } else {
            showMessage(result.message || 'Registration failed');
        }
    } catch (error) {
        showMessage(error.message || 'Registration failed');
    } finally {
        setLoading(submitBtn, false);
    }
});

// User menu functionality - hover effect with click outside support
const userAvatar = document.querySelector('.user-avatar');
if (userAvatar && userDropdown) {
    // Hover functionality
    userAvatar.addEventListener('mouseenter', () => {
        userDropdown.classList.remove('hidden');
    });

    userAvatar.addEventListener('mouseleave', () => {
        // Use setTimeout to allow mouse to move to dropdown
        setTimeout(() => {
            if (!userDropdown.matches(':hover')) {
                userDropdown.classList.add('hidden');
            }
        }, 100);
    });

    userDropdown.addEventListener('mouseleave', () => {
        userDropdown.classList.add('hidden');
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
        if (!userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.add('hidden');
        }
    });
}

// Profile link handler
if (profileLink) {
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        userDropdown.classList.add('hidden');
        window.location.href = 'profile.html';
    });
}

// Settings link handler
if (settingsLink) {
    settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        userDropdown.classList.add('hidden');
        window.location.href = 'settings.html';
    });
}


// Avatar menu functionality
function setupAvatarMenu() {
    if (avatarUploadInput) {
        avatarUploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await handleAvatarUpload(file);
            }
        });
    }
}

// Handle avatar upload
async function handleAvatarUpload(file) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showMessage('Please select a valid image file (JPEG, PNG, GIF, WebP)', 'error');
        return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('File size must be less than 5MB', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('profilePicture', file);

        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showMessage('Profile picture updated successfully!', 'success');

            // Update local storage and UI
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...currentUser, ...result.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Update dashboard avatar display
            updateProfilePictureDisplay(updatedUser);

            // Close dropdown after successful upload
            userDropdown.classList.add('hidden');
        } else {
            showMessage(result.message || 'Failed to update profile picture', 'error');
        }
    } catch (error) {
        console.error('Error updating profile picture:', error);
        showMessage('Error updating profile picture', 'error');
    }
}

// Update welcome message with user data
function updateWelcomeMessage(user) {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');

    if (welcomeMessage && userNameElement && userRoleElement && user) {
        // Set username in welcome message
        userNameElement.textContent = user.name;

        // Set user role
        userRoleElement.textContent = user.role;

        // Add a subtle animation delay for better UX
        setTimeout(() => {
            welcomeMessage.style.opacity = '1';
        }, 100);
    }
}

// Update profile picture display in dashboard
function updateProfilePictureDisplay(user) {
    const dashboardProfilePic = document.getElementById('dashboardProfilePic');
    const defaultAvatar = document.getElementById('defaultAvatar');

    if (dashboardProfilePic && defaultAvatar) {
        if (user && user.profilePicture) {
            dashboardProfilePic.src = `http://localhost:5000/uploads/profiles/${user.profilePicture}`;
            dashboardProfilePic.style.display = 'block';
            defaultAvatar.style.display = 'none';
            console.log('Profile picture displayed:', dashboardProfilePic.src);
        } else {
            dashboardProfilePic.src = '';
            dashboardProfilePic.style.display = 'none';
            defaultAvatar.style.display = 'block';
            console.log('Default avatar displayed');
        }
    } else {
        console.error('Dashboard profile picture elements not found');
    }
}

// Logout functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

// Course-related event listeners - moved to after DOM content loaded
function setupCourseEventListeners() {
    // Get DOM elements after dashboard is shown
    createCourseBtn = document.getElementById('createCourseBtn');
    courseModal = document.getElementById('courseModal');
    courseForm = document.getElementById('courseForm');
    closeModal = document.querySelector('.close');

    console.log('Setting up course event listeners...');
    console.log('createCourseBtn:', createCourseBtn);
    console.log('courseModal:', courseModal);
    console.log('courseForm:', courseForm);
    console.log('closeModal:', closeModal);

    if (createCourseBtn) {
        createCourseBtn.addEventListener('click', (e) => {
            console.log('Create course button clicked!');
            e.preventDefault();
            window.location.href = 'create-course.html';
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            console.log('Close modal clicked!');
            if (courseModal) {
                courseModal.classList.add('hidden');
            }
        });
    }

    if (courseForm) {
        courseForm.addEventListener('submit', handleCourseCreation);
    }
}

// Update sidebar link event listeners to navigate to pages
function setupSidebarNavigation() {
    // Get sidebar links
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const linkId = link.getAttribute('id');

            // Handle navigation based on link ID
            switch (linkId) {
                case 'createCourseBtn':
                    window.location.href = 'create-course.html';
                    break;
                case 'createAssignmentBtn':
                    window.location.href = 'create-assignment.html';
                    break;
                case 'uploadMaterialBtn':
                    window.location.href = 'upload-material.html';
                    break;
                case 'createDiscussionBtn':
                    window.location.href = 'create-discussion.html';
                    break;
                case 'notificationsBtn':
                    window.location.href = 'notifications.html';
                    break;
                default:
                    // For any other links, use the href attribute
                    const href = link.getAttribute('href');
                    if (href && href !== '#') {
                        window.location.href = href;
                    }
                    break;
            }
        });
    });
}

// Assignment-related event listeners
function setupAssignmentEventListeners() {
    console.log('Setting up assignment event listeners...');

    // Create assignment button
    if (createAssignmentBtn) {
        createAssignmentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'create-assignment.html';
        });
    }

    // Assignment form submission
    if (assignmentForm) {
        assignmentForm.addEventListener('submit', handleAssignmentCreation);
    }

    // Submission form
    if (submissionForm) {
        submissionForm.addEventListener('submit', handleAssignmentSubmission);
    }

    // Grading form
    if (gradingForm) {
        gradingForm.addEventListener('submit', handleGradingSubmission);
    }

    // Close modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            assignmentModal?.classList.add('hidden');
            submissionModal?.classList.add('hidden');
            gradingModal?.classList.add('hidden');
            materialModal?.classList.add('hidden');
            discussionModal?.classList.add('hidden');
            replyModal?.classList.add('hidden');
            notificationsModal?.classList.add('hidden');
        });
    });

    // Advanced features event listeners
    if (uploadMaterialBtn) {
        uploadMaterialBtn.addEventListener('click', () => {
            window.location.href = 'upload-material.html';
        });
    }

    if (createDiscussionBtn) {
        createDiscussionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'create-discussion.html';
        });
    }

    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', () => {
            window.location.href = 'notifications.html';
        });
    }

    // Material form
    if (materialForm) {
        materialForm.addEventListener('submit', handleMaterialUpload);
    }

    // Discussion form
    if (discussionForm) {
        discussionForm.addEventListener('submit', handleDiscussionCreation);
    }

    // Reply form
    if (replyForm) {
        replyForm.addEventListener('submit', handleReplySubmission);
    }
}




async function loadAvailableCourses() {
    try {
        const result = await apiCallWithAuth('/courses');
        if (result.success) {
            allCourses = result.data.courses; // Store original courses data
            displayCourses(allCourses, coursesContainer, true);
        } else {
            console.error('Error loading courses:', result.message);
            coursesContainer.innerHTML = '<p>Failed to load courses</p>';
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        coursesContainer.innerHTML = '<p>Failed to load courses</p>';
    }
}

async function loadEnrolledCourses() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            displayCourses(result.data.courses, enrolledCoursesContainer, false);
        } else {
            console.error('Error loading enrolled courses:', result.message);
            enrolledCoursesContainer.innerHTML = '<p>Failed to load enrolled courses</p>';
        }
    } catch (error) {
        console.error('Error loading enrolled courses:', error);
        enrolledCoursesContainer.innerHTML = '<p>Failed to load enrolled courses</p>';
    }
}

async function loadTeacherCourses(teacherId) {
    try {
        const result = await apiCallWithAuth(`/courses/teacher/${teacherId}`);
        if (result.success) {
            allTeacherCourses = result.data.courses; // Store original courses data
            displayCourses(allTeacherCourses, teacherCourses, false, true);
        } else {
            console.error('Error loading teacher courses:', result.message);
            teacherCourses.innerHTML = '<p>Failed to load your courses</p>';
        }
    } catch (error) {
        console.error('Error loading teacher courses:', error);
        teacherCourses.innerHTML = '<p>Failed to load your courses</p>';
    }
}

function displayCourses(courses, container, showEnrollButton = false, showEnrolledStudents = false) {
    if (courses.length === 0) {
        container.innerHTML = '<p>No courses available</p>';
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="course-card">
            <div class="course-divider">──────────────────────────────</div>

            <div class="course-title-line">
                <span class="course-emoji">📘</span>
                <span class="course-title-text">${course.title}</span>
            </div>

            <div class="course-description-line">
                <span class="course-emoji">📝</span>
                <span class="course-description-text">${course.description.length > 100 ? course.description.substring(0, 100) + '...' : course.description}</span>
            </div>

            <div class="course-info-line">
                <span class="course-emoji">⏱️</span>
                <span class="course-info-label">Duration:</span>
                <span class="course-info-value">${course.duration}</span>
            </div>

            <div class="course-info-line">
                <span class="course-emoji">👩‍🏫</span>
                <span class="course-info-label">Teacher:</span>
                <span class="course-info-value">${course.teacher.name}</span>
            </div>

            <div class="course-info-line">
                <span class="course-emoji">👥</span>
                <span class="course-info-label">Enrolled:</span>
                <span class="course-info-value">${course.enrolledStudents.length} ${course.enrolledStudents.length === 1 ? 'student' : 'students'}</span>
            </div>

            <div class="course-info-line">
                <span class="course-emoji">🗓️</span>
                <span class="course-info-label">Created:</span>
                <span class="course-info-value">${new Date(course.createdAt).toLocaleDateString()}</span>
            </div>

            ${showEnrollButton ? `
                <div class="course-enroll-line">
                    <button class="btn-primary enroll-btn" data-course-id="${course._id}">
                        <span class="enroll-emoji">🎓</span>
                        <span class="enroll-text">Enroll</span>
                    </button>
                </div>
            ` : ''}

            <div class="course-divider">──────────────────────────────</div>

            ${showEnrolledStudents ? `
                <div class="enrolled-students">
                    <h6>👥 Enrolled Students:</h6>
                    ${course.enrolledStudents.length > 0 ? `
                        <ul>
                            ${course.enrolledStudents.map(student => `<li>${student.name} (${student.email})</li>`).join('')}
                        </ul>
                    ` : '<p>No students enrolled yet.</p>'}
                </div>
            ` : ''}
        </div>
    `).join('');

    // Add event listeners for enroll buttons
    if (showEnrollButton) {
        container.querySelectorAll('.enroll-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = e.target.dataset.courseId;
                enrollInCourse(courseId);
            });
        });
    }
}

async function handleCourseCreation(e) {
    e.preventDefault();

    const submitBtn = courseForm.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(courseForm);
        const data = Object.fromEntries(formData);

        const result = await apiCallWithAuth('/courses', data, 'POST');

        if (result.success) {
            showMessage('Course created successfully!', 'success');
            courseModal.classList.add('hidden');
            courseForm.reset();
            // Reload teacher courses
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                loadTeacherCourses(user.id);
            }
        } else {
            showMessage(result.message || 'Failed to create course');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to create course');
    } finally {
        setLoading(submitBtn, false);
    }
}

async function enrollInCourse(courseId) {
    try {
        const result = await apiCallWithAuth(`/courses/${courseId}/enroll`, {}, 'POST');

        if (result.success) {
            showMessage('Successfully enrolled in course!', 'success');
            loadAvailableCourses();
            loadEnrolledCourses();
        } else {
            showMessage(result.message || 'Failed to enroll');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to enroll');
    }
}

// Assignment-related functions
async function loadTeacherCoursesForAssignment() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
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
        console.error('Error loading courses for assignment:', error);
    }
}

async function loadStudentAssignments() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            const enrolledCourses = result.data.courses;

            // Get assignments for all enrolled courses
            const allAssignments = [];
            for (const course of enrolledCourses) {
                try {
                    const assignmentResult = await apiCallWithAuth(`/assignments/course/${course._id}`);
                    if (assignmentResult.success) {
                        allAssignments.push(...assignmentResult.data.assignments);
                    }
                } catch (error) {
                    console.error(`Error loading assignments for course ${course._id}:`, error);
                }
            }

            // Separate completed and pending assignments
            const completedAssignments = [];
            const pendingAssignments = [];

            for (const assignment of allAssignments) {
                try {
                    const submissionResult = await apiCallWithAuth(`/submissions/assignment/${assignment._id}/student`);
                    if (submissionResult.success && submissionResult.data.submission && submissionResult.data.submission.grade !== undefined) {
                        completedAssignments.push(assignment);
                    } else {
                        pendingAssignments.push(assignment);
                    }
                } catch (error) {
                    // If no submission or error, consider it pending
                    pendingAssignments.push(assignment);
                }
            }

            displayAssignments(pendingAssignments, assignmentsContainer, true);
        } else {
            console.error('Error loading enrolled courses:', result.message);
            assignmentsContainer.innerHTML = '<p>Failed to load assignments</p>';
        }
    } catch (error) {
        console.error('Error loading student assignments:', error);
        assignmentsContainer.innerHTML = '<p>Failed to load assignments</p>';
    }
}

// Load completed assignments for students
async function loadCompletedAssignments() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            const enrolledCourses = result.data.courses;

            // Get assignments for all enrolled courses
            const allAssignments = [];
            for (const course of enrolledCourses) {
                try {
                    const assignmentResult = await apiCallWithAuth(`/assignments/course/${course._id}`);
                    if (assignmentResult.success) {
                        allAssignments.push(...assignmentResult.data.assignments);
                    }
                } catch (error) {
                    console.error(`Error loading assignments for course ${course._id}:`, error);
                }
            }

            // Filter completed assignments
            const completedAssignments = [];
            for (const assignment of allAssignments) {
                try {
                    const submissionResult = await apiCallWithAuth(`/submissions/assignment/${assignment._id}/student`);
                    if (submissionResult.success && submissionResult.data.submission && submissionResult.data.submission.grade !== undefined) {
                        completedAssignments.push(assignment);
                    }
                } catch (error) {
                    // Continue if no submission
                }
            }

            // Create or find completed assignments container
            let completedContainer = document.getElementById('completedAssignmentsContainer');
            if (!completedContainer) {
                // Create a new section for completed assignments
                const studentDashboard = document.getElementById('studentDashboard');
                const completedSection = document.createElement('div');
                completedSection.className = 'dashboard-card';
                completedSection.innerHTML = `
                    <div class="card-header">
                        <h3><i class="fas fa-check-circle"></i> Completed Assignments</h3>
                    </div>
                    <div id="completedAssignmentsContainer" class="card-content"></div>
                `;
                studentDashboard.appendChild(completedSection);
                completedContainer = document.getElementById('completedAssignmentsContainer');
            }

            displayAssignments(completedAssignments, completedContainer, false, false, true);
        } else {
            console.error('Error loading enrolled courses:', result.message);
        }
    } catch (error) {
        console.error('Error loading completed assignments:', error);
    }
}

async function loadStudentSubmissions() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            const enrolledCourses = result.data.courses;

            // Get submissions for all enrolled courses
            const allSubmissions = [];
            for (const course of enrolledCourses) {
                try {
                    const submissionResult = await apiCallWithAuth(`/submissions/course/${course._id}`);
                    if (submissionResult.success) {
                        allSubmissions.push(...submissionResult.data.submissions);
                    }
                } catch (error) {
                    console.error(`Error loading submissions for course ${course._id}:`, error);
                }
            }

            displaySubmissions(allSubmissions, submissionsContainer, false);
        } else {
            console.error('Error loading enrolled courses:', result.message);
            submissionsContainer.innerHTML = '<p>Failed to load submissions</p>';
        }
    } catch (error) {
        console.error('Error loading student submissions:', error);
        submissionsContainer.innerHTML = '<p>Failed to load submissions</p>';
    }
}

async function loadTeacherAssignments() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const result = await apiCallWithAuth(`/courses/teacher/${user.id}`);
        if (result.success) {
            const teacherCourses = result.data.courses;

            // Get assignments for all teacher courses
            const allAssignments = [];
            for (const course of teacherCourses) {
                try {
                    const assignmentResult = await apiCallWithAuth(`/assignments/course/${course._id}`);
                    if (assignmentResult.success) {
                        allAssignments.push(...assignmentResult.data.assignments);
                    }
                } catch (error) {
                    console.error(`Error loading assignments for course ${course._id}:`, error);
                }
            }

            // Filter out assignments that have graded submissions
            const pendingAssignments = [];
            for (const assignment of allAssignments) {
                try {
                    const submissionResult = await apiCallWithAuth(`/submissions/assignment/${assignment._id}`);
                    if (submissionResult.success) {
                        const submissions = submissionResult.data.submissions;
                        const hasGradedSubmissions = submissions.some(sub => sub.grade !== undefined);

                        // Only include assignments that don't have any graded submissions
                        if (!hasGradedSubmissions) {
                            pendingAssignments.push(assignment);
                        }
                    } else {
                        // If we can't check submissions, include the assignment (assume it's pending)
                        pendingAssignments.push(assignment);
                    }
                } catch (error) {
                    // If we can't check submissions, include the assignment (assume it's pending)
                    pendingAssignments.push(assignment);
                    console.error(`Error checking submissions for assignment ${assignment._id}:`, error);
                }
            }

            displayAssignments(pendingAssignments, courseAssignmentsContainer, false, true);
        } else {
            console.error('Error loading teacher courses:', result.message);
            courseAssignmentsContainer.innerHTML = '<p>Failed to load assignments</p>';
        }
    } catch (error) {
        console.error('Error loading teacher assignments:', error);
        courseAssignmentsContainer.innerHTML = '<p>Failed to load assignments</p>';
    }
}

async function loadGradedAssignments(teacherId) {
    try {
        const result = await apiCallWithAuth(`/courses/teacher/${teacherId}`);
        if (result.success) {
            const teacherCourses = result.data.courses;

            // Get assignments for all teacher courses
            const allAssignments = [];
            for (const course of teacherCourses) {
                try {
                    const assignmentResult = await apiCallWithAuth(`/assignments/course/${course._id}`);
                    if (assignmentResult.success) {
                        allAssignments.push(...assignmentResult.data.assignments);
                    }
                } catch (error) {
                    console.error(`Error loading assignments for course ${course._id}:`, error);
                }
            }

            // Filter assignments that have graded submissions
            const gradedAssignments = [];
            for (const assignment of allAssignments) {
                try {
                    const submissionResult = await apiCallWithAuth(`/submissions/assignment/${assignment._id}`);
                    if (submissionResult.success) {
                        const submissions = submissionResult.data.submissions;
                        const hasGradedSubmissions = submissions.some(sub => sub.grade !== undefined);

                        if (hasGradedSubmissions) {
                            // Add grading statistics to the assignment
                            assignment.gradedCount = submissions.filter(sub => sub.grade !== undefined).length;
                            assignment.totalCount = submissions.length;
                            gradedAssignments.push(assignment);
                        }
                    }
                } catch (error) {
                    console.error(`Error checking submissions for assignment ${assignment._id}:`, error);
                }
            }

            displayGradedAssignments(gradedAssignments, gradedAssignmentsContainer);
        } else {
            console.error('Error loading teacher courses:', result.message);
            gradedAssignmentsContainer.innerHTML = '<p>Failed to load graded assignments</p>';
        }
    } catch (error) {
        console.error('Error loading graded assignments:', error);
        gradedAssignmentsContainer.innerHTML = '<p>Failed to load graded assignments</p>';
    }
}

function displayAssignments(assignments, container, showSubmitButton = false, showViewSubmissionsButton = false, isCompletedSection = false) {
    if (assignments.length === 0) {
        container.innerHTML = isCompletedSection ? '<p>No completed assignments yet</p>' : '<p>No assignments available</p>';
        return;
    }

    container.innerHTML = assignments.map(assignment => `
        <div class="assignment-card ${isCompletedSection ? 'completed' : ''}">
            <h5>${assignment.title}</h5>
            <p>${assignment.description}</p>
            <p><strong>Course:</strong> ${assignment.course.title}</p>
            <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleString()}</p>
            <p><strong>Max Points:</strong> ${assignment.maxPoints}</p>
            <div class="assignment-meta">
                Created: ${new Date(assignment.createdAt).toLocaleDateString()}
                ${isCompletedSection ? '<span class="completed-badge"><i class="fas fa-check-circle"></i> Completed</span>' : ''}
            </div>
            ${showSubmitButton ? `<button class="btn-primary submit-btn" data-assignment-id="${assignment._id}">Submit Assignment</button>` : ''}
            ${showViewSubmissionsButton ? `<button class="btn-secondary view-submissions-btn" data-assignment-id="${assignment._id}">View Submissions</button>` : ''}
        </div>
    `).join('');

    // Add event listeners
    if (showSubmitButton) {
        container.querySelectorAll('.submit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assignmentId = e.target.dataset.assignmentId;
                window.location.href = `submit-assignment.html?assignmentId=${assignmentId}`;
            });
        });
    }

    if (showViewSubmissionsButton) {
        container.querySelectorAll('.view-submissions-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assignmentId = e.target.dataset.assignmentId;
                window.location.href = `view-submissions.html?assignmentId=${assignmentId}`;
            });
        });
    }
}

function displayGradedAssignments(assignments, container) {
    if (assignments.length === 0) {
        container.innerHTML = '<p>No graded assignments yet</p>';
        return;
    }

    container.innerHTML = assignments.map(assignment => `
        <div class="assignment-card graded">
            <div class="graded-badge">
                <i class="fas fa-check-circle"></i>
                <span>Graded</span>
            </div>
            <h5>${assignment.title}</h5>
            <p>${assignment.description}</p>
            <p><strong>Course:</strong> ${assignment.course.title}</p>
            <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleString()}</p>
            <div class="grading-stats">
                <span class="stat-item">
                    <i class="fas fa-users"></i>
                    ${assignment.gradedCount}/${assignment.totalCount} graded
                </span>
            </div>
            <div class="assignment-meta">
                Created: ${new Date(assignment.createdAt).toLocaleDateString()}
            </div>
            <button class="btn-secondary view-submissions-btn" data-assignment-id="${assignment._id}">
                <i class="fas fa-eye"></i> View Submissions
            </button>
        </div>
    `).join('');

    // Add event listeners
    container.querySelectorAll('.view-submissions-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const assignmentId = e.target.dataset.assignmentId;
            window.location.href = `view-submissions.html?assignmentId=${assignmentId}`;
        });
    });
}

function displaySubmissions(submissions, container, showGradeButton = false) {
    if (submissions.length === 0) {
        container.innerHTML = '<p>No submissions yet</p>';
        return;
    }

    container.innerHTML = submissions.map(submission => `
        <div class="submission-card">
            <h5>${submission.assignment.title}</h5>
            <p><strong>Student:</strong> ${submission.student.name} (${submission.student.email})</p>
            <p><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleString()}</p>
            <p><strong>Status:</strong> ${submission.grade !== undefined ? `Graded (${submission.grade}/${submission.assignment.maxPoints})` : 'Pending Grade'}</p>
            ${submission.feedback ? `<p><strong>Feedback:</strong> ${submission.feedback}</p>` : ''}
            <div class="submission-content">
                <strong>Submission:</strong>
                <p>${submission.content}</p>
                ${submission.fileName ? `<p><strong>File:</strong> ${submission.originalFileName} (${(submission.fileSize / 1024 / 1024).toFixed(2)} MB)</p>` : ''}
            </div>
            ${showGradeButton ? `<button class="btn-primary grade-btn" data-submission-id="${submission._id}">Grade Submission</button>` : ''}
        </div>
    `).join('');

    // Add event listeners for grading
    if (showGradeButton) {
        container.querySelectorAll('.grade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const submissionId = e.target.dataset.submissionId;
                openGradingModal(submissionId);
            });
        });
    }
}

async function openSubmissionModal(assignmentId) {
    try {
        const result = await apiCallWithAuth(`/assignments/${assignmentId}`);
        const assignment = result.data.assignment;

        document.getElementById('submissionModalTitle').textContent = `Submit: ${assignment.title}`;
        document.getElementById('assignmentDetails').innerHTML = `
            <p><strong>Description:</strong> ${assignment.description}</p>
            <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleString()}</p>
            <p><strong>Max Points:</strong> ${assignment.maxPoints}</p>
        `;
        document.getElementById('submissionAssignmentId').value = assignmentId;

        submissionModal.classList.remove('hidden');
    } catch (error) {
        showMessage('Error loading assignment details', 'error');
    }
}

async function openGradingModal(submissionId) {
    try {
        // For now, we'll need to get submission details from the submissions list
        // In a real app, you'd have an endpoint to get a single submission
        const submissions = await getSubmissionsFromContainer();
        const submission = submissions.find(s => s._id === submissionId);

        if (submission) {
            document.getElementById('gradingDetails').innerHTML = `
                <p><strong>Student:</strong> ${submission.student.name} (${submission.student.email})</p>
                <p><strong>Assignment:</strong> ${submission.assignment.title}</p>
                <p><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleString()}</p>
                <div class="submission-content">
                    <strong>Submission:</strong>
                    <p>${submission.content}</p>
                </div>
            `;
            document.getElementById('gradingSubmissionId').value = submissionId;
            document.getElementById('grade').value = submission.grade || '';
            document.getElementById('feedback').value = submission.feedback || '';

            gradingModal.classList.remove('hidden');
        }
    } catch (error) {
        showMessage('Error loading submission details', 'error');
    }
}

async function loadAssignmentSubmissions(assignmentId) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user.role === 'Teacher') {
            // Teachers see all submissions for the assignment
            const result = await apiCallWithAuth(`/submissions/assignment/${assignmentId}`);
            displaySubmissions(result.data.submissions, assignmentSubmissionsContainer, true);
        } else if (user.role === 'Student') {
            // Students see only their own submission for the assignment
            const result = await apiCallWithAuth(`/submissions/assignment/${assignmentId}/student`);
            if (result.data.submission) {
                displaySubmissions([result.data.submission], assignmentSubmissionsContainer, false);
            } else {
                assignmentSubmissionsContainer.innerHTML = '<p>You have not submitted this assignment yet</p>';
            }
        }
    } catch (error) {
        console.error('Error loading assignment submissions:', error);
        assignmentSubmissionsContainer.innerHTML = '<p>Failed to load submissions</p>';
    }
}

async function handleAssignmentCreation(e) {
    e.preventDefault();

    const submitBtn = assignmentForm.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(assignmentForm);
        const data = Object.fromEntries(formData);

        const result = await apiCallWithAuth('/assignments', data, 'POST');

        if (result.success) {
            showMessage('Assignment created successfully!', 'success');
            assignmentModal.classList.add('hidden');
            assignmentForm.reset();
            loadTeacherAssignments();
        } else {
            showMessage(result.message || 'Failed to create assignment');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to create assignment');
    } finally {
        setLoading(submitBtn, false);
    }
}

async function handleAssignmentSubmission(e) {
    e.preventDefault();

    const submitBtn = submissionForm.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(submissionForm);
        const data = Object.fromEntries(formData);

        const result = await apiCallWithAuth('/submissions', data, 'POST');

        if (result.success) {
            showMessage('Assignment submitted successfully!', 'success');
            submissionModal.classList.add('hidden');
            submissionForm.reset();
            loadStudentAssignments();
            loadStudentSubmissions();
        } else {
            showMessage(result.message || 'Failed to submit assignment');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to submit assignment');
    } finally {
        setLoading(submitBtn, false);
    }
}

async function handleGradingSubmission(e) {
    e.preventDefault();

    const submitBtn = gradingForm.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(gradingForm);
        const submissionId = formData.get('submissionId');
        const data = {
            grade: parseInt(formData.get('grade')),
            feedback: formData.get('feedback')
        };

        const result = await apiCallWithAuth(`/submissions/${submissionId}/grade`, data, 'PUT');

        if (result.success) {
            showMessage('Submission graded successfully!', 'success');
            gradingModal.classList.add('hidden');
            gradingForm.reset();
            // Reload submissions
            const assignmentId = getCurrentAssignmentId();
            if (assignmentId) {
                loadAssignmentSubmissions(assignmentId);
            }
        } else {
            showMessage(result.message || 'Failed to grade submission');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to grade submission');
    } finally {
        setLoading(submitBtn, false);
    }
}

// Helper function to get current assignment ID from submissions container
function getCurrentAssignmentId() {
    // This is a simplified version - in a real app you'd track this better
    return null;
}

// Helper function to get submissions from container (simplified)
async function getSubmissionsFromContainer() {
    // This would need to be implemented based on how submissions are stored
    // For now, return empty array
    return [];
}

// Advanced features functions
async function loadTeacherCoursesForMaterial() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
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
        console.error('Error loading courses for material:', error);
    }
}

async function loadCoursesForDiscussion() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        let courses = [];

        if (user.role === 'Teacher') {
            const result = await apiCallWithAuth(`/courses/teacher/${user.id}`);
            courses = result.data.courses;
        } else {
            const result = await apiCallWithAuth('/courses/enrolled');
            courses = result.data.courses;
        }

        // For simplicity, use the first course or let user choose
        if (courses.length > 0) {
            document.getElementById('discussionCourseId').value = courses[0]._id;
        }
    } catch (error) {
        console.error('Error loading courses for discussion:', error);
    }
}

async function loadStudentMaterials() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            const enrolledCourses = result.data.courses;

            // Get materials for all enrolled courses
            const allMaterials = [];
            for (const course of enrolledCourses) {
                try {
                    const materialResult = await apiCallWithAuth(`/materials/course/${course._id}`);
                    if (materialResult.success) {
                        allMaterials.push(...materialResult.data.materials);
                    }
                } catch (error) {
                    console.error(`Error loading materials for course ${course._id}:`, error);
                }
            }

            displayMaterials(allMaterials, courseMaterialsContainer);
        } else {
            console.error('Error loading enrolled courses:', result.message);
            courseMaterialsContainer.innerHTML = '<p>Failed to load materials</p>';
        }
    } catch (error) {
        console.error('Error loading student materials:', error);
        courseMaterialsContainer.innerHTML = '<p>Failed to load materials</p>';
    }
}

async function loadStudentDiscussions() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            const enrolledCourses = result.data.courses;

            // Get discussions for all enrolled courses
            const allDiscussions = [];
            for (const course of enrolledCourses) {
                try {
                    const discussionResult = await apiCallWithAuth(`/discussions/course/${course._id}`);
                    if (discussionResult.success) {
                        allDiscussions.push(...discussionResult.data.discussions);
                    }
                } catch (error) {
                    console.error(`Error loading discussions for course ${course._id}:`, error);
                }
            }

            displayDiscussions(allDiscussions, courseDiscussionsContainer, true);
        } else {
            console.error('Error loading enrolled courses:', result.message);
            courseDiscussionsContainer.innerHTML = '<p>Failed to load discussions</p>';
        }
    } catch (error) {
        console.error('Error loading student discussions:', error);
        courseDiscussionsContainer.innerHTML = '<p>Failed to load discussions</p>';
    }
}

async function loadTeacherMaterials(teacherId) {
    try {
        const result = await apiCallWithAuth(`/courses/teacher/${teacherId}`);
        if (result.success) {
            const teacherCourses = result.data.courses;

            // Get materials for all teacher courses
            const allMaterials = [];
            for (const course of teacherCourses) {
                try {
                    const materialResult = await apiCallWithAuth(`/materials/course/${course._id}`);
                    if (materialResult.success) {
                        allMaterials.push(...materialResult.data.materials);
                    }
                } catch (error) {
                    console.error(`Error loading materials for course ${course._id}:`, error);
                }
            }

            displayMaterials(allMaterials, courseMaterialsContainer);
        } else {
            console.error('Error loading teacher courses:', result.message);
            courseMaterialsContainer.innerHTML = '<p>Failed to load materials</p>';
        }
    } catch (error) {
        console.error('Error loading teacher materials:', error);
        courseMaterialsContainer.innerHTML = '<p>Failed to load materials</p>';
    }
}

async function loadTeacherDiscussions(teacherId) {
    try {
        const result = await apiCallWithAuth(`/courses/teacher/${teacherId}`);
        if (result.success) {
            const teacherCourses = result.data.courses;

            // Get discussions for all teacher courses
            const allDiscussions = [];
            for (const course of teacherCourses) {
                try {
                    const discussionResult = await apiCallWithAuth(`/discussions/course/${course._id}`);
                    if (discussionResult.success) {
                        allDiscussions.push(...discussionResult.data.discussions);
                    }
                } catch (error) {
                    console.error(`Error loading discussions for course ${course._id}:`, error);
                }
            }

            displayDiscussions(allDiscussions, courseDiscussionsContainer, false);
        } else {
            console.error('Error loading teacher courses:', result.message);
            courseDiscussionsContainer.innerHTML = '<p>Failed to load discussions</p>';
        }
    } catch (error) {
        console.error('Error loading teacher discussions:', error);
        courseDiscussionsContainer.innerHTML = '<p>Failed to load discussions</p>';
    }
}

function displayMaterials(materials, container) {
    if (materials.length === 0) {
        container.innerHTML = '<p>No materials available</p>';
        return;
    }

    container.innerHTML = materials.map(material => `
        <div class="material-card">
            <div class="material-header">
                <h5>${material.title}</h5>
                <span class="material-category ${material.category}">${material.category}</span>
            </div>
            ${material.description ? `<p class="material-description">${material.description}</p>` : ''}
            <div class="material-info">
                <p><strong>Course:</strong> ${material.course.title}</p>
                <p><strong>File:</strong> ${material.originalFileName}</p>
                <p><strong>Size:</strong> ${(material.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>Type:</strong> ${material.fileType.toUpperCase()}</p>
                <p><strong>Downloads:</strong> ${material.downloadCount}</p>
                <p><strong>Uploaded:</strong> ${new Date(material.createdAt).toLocaleDateString()}</p>
            </div>
            ${material.tags && material.tags.length > 0 ? `
                <div class="material-tags">
                    ${material.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            <div class="material-actions">
                <button class="btn-primary download-btn" data-material-id="${material._id}">Download</button>
            </div>
        </div>
    `).join('');

    // Add download event listeners
    container.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const materialId = e.target.dataset.materialId;
            downloadMaterial(materialId);
        });
    });
}

function displayDiscussions(discussions, container, showReplyButton = false) {
    if (discussions.length === 0) {
        container.innerHTML = '<p>No discussions yet</p>';
        return;
    }

    container.innerHTML = discussions.map(discussion => `
        <div class="discussion-card ${discussion.isAnnouncement ? 'announcement' : ''} ${discussion.isPinned ? 'pinned' : ''}">
            <div class="discussion-header">
                <h5>${discussion.title}</h5>
                ${discussion.isAnnouncement ? '<span class="announcement-badge">Announcement</span>' : ''}
                ${discussion.isPinned ? '<span class="pinned-badge">Pinned</span>' : ''}
            </div>
            <div class="discussion-meta">
                <span class="author">By ${discussion.author.name}</span>
                <span class="date">${new Date(discussion.createdAt).toLocaleString()}</span>
                <span class="replies">${discussion.replies.length} replies</span>
            </div>
            <div class="discussion-content">
                <p>${discussion.content}</p>
            </div>
            ${discussion.tags && discussion.tags.length > 0 ? `
                <div class="discussion-tags">
                    ${discussion.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            <div class="discussion-actions">
                ${showReplyButton && !discussion.isClosed ? `<button class="btn-secondary reply-btn" data-discussion-id="${discussion._id}">Reply</button>` : ''}
                ${discussion.isClosed ? '<span class="closed-badge">Closed</span>' : ''}
            </div>
            ${discussion.replies && discussion.replies.length > 0 ? `
                <div class="discussion-replies">
                    <h6>Replies:</h6>
                    ${discussion.replies.map(reply => `
                        <div class="reply">
                            <div class="reply-header">
                                <span class="reply-author">${reply.author.name}</span>
                                <span class="reply-date">${new Date(reply.createdAt).toLocaleString()}</span>
                            </div>
                            <div class="reply-content">
                                <p>${reply.content}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');

    // Add reply event listeners
    if (showReplyButton) {
        container.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const discussionId = e.target.dataset.discussionId;
                openReplyModal(discussionId);
            });
        });
    }
}

async function downloadMaterial(materialId) {
    try {
        const response = await fetch(`${API_BASE_URL}/materials/${materialId}/download`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'download'; // The server sets the proper filename
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const error = await response.json();
            showMessage(error.message || 'Download failed', 'error');
        }
    } catch (error) {
        showMessage('Download failed', 'error');
    }
}

async function openReplyModal(discussionId) {
    try {
        // For simplicity, we'll create a basic reply modal
        // In a real app, you'd fetch discussion details
        document.getElementById('replyDiscussionDetails').innerHTML = `
            <p>Replying to discussion...</p>
        `;
        document.getElementById('replyDiscussionId').value = discussionId;

        replyModal.classList.remove('hidden');
    } catch (error) {
        showMessage('Error opening reply modal', 'error');
    }
}

async function loadNotifications() {
    try {
        const result = await apiCallWithAuth('/notifications');
        if (result.success) {
            displayNotifications(result.data.notifications);

            // Mark as read after viewing
            await apiCallWithAuth('/notifications/read-all', {}, 'PUT');
            loadNotificationCount();
        } else {
            console.error('Error loading notifications:', result.message);
            document.getElementById('notificationsContainer').innerHTML = '<p>Failed to load notifications</p>';
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        document.getElementById('notificationsContainer').innerHTML = '<p>Failed to load notifications</p>';
    }
}

async function loadNotificationCount() {
    try {
        const result = await apiCallWithAuth('/notifications/count');
        if (result.success) {
            const count = result.data.unread;

            if (count > 0) {
                notificationBadge.textContent = count > 99 ? '99+' : count;
                notificationBadge.classList.remove('hidden');
            } else {
                notificationBadge.classList.add('hidden');
            }
        } else {
            console.error('Error loading notification count:', result.message);
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

function displayNotifications(notifications) {
    if (notifications.length === 0) {
        document.getElementById('notificationsContainer').innerHTML = '<p>No notifications</p>';
        return;
    }

    document.getElementById('notificationsContainer').innerHTML = notifications.map(notification => `
        <div class="notification-item ${notification.isRead ? 'read' : 'unread'}">
            <div class="notification-header">
                <h6>${notification.title}</h6>
                <span class="notification-time">${new Date(notification.createdAt).toLocaleString()}</span>
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
}

async function handleMaterialUpload(e) {
    e.preventDefault();

    const submitBtn = materialForm.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(materialForm);

        const response = await fetch(`${API_BASE_URL}/materials/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showMessage('Material uploaded successfully!', 'success');
            materialModal.classList.add('hidden');
            materialForm.reset();

            // Reload materials
            const user = JSON.parse(localStorage.getItem('user'));
            if (user.role === 'Teacher') {
                loadTeacherMaterials(user.id);
            } else {
                loadStudentMaterials();
            }
        } else {
            showMessage(result.message || 'Failed to upload material');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to upload material');
    } finally {
        setLoading(submitBtn, false);
    }
}

async function handleDiscussionCreation(e) {
    e.preventDefault();

    const submitBtn = discussionForm.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(discussionForm);
        const data = Object.fromEntries(formData);

        const result = await apiCallWithAuth('/discussions', data, 'POST');

        if (result.success) {
            showMessage('Discussion created successfully!', 'success');
            discussionModal.classList.add('hidden');
            discussionForm.reset();

            // Reload discussions
            const user = JSON.parse(localStorage.getItem('user'));
            if (user.role === 'Teacher') {
                loadTeacherDiscussions(user.id);
            } else {
                loadStudentDiscussions();
            }
        } else {
            showMessage(result.message || 'Failed to create discussion');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to create discussion');
    } finally {
        setLoading(submitBtn, false);
    }
}

async function handleReplySubmission(e) {
    e.preventDefault();

    const submitBtn = replyForm.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(replyForm);
        const discussionId = formData.get('discussionId');
        const data = {
            content: formData.get('content')
        };

        const result = await apiCallWithAuth(`/discussions/${discussionId}/reply`, data, 'POST');

        if (result.success) {
            showMessage('Reply posted successfully!', 'success');
            replyModal.classList.add('hidden');
            replyForm.reset();

            // Reload discussions
            const user = JSON.parse(localStorage.getItem('user'));
            if (user.role === 'Teacher') {
                loadTeacherDiscussions(user.id);
            } else {
                loadStudentDiscussions();
            }
        } else {
            showMessage(result.message || 'Failed to post reply');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to post reply');
    } finally {
        setLoading(submitBtn, false);
    }
}

// Grade-related functions
async function loadStudentGrades() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            const enrolledCourses = result.data.courses;

            // Get grades for all enrolled courses
            const allGrades = [];
            for (const course of enrolledCourses) {
                try {
                    const gradeResult = await apiCallWithAuth(`/grades/course/${course._id}`);
                    if (gradeResult.success && gradeResult.data.grade) {
                        allGrades.push(gradeResult.data.grade);
                    }
                } catch (error) {
                    console.error(`Error loading grade for course ${course._id}:`, error);
                }
            }

            displayStudentGrades(allGrades);
        } else {
            console.error('Error loading enrolled courses:', result.message);
            myGradesContainer.innerHTML = '<p>Failed to load grades</p>';
        }
    } catch (error) {
        console.error('Error loading student grades:', error);
        myGradesContainer.innerHTML = '<p>Failed to load grades</p>';
    }
}

async function loadCourseGrades(teacherId) {
    try {
        const result = await apiCallWithAuth(`/courses/teacher/${teacherId}`);
        if (result.success) {
            const teacherCourses = result.data.courses;

            // Get grades for all teacher courses
            const allGrades = [];
            const allStats = [];

            for (const course of teacherCourses) {
                try {
                    const gradeResult = await apiCallWithAuth(`/grades/course/${course._id}/all`);
                    if (gradeResult.success) {
                        allGrades.push(...gradeResult.data.grades);
                        allStats.push({
                            course: course.title,
                            stats: gradeResult.data.statistics
                        });
                    }
                } catch (error) {
                    console.error(`Error loading grades for course ${course._id}:`, error);
                }
            }

            displayCourseGrades(allGrades, allStats);
        } else {
            console.error('Error loading teacher courses:', result.message);
            courseGradesContainer.innerHTML = '<p>Failed to load grades</p>';
        }
    } catch (error) {
        console.error('Error loading course grades:', error);
        courseGradesContainer.innerHTML = '<p>Failed to load grades</p>';
    }
}

function displayStudentGrades(grades) {
    if (grades.length === 0) {
        myGradesContainer.innerHTML = '<p>No grades available yet</p>';
        return;
    }

    myGradesContainer.innerHTML = grades.map(grade => `
        <div class="grade-card">
            <h5>${grade.course.title}</h5>
            <div class="grade-summary">
                <div class="grade-score">
                    <span class="overall-grade">${grade.overallGrade.toFixed(1)}%</span>
                    <span class="letter-grade">${grade.letterGrade}</span>
                </div>
                <div class="grade-details">
                    <p><strong>GPA:</strong> ${grade.gpa.toFixed(2)}</p>
                    <p><strong>Points:</strong> ${grade.totalPointsEarned}/${grade.totalPossiblePoints}</p>
                    ${grade.comments ? `<p><strong>Comments:</strong> ${grade.comments}</p>` : ''}
                    ${grade.isFinal ? '<span class="final-badge">Final Grade</span>' : '<span class="draft-badge">Draft Grade</span>'}
                </div>
            </div>
            <div class="grade-breakdown">
                <h6>Assignment Breakdown:</h6>
                ${grade.gradeBreakdown.map(item => `
                    <div class="breakdown-item">
                        <span class="assignment-name">${item.assignmentTitle}</span>
                        <span class="assignment-score">${item.pointsEarned}/${item.maxPoints} (${item.percentage.toFixed(1)}%)</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function displayCourseGrades(grades, stats) {
    if (grades.length === 0) {
        courseGradesContainer.innerHTML = '<p>No grades calculated yet</p>';
        return;
    }

    // Display class statistics first
    let statsHtml = '';
    if (stats.length > 0) {
        statsHtml = `
            <div class="class-statistics">
                <h5>Class Statistics</h5>
                ${stats.map(stat => `
                    <div class="stat-card">
                        <h6>${stat.course}</h6>
                        <div class="stat-grid">
                            <div class="stat-item">
                                <span class="stat-label">Average:</span>
                                <span class="stat-value">${stat.stats.averageGrade.toFixed(1)}%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Highest:</span>
                                <span class="stat-value">${stat.stats.highestGrade.toFixed(1)}%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Lowest:</span>
                                <span class="stat-value">${stat.stats.lowestGrade.toFixed(1)}%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Students:</span>
                                <span class="stat-value">${stat.stats.totalStudents}</span>
                            </div>
                        </div>
                        <div class="grade-distribution">
                            <h7>Grade Distribution:</h7>
                            ${Object.entries(stat.stats.gradeDistribution).map(([grade, count]) =>
                                count > 0 ? `<span class="grade-count ${grade.toLowerCase()}">${grade}: ${count}</span>` : ''
                            ).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Display individual student grades
    const gradesHtml = grades.map(grade => `
        <div class="student-grade-card">
            <div class="student-info">
                <h6>${grade.student.name}</h6>
                <span class="student-email">${grade.student.email}</span>
            </div>
            <div class="course-grade">
                <span class="course-name">${grade.course.title}</span>
                <div class="grade-display">
                    <span class="overall-grade">${grade.overallGrade.toFixed(1)}%</span>
                    <span class="letter-grade">${grade.letterGrade}</span>
                    <span class="gpa-display">GPA: ${grade.gpa.toFixed(2)}</span>
                </div>
                ${grade.isFinal ? '<span class="final-badge">Final</span>' : '<button class="btn-secondary calculate-grade-btn" data-student-id="' + grade.student._id + '" data-course-id="' + grade.course._id + '">Recalculate</button>'}
            </div>
            ${grade.comments ? `<div class="grade-comments"><strong>Comments:</strong> ${grade.comments}</div>` : ''}
        </div>
    `).join('');

    courseGradesContainer.innerHTML = statsHtml + '<h5>Individual Student Grades</h5>' + gradesHtml;

    // Add event listeners for recalculate buttons
    courseGradesContainer.querySelectorAll('.calculate-grade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.target.dataset.studentId;
            const courseId = e.target.dataset.courseId;
            calculateStudentGrade(studentId, courseId);
        });
    });
}

async function calculateStudentGrade(studentId, courseId) {
    try {
        const result = await apiCallWithAuth(`/grades/calculate/${studentId}/${courseId}`, {}, 'POST');

        if (result.success) {
            showMessage('Grade recalculated successfully!', 'success');
            // Reload grades
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.role === 'Teacher') {
                loadCourseGrades(user.id);
            }
        } else {
            showMessage(result.message || 'Failed to calculate grade');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to calculate grade');
    }
}

// Update dashboard statistics
async function updateDashboardStats(user) {
    try {
        if (user.role === 'Teacher') {
            // Get teacher courses count
            const coursesResult = await apiCallWithAuth(`/courses/teacher/${user.id}`);
            if (coursesResult.success) {
                document.getElementById('coursesCount').textContent = coursesResult.data.courses.length;

                // Get assignments count
                let assignmentsCount = 0;
                for (const course of coursesResult.data.courses) {
                    const assignmentResult = await apiCallWithAuth(`/assignments/course/${course._id}`);
                    if (assignmentResult.success) {
                        assignmentsCount += assignmentResult.data.assignments.length;
                    }
                }
                document.getElementById('assignmentsCount').textContent = assignmentsCount;

                // Get students count (simplified - count enrolled students across all courses)
                let studentsCount = 0;
                for (const course of coursesResult.data.courses) {
                    studentsCount += course.enrolledStudents.length;
                }
                document.getElementById('studentsCount').textContent = studentsCount;
            }

        } else if (user.role === 'Student') {
            // Get enrolled courses count
            const enrolledResult = await apiCallWithAuth('/courses/enrolled');
            if (enrolledResult.success) {
                document.getElementById('coursesCount').textContent = enrolledResult.data.courses.length;

                // Get assignments count
                let assignmentsCount = 0;
                for (const course of enrolledResult.data.courses) {
                    const assignmentResult = await apiCallWithAuth(`/assignments/course/${course._id}`);
                    if (assignmentResult.success) {
                        assignmentsCount += assignmentResult.data.assignments.length;
                    }
                }
                document.getElementById('assignmentsCount').textContent = assignmentsCount;

                // Students count is just 1 (the current user)
                document.getElementById('studentsCount').textContent = '1';
            }
        }
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded, initializing app...');
    checkAuth();
    // setupCourseEventListeners(); // Remove this - will be called after dashboard shows

    // Apply saved settings on page load
    applySavedSettings();
});

// Apply saved settings from localStorage
function applySavedSettings() {
    const settings = JSON.parse(localStorage.getItem('lmsSettings') || '{}');

    // Apply theme
    if (settings.theme) {
        applyTheme(settings.theme);
    }

    // Apply font size
    if (settings.fontSize) {
        applyFontSize(settings.fontSize);
    }

    // Apply accessibility settings
    if (settings.accessibility) {
        applyAccessibilitySettings(settings.accessibility);
    }
}

// Apply theme to the document
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lmsSettings', JSON.stringify({
        ...JSON.parse(localStorage.getItem('lmsSettings') || '{}'),
        theme
    }));
}

// Apply font size
function applyFontSize(size) {
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('lmsSettings', JSON.stringify({
        ...JSON.parse(localStorage.getItem('lmsSettings') || '{}'),
        fontSize: size
    }));
}

// Apply accessibility settings
function applyAccessibilitySettings(accessibility) {
    if (accessibility.highContrast) {
        document.documentElement.classList.add('high-contrast');
    } else {
        document.documentElement.classList.remove('high-contrast');
    }

    if (accessibility.reduceMotion) {
        document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    }

    localStorage.setItem('lmsSettings', JSON.stringify({
        ...JSON.parse(localStorage.getItem('lmsSettings') || '{}'),
        accessibility
    }));
}

// Course search functionality
function setupCourseSearch() {
    if (courseSearchBtn && courseSearchInput) {
        // Search on button click
        courseSearchBtn.addEventListener('click', performCourseSearch);

        // Search on Enter key press
        courseSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performCourseSearch();
            }
        });

        // Clear search when input is empty
        courseSearchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                displayCourses(allCourses, coursesContainer, true);
            }
        });
    }
}

function performCourseSearch() {
    if (!courseSearchInput || !allCourses.length) return;

    const searchTerm = courseSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        displayCourses(allCourses, coursesContainer, true);
        return;
    }

    // Filter courses based on search term
    const filteredCourses = allCourses.filter(course => {
        return course.title.toLowerCase().includes(searchTerm) ||
               course.description.toLowerCase().includes(searchTerm) ||
               course.teacher.name.toLowerCase().includes(searchTerm) ||
               course.duration.toLowerCase().includes(searchTerm);
    });

    displayCourses(filteredCourses, coursesContainer, true);
}

// Teacher course search functionality
function setupTeacherCourseSearch() {
    if (teacherCourseSearchBtn && teacherCourseSearchInput) {
        // Search on button click
        teacherCourseSearchBtn.addEventListener('click', performTeacherCourseSearch);

        // Search on Enter key press
        teacherCourseSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performTeacherCourseSearch();
            }
        });

        // Clear search when input is empty
        teacherCourseSearchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                displayCourses(allTeacherCourses, teacherCourses, false, true);
            }
        });
    }
}

function performTeacherCourseSearch() {
    if (!teacherCourseSearchInput || !allTeacherCourses.length) return;

    const searchTerm = teacherCourseSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        displayCourses(allTeacherCourses, teacherCourses, false, true);
        return;
    }

    // Filter courses based on search term
    const filteredCourses = allTeacherCourses.filter(course => {
        return course.title.toLowerCase().includes(searchTerm) ||
               course.description.toLowerCase().includes(searchTerm) ||
               course.duration.toLowerCase().includes(searchTerm);
    });

    displayCourses(filteredCourses, teacherCourses, false, true);
}