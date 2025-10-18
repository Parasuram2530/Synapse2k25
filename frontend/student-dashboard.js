// Student Dashboard JavaScript
const API_BASE_URL = 'http://localhost:5000/api';

// DOM elements
let coursesContainer, enrolledCoursesContainer, assignmentsContainer, submissionsContainer, myGradesContainer;
let courseMaterialsContainer, courseDiscussionsContainer, notificationBadge;
let courseSearchInput, courseSearchBtn;
let allCourses = [];

// Tab management
function setupTabNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-tab]');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all links and tabs
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));

            // Add active class to clicked link
            link.classList.add('active');

            // Show corresponding tab
            const tabId = link.getAttribute('data-tab');
            const tabElement = document.getElementById(tabId + 'Tab');
            if (tabElement) {
                tabElement.classList.add('active');
            }

            // Load data for the tab
            loadTabData(tabId);
        });
    });
}

function loadTabData(tabId) {
    switch(tabId) {
        case 'courses':
            loadAvailableCourses();
            break;
        case 'enrolled':
            loadEnrolledCourses();
            break;
        case 'assignments':
            loadStudentAssignments();
            loadCompletedAssignments();
            break;
        case 'submissions':
            loadStudentSubmissions();
            break;
        case 'grades':
            loadStudentGrades();
            break;
        case 'materials':
            loadStudentMaterials();
            break;
        case 'discussions':
            loadStudentDiscussions();
            break;
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Student dashboard initializing...');

    // Check authentication
    checkAuth();

    // Setup DOM elements
    setupDOMElements();

    // Setup event listeners
    setupEventListeners();

    // Setup tab navigation
    setupTabNavigation();

    // Load initial data
    loadAvailableCourses();
    updateDashboardStats();

    // Update profile picture display after auth check
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user) {
        updateProfilePictureDisplay(user);
    }
});

// Setup DOM elements
function setupDOMElements() {
    coursesContainer = document.getElementById('coursesContainer');
    enrolledCoursesContainer = document.getElementById('enrolledCoursesContainer');
    assignmentsContainer = document.getElementById('assignmentsContainer');
    submissionsContainer = document.getElementById('submissionsContainer');
    myGradesContainer = document.getElementById('myGradesContainer');
    courseMaterialsContainer = document.getElementById('courseMaterialsContainer');
    courseDiscussionsContainer = document.getElementById('courseDiscussionsContainer');
    notificationBadge = document.getElementById('notificationBadge');

    courseSearchInput = document.getElementById('courseSearchInput');
    courseSearchBtn = document.getElementById('courseSearchBtn');
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    if (courseSearchBtn && courseSearchInput) {
        courseSearchBtn.addEventListener('click', performCourseSearch);
        courseSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performCourseSearch();
            }
        });
        courseSearchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                displayCourses(allCourses, coursesContainer, true);
            }
        });
    }

    // Enrolled courses search
    const enrolledCourseSearchBtn = document.getElementById('enrolledCourseSearchBtn');
    const enrolledCourseSearchInput = document.getElementById('enrolledCourseSearchInput');
    if (enrolledCourseSearchBtn && enrolledCourseSearchInput) {
        enrolledCourseSearchBtn.addEventListener('click', performEnrolledCourseSearch);
        enrolledCourseSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performEnrolledCourseSearch();
            }
        });
        enrolledCourseSearchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                loadEnrolledCourses();
            }
        });
    }

    // Assignments search
    const assignmentsSearchBtn = document.getElementById('assignmentsSearchBtn');
    const assignmentsSearchInput = document.getElementById('assignmentsSearchInput');
    if (assignmentsSearchBtn && assignmentsSearchInput) {
        assignmentsSearchBtn.addEventListener('click', performAssignmentsSearch);
        assignmentsSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performAssignmentsSearch();
            }
        });
        assignmentsSearchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                loadStudentAssignments();
            }
        });
    }

    // Submissions search
    const submissionsSearchBtn = document.getElementById('submissionsSearchBtn');
    const submissionsSearchInput = document.getElementById('submissionsSearchInput');
    if (submissionsSearchBtn && submissionsSearchInput) {
        submissionsSearchBtn.addEventListener('click', performSubmissionsSearch);
        submissionsSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSubmissionsSearch();
            }
        });
        submissionsSearchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                loadStudentSubmissions();
            }
        });
    }

    // Grades search
    const gradesSearchBtn = document.getElementById('gradesSearchBtn');
    const gradesSearchInput = document.getElementById('gradesSearchInput');
    if (gradesSearchBtn && gradesSearchInput) {
        gradesSearchBtn.addEventListener('click', performGradesSearch);
        gradesSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performGradesSearch();
            }
        });
        gradesSearchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                loadStudentGrades();
            }
        });
    }

    // User menu functionality
    setupUserMenu();

    // Avatar functionality
    setupAvatarMenu();

    // Modal close functionality
    setupModalClose();
}

// Check authentication
async function checkAuth() {
    const token = getToken();
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const userData = JSON.parse(user);
        if (userData.role !== 'Student') {
            window.location.href = 'index.html';
            return;
        }

        // Update welcome message
        updateWelcomeMessage(userData);

        // Validate token
        const result = await apiCallWithAuth('/auth/validate', {}, 'GET');
        if (!result.success) {
            logout();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        logout();
    }
}

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

// Utility functions
const getToken = () => {
    return localStorage.getItem('token');
};

const showMessage = (message, type = 'error') => {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    const activeForm = document.querySelector('.form-container.active') || document.body;
    activeForm.insertBefore(messageDiv, activeForm.firstChild);

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
        button.textContent = button.textContent.replace('Loading...', button === document.getElementById('logoutBtn') ? 'Logout' : 'Submit');
    }
};

// Update welcome message
function updateWelcomeMessage(user) {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');

    if (welcomeMessage && userNameElement && userRoleElement && user) {
        userNameElement.textContent = user.name;
        userRoleElement.textContent = user.role;

        // Update dropdown user info
        if (dropdownUserName) dropdownUserName.textContent = user.name;
        if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;

        setTimeout(() => {
            welcomeMessage.style.opacity = '1';
        }, 100);
    }
}

// Update profile picture display
function updateProfilePictureDisplay(user) {
    const dashboardProfilePic = document.getElementById('dashboardProfilePic');
    const defaultAvatar = document.getElementById('defaultAvatar');

    if (dashboardProfilePic && defaultAvatar) {
        if (user && user.profilePicture) {
            dashboardProfilePic.src = `http://localhost:5000/uploads/profiles/${user.profilePicture}`;
            dashboardProfilePic.style.display = 'block';
            defaultAvatar.style.display = 'none';
            console.log('Profile picture updated:', dashboardProfilePic.src);
        } else {
            dashboardProfilePic.src = '';
            dashboardProfilePic.style.display = 'none';
            defaultAvatar.style.display = 'block';
            console.log('Default avatar displayed');
        }
    } else {
        console.error('Profile picture elements not found');
    }
}

// Setup user menu
function setupUserMenu() {
    const defaultAvatar = document.getElementById('defaultAvatar');
    const dashboardProfilePic = document.getElementById('dashboardProfilePic');
    const userDropdown = document.getElementById('userDropdown');

    // Use both avatar elements for hover/click
    const avatarElements = [defaultAvatar, dashboardProfilePic].filter(el => el);

    avatarElements.forEach(avatar => {
        // Hover events
        avatar.addEventListener('mouseenter', () => {
            userDropdown.classList.add('active');
            userDropdown.classList.remove('hidden');
        });

        avatar.addEventListener('mouseleave', () => {
            // Delay hiding to allow moving to dropdown
            setTimeout(() => {
                if (!userDropdown.matches(':hover')) {
                    userDropdown.classList.remove('active');
                    userDropdown.classList.add('hidden');
                }
            }, 100);
        });

        // Click events (for mobile)
        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
            userDropdown.classList.toggle('hidden');
        });
    });

    // Dropdown hover
    userDropdown.addEventListener('mouseenter', () => {
        userDropdown.classList.add('active');
        userDropdown.classList.remove('hidden');
    });

    userDropdown.addEventListener('mouseleave', () => {
        userDropdown.classList.remove('active');
        userDropdown.classList.add('hidden');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.classList.contains('hidden')) {
            const isClickInside = avatarElements.some(avatar => avatar.contains(e.target)) || userDropdown.contains(e.target);
            if (!isClickInside) {
                userDropdown.classList.add('hidden');
            }
        }
    });

    // Profile and settings links
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            userDropdown.classList.add('hidden');
            window.location.href = 'profile.html';
        });
    }

    if (settingsLink) {
        settingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            userDropdown.classList.add('hidden');
            window.location.href = 'settings.html';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Add logout button event listener for the new logout button
    const newLogoutBtn = document.getElementById('logoutBtn');
    if (newLogoutBtn) {
        newLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// Setup avatar menu
function setupAvatarMenu() {
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const avatarUploadInput = document.getElementById('avatarUploadInput');

    if (changePhotoBtn && avatarUploadInput) {
        changePhotoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            avatarUploadInput.click();
        });

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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showMessage('Please select a valid image file (JPEG, PNG, GIF, WebP)', 'error');
        return;
    }

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

            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...currentUser, ...result.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            updateProfilePictureDisplay(updatedUser);
        } else {
            showMessage(result.message || 'Failed to update profile picture', 'error');
        }
    } catch (error) {
        console.error('Error updating profile picture:', error);
        showMessage('Error updating profile picture', 'error');
    }
}

// Setup modal close
function setupModalClose() {
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
        });
    });
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Course search functionality
function performCourseSearch() {
    if (!courseSearchInput || !allCourses.length) return;

    const searchTerm = courseSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        displayCourses(allCourses, coursesContainer, true);
        return;
    }

    const filteredCourses = allCourses.filter(course => {
        return course.title.toLowerCase().includes(searchTerm) ||
               course.description.toLowerCase().includes(searchTerm) ||
               course.teacher.name.toLowerCase().includes(searchTerm) ||
               course.duration.toLowerCase().includes(searchTerm);
    });

    displayCourses(filteredCourses, coursesContainer, true);
}

// Enrolled courses search functionality
let allEnrolledCourses = [];
function performEnrolledCourseSearch() {
    const enrolledCourseSearchInput = document.getElementById('enrolledCourseSearchInput');
    if (!enrolledCourseSearchInput || !allEnrolledCourses.length) return;

    const searchTerm = enrolledCourseSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        displayCourses(allEnrolledCourses, enrolledCoursesContainer, false);
        return;
    }

    const filteredCourses = allEnrolledCourses.filter(course => {
        return course.title.toLowerCase().includes(searchTerm) ||
               course.description.toLowerCase().includes(searchTerm) ||
               course.teacher.name.toLowerCase().includes(searchTerm) ||
               course.duration.toLowerCase().includes(searchTerm);
    });

    displayCourses(filteredCourses, enrolledCoursesContainer, false);
}

// Assignments search functionality
let allStudentAssignments = [];
function performAssignmentsSearch() {
    const assignmentsSearchInput = document.getElementById('assignmentsSearchInput');
    if (!assignmentsSearchInput || !allStudentAssignments.length) return;

    const searchTerm = assignmentsSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        displayAssignments(allStudentAssignments, assignmentsContainer, true);
        return;
    }

    const filteredAssignments = allStudentAssignments.filter(assignment => {
        return assignment.title.toLowerCase().includes(searchTerm) ||
               assignment.description.toLowerCase().includes(searchTerm) ||
               assignment.course.title.toLowerCase().includes(searchTerm);
    });

    displayAssignments(filteredAssignments, assignmentsContainer, true);
}

// Submissions search functionality
let allStudentSubmissions = [];
function performSubmissionsSearch() {
    const submissionsSearchInput = document.getElementById('submissionsSearchInput');
    if (!submissionsSearchInput || !allStudentSubmissions.length) return;

    const searchTerm = submissionsSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        displaySubmissions(allStudentSubmissions, submissionsContainer, false);
        return;
    }

    const filteredSubmissions = allStudentSubmissions.filter(submission => {
        return submission.assignment.title.toLowerCase().includes(searchTerm) ||
               submission.student.name.toLowerCase().includes(searchTerm) ||
               submission.content.toLowerCase().includes(searchTerm);
    });

    displaySubmissions(filteredSubmissions, submissionsContainer, false);
}

// Grades search functionality
let allStudentGrades = [];
function performGradesSearch() {
    const gradesSearchInput = document.getElementById('gradesSearchInput');
    if (!gradesSearchInput || !allStudentGrades.length) return;

    const searchTerm = gradesSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        displayStudentGrades(allStudentGrades);
        return;
    }

    const filteredGrades = allStudentGrades.filter(grade => {
        return grade.course.title.toLowerCase().includes(searchTerm);
    });

    displayStudentGrades(filteredGrades);
}

// Load available courses
async function loadAvailableCourses() {
    try {
        const result = await apiCallWithAuth('/courses');
        if (result.success) {
            allCourses = result.data.courses;
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

// Load enrolled courses
async function loadEnrolledCourses() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            allEnrolledCourses = result.data.courses; // Store for search
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

// Load student assignments
async function loadStudentAssignments() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            const enrolledCourses = result.data.courses;
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
                    pendingAssignments.push(assignment);
                }
            }

            allStudentAssignments = pendingAssignments; // Store for search
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

// Load completed assignments
async function loadCompletedAssignments() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            const enrolledCourses = result.data.courses;
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
                const assignmentsTab = document.getElementById('assignmentsTab');
                const completedSection = document.createElement('div');
                completedSection.className = 'dashboard-card';
                completedSection.innerHTML = `
                    <div class="card-header">
                        <h3><i class="fas fa-check-circle"></i> Completed Assignments</h3>
                    </div>
                    <div id="completedAssignmentsContainer" class="card-content"></div>
                `;
                assignmentsTab.appendChild(completedSection);
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

// Load student submissions
async function loadStudentSubmissions() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            const enrolledCourses = result.data.courses;
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

            allStudentSubmissions = allSubmissions; // Store for search
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

// Load student grades
async function loadStudentGrades() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            const enrolledCourses = result.data.courses;
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

            allStudentGrades = allGrades; // Store for search
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

// Load student materials
async function loadStudentMaterials() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            const enrolledCourses = result.data.courses;
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

// Load student discussions
async function loadStudentDiscussions() {
    try {
        const result = await apiCallWithAuth('/courses/enrolled');
        if (result.success) {
            const enrolledCourses = result.data.courses;
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

// Update dashboard stats
async function updateDashboardStats() {
    try {
        const enrolledResult = await apiCallWithAuth('/courses/enrolled');
        if (enrolledResult.success) {
            document.getElementById('coursesCount').textContent = enrolledResult.data.courses.length;

            let assignmentsCount = 0;
            for (const course of enrolledResult.data.courses) {
                const assignmentResult = await apiCallWithAuth(`/assignments/course/${course._id}`);
                if (assignmentResult.success) {
                    assignmentsCount += assignmentResult.data.assignments.length;
                }
            }
            document.getElementById('assignmentsCount').textContent = assignmentsCount;

            document.getElementById('studentsCount').textContent = '1';
        }
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Display functions (same as before)
function displayCourses(courses, container, showEnrollButton = false, showEnrolledStudents = false) {
    if (courses.length === 0) {
        container.innerHTML = '<div class="no-courses"><p>No courses available</p></div>';
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="course-card">
            <div class="course-title-line">
                <span class="course-title-text">${course.title}</span>
            </div>

            <div class="course-description-line">
                <span class="course-description-text">${course.description.length > 100 ? course.description.substring(0, 100) + '...' : course.description}</span>
            </div>

            <div class="course-info-container">
                <div class="course-info-line">
                    <span class="course-info-label">Duration:</span>
                    <span class="course-info-value">${course.duration}</span>
                </div>

                <div class="course-info-line">
                    <span class="course-info-label">Teacher:</span>
                    <span class="course-info-value">${course.teacher.name}</span>
                </div>

                <div class="course-info-line">
                    <span class="course-info-label">Enrolled:</span>
                    <span class="course-info-value">${course.enrolledStudents.length} ${course.enrolledStudents.length === 1 ? 'student' : 'students'}</span>
                </div>

                <div class="course-info-line">
                    <span class="course-info-label">Created:</span>
                    <span class="course-info-value">${new Date(course.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            ${showEnrollButton ? `
                <div class="course-enroll-line">
                    <button class="btn-primary enroll-btn" data-course-id="${course._id}">
                        <span class="enroll-emoji">🎓</span>
                        <span class="enroll-text">Enroll</span>
                    </button>
                </div>
            ` : ''}

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

    if (showEnrollButton) {
        container.querySelectorAll('.enroll-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = e.target.closest('.enroll-btn').dataset.courseId;
                enrollInCourse(courseId);
            });
        });
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

    if (showGradeButton) {
        container.querySelectorAll('.grade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const submissionId = e.target.dataset.submissionId;
                openGradingModal(submissionId);
            });
        });
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

    if (showReplyButton) {
        container.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const discussionId = e.target.dataset.discussionId;
                openReplyModal(discussionId);
            });
        });
    }
}

// Additional functions (enroll in course, download material, etc.)
async function enrollInCourse(courseId) {
    try {
        const result = await apiCallWithAuth(`/courses/${courseId}/enroll`, {}, 'POST');

        if (result.success) {
            showMessage('Successfully enrolled in course!', 'success');
            loadAvailableCourses();
            loadEnrolledCourses();
            updateDashboardStats();
        } else {
            showMessage(result.message || 'Failed to enroll');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to enroll');
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
            a.download = 'download';
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
        document.getElementById('replyDiscussionDetails').innerHTML = `
            <p>Replying to discussion...</p>
        `;
        document.getElementById('replyDiscussionId').value = discussionId;

        document.getElementById('replyModal').classList.remove('hidden');
    } catch (error) {
        showMessage('Error opening reply modal', 'error');
    }
}

// Demo data function (same as before)
function getDemoDataForEndpoint(endpoint) {
    if (endpoint.includes('/courses')) {
        return {
            success: true,
            data: {
                courses: [
                    {
                        _id: '507f1f77bcf86cd799439012',
                        title: 'Introduction to Computer Science',
                        description: 'Learn the fundamentals of programming, algorithms, and computer systems.',
                        duration: '12 weeks',
                        teacher: {
                            _id: '507f1f77bcf86cd799439013',
                            name: 'Dr. Demo Teacher',
                            email: 'teacher@demo.edu'
                        },
                        enrolledStudents: [
                            {
                                _id: '507f1f77bcf86cd799439011',
                                name: 'Demo User',
                                email: 'demo@example.com'
                            }
                        ],
                        createdAt: new Date()
                    },
                    {
                        _id: '507f1f77bcf86cd799439014',
                        title: 'Web Development Fundamentals',
                        description: 'Master the basics of HTML, CSS, and JavaScript.',
                        duration: '10 weeks',
                        teacher: {
                            _id: '507f1f77bcf86cd799439013',
                            name: 'Dr. Demo Teacher',
                            email: 'teacher@demo.edu'
                        },
                        enrolledStudents: [],
                        createdAt: new Date()
                    }
                ],
                count: 2
            }
        };
    }

    if (endpoint.includes('/assignments/course/')) {
        return {
            success: true,
            data: {
                assignments: [
                    {
                        _id: '507f1f77bcf86cd799439015',
                        title: 'Programming Fundamentals Quiz',
                        description: 'Complete the quiz on basic programming concepts.',
                        course: {
                            _id: '507f1f77bcf86cd799439012',
                            title: 'Introduction to Computer Science'
                        },
                        teacher: {
                            _id: '507f1f77bcf86cd799439013',
                            name: 'Dr. Demo Teacher',
                            email: 'teacher@demo.edu'
                        },
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        maxPoints: 100,
                        createdAt: new Date()
                    }
                ],
                count: 1
            }
        };
    }

    return {
        success: true,
        data: []
    };
}