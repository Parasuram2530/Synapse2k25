// Teacher Dashboard JavaScript
const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000/api"
  : `${window.location.origin}/api`;

// DOM elements
let teacherCourses, courseAssignmentsContainer, gradedAssignmentsContainer, courseGradesContainer;
let courseMaterialsContainer, courseDiscussionsContainer, notificationBadge;

// Global variables for search functionality
let allAssignments = [];
let allGradedAssignments = [];
let allGrades = [];
let allMaterials = [];
let allDiscussions = [];

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
            loadTeacherCourses();
            break;
        case 'assignments':
            loadTeacherAssignments();
            break;
        case 'graded':
            loadGradedAssignments();
            break;
        case 'grades':
            loadCourseGrades();
            break;
        case 'materials':
            loadTeacherMaterials();
            break;
        case 'discussions':
            loadTeacherDiscussions();
            break;
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Teacher dashboard initializing...');

    // Check authentication
    checkAuth();

    // Setup DOM elements
    setupDOMElements();

    // Setup event listeners
    setupEventListeners();

    // Setup tab navigation
    setupTabNavigation();

    // Check if course was created
    checkCourseCreation();

    // Load initial data
    loadTeacherCourses();
    updateDashboardStats();

    // Update profile picture display after auth check
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user) {
        updateProfilePictureDisplay(user);
    }
});

// Check if course was created from create-course page
function checkCourseCreation() {
    const courseCreated = localStorage.getItem('courseCreated');
    if (courseCreated === 'true') {
        localStorage.removeItem('courseCreated');
        // Data will be reloaded by the load functions
    }
}

// Setup DOM elements
function setupDOMElements() {
    teacherCourses = document.getElementById('teacherCourses');
    courseAssignmentsContainer = document.getElementById('courseAssignmentsContainer');
    gradedAssignmentsContainer = document.getElementById('gradedAssignmentsContainer');
    courseGradesContainer = document.getElementById('courseGradesContainer');
    courseMaterialsContainer = document.getElementById('courseMaterialsContainer');
    courseDiscussionsContainer = document.getElementById('courseDiscussionsContainer');
    notificationBadge = document.getElementById('notificationBadge');
}

// Setup event listeners
function setupEventListeners() {
    // User menu functionality
    setupUserMenu();

    // Avatar functionality
    setupAvatarMenu();

    // Modal close functionality
    setupModalClose();

    // Teacher course search
    setupTeacherCourseSearch();
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
        if (userData.role !== 'Teacher') {
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

// Setup teacher course search
function setupTeacherCourseSearch() {
    const teacherCourseSearchBtn = document.getElementById('teacherCourseSearchBtn');
    const teacherCourseSearchInput = document.getElementById('teacherCourseSearchInput');

    if (teacherCourseSearchBtn && teacherCourseSearchInput) {
        teacherCourseSearchBtn.addEventListener('click', performTeacherCourseSearch);
        teacherCourseSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performTeacherCourseSearch();
            }
        });
        teacherCourseSearchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                loadTeacherCourses();
            }
        });
    }

    // Setup search for all tabs
    setupAssignmentsSearch();
    setupGradedAssignmentsSearch();
    setupGradesSearch();
    setupMaterialsSearch();
    setupDiscussionsSearch();
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Teacher course search
function performTeacherCourseSearch() {
    const teacherCourseSearchInput = document.getElementById('teacherCourseSearchInput');
    if (!teacherCourseSearchInput) return;

    const searchTerm = teacherCourseSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        loadTeacherCourses();
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

// Setup assignments search
function setupAssignmentsSearch() {
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
                loadTeacherAssignments();
            }
        });
    }
}

// Setup graded assignments search
function setupGradedAssignmentsSearch() {
    const gradedAssignmentsSearchBtn = document.getElementById('gradedAssignmentsSearchBtn');
    const gradedAssignmentsSearchInput = document.getElementById('gradedAssignmentsSearchInput');

    if (gradedAssignmentsSearchBtn && gradedAssignmentsSearchInput) {
        gradedAssignmentsSearchBtn.addEventListener('click', performGradedAssignmentsSearch);
        gradedAssignmentsSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performGradedAssignmentsSearch();
            }
        });
        gradedAssignmentsSearchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                loadGradedAssignments();
            }
        });
    }
}

// Setup grades search
function setupGradesSearch() {
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
                loadCourseGrades();
            }
        });
    }
}

// Setup materials search
function setupMaterialsSearch() {
    const materialsSearchBtn = document.getElementById('materialsSearchBtn');
    const materialsSearchInput = document.getElementById('materialsSearchInput');

    if (materialsSearchBtn && materialsSearchInput) {
        materialsSearchBtn.addEventListener('click', performMaterialsSearch);
        materialsSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performMaterialsSearch();
            }
        });
        materialsSearchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                loadTeacherMaterials();
            }
        });
    }
}

// Setup discussions search
function setupDiscussionsSearch() {
    const discussionsSearchBtn = document.getElementById('discussionsSearchBtn');
    const discussionsSearchInput = document.getElementById('discussionsSearchInput');

    if (discussionsSearchBtn && discussionsSearchInput) {
        discussionsSearchBtn.addEventListener('click', performDiscussionsSearch);
        discussionsSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performDiscussionsSearch();
            }
        });
        discussionsSearchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                loadTeacherDiscussions();
            }
        });
    }
}

// Load teacher courses
let allTeacherCourses = [];
async function loadTeacherCourses() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const result = await apiCallWithAuth(`/courses/teacher/${user.id}`);
        if (result.success) {
            allTeacherCourses = result.data.courses;
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

// Refresh teacher courses after creation
function refreshTeacherCourses() {
    loadTeacherCourses();
    updateDashboardStats();
}

// Load teacher assignments
async function loadTeacherAssignments() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const result = await apiCallWithAuth(`/courses/teacher/${user.id}`);
        if (result.success) {
            const teacherCourses = result.data.courses;
            allAssignments = [];

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

            const pendingAssignments = [];
            for (const assignment of allAssignments) {
                try {
                    const submissionResult = await apiCallWithAuth(`/submissions/assignment/${assignment._id}`);
                    if (submissionResult.success) {
                        const submissions = submissionResult.data.submissions;
                        const hasGradedSubmissions = submissions.some(sub => sub.grade !== undefined);

                        if (!hasGradedSubmissions) {
                            pendingAssignments.push(assignment);
                        }
                    } else {
                        pendingAssignments.push(assignment);
                    }
                } catch (error) {
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

// Load graded assignments
async function loadGradedAssignments() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const result = await apiCallWithAuth(`/courses/teacher/${user.id}`);
        if (result.success) {
            const teacherCourses = result.data.courses;
            allGradedAssignments = [];

            for (const course of teacherCourses) {
                try {
                    const assignmentResult = await apiCallWithAuth(`/assignments/course/${course._id}`);
                    if (assignmentResult.success) {
                        allGradedAssignments.push(...assignmentResult.data.assignments);
                    }
                } catch (error) {
                    console.error(`Error loading assignments for course ${course._id}:`, error);
                }
            }

            const gradedAssignments = [];
            for (const assignment of allGradedAssignments) {
                try {
                    const submissionResult = await apiCallWithAuth(`/submissions/assignment/${assignment._id}`);
                    if (submissionResult.success) {
                        const submissions = submissionResult.data.submissions;
                        const hasGradedSubmissions = submissions.some(sub => sub.grade !== undefined);

                        if (hasGradedSubmissions) {
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

// Load course grades
async function loadCourseGrades() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const result = await apiCallWithAuth(`/courses/teacher/${user.id}`);
        if (result.success) {
            const teacherCourses = result.data.courses;
            allGrades = [];
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

// Load teacher materials
async function loadTeacherMaterials() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const result = await apiCallWithAuth(`/courses/teacher/${user.id}`);
        if (result.success) {
            const teacherCourses = result.data.courses;
            allMaterials = [];

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

// Load teacher discussions
async function loadTeacherDiscussions() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const result = await apiCallWithAuth(`/courses/teacher/${user.id}`);
        if (result.success) {
            const teacherCourses = result.data.courses;
            allDiscussions = [];

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

// Update dashboard stats
async function updateDashboardStats() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const coursesResult = await apiCallWithAuth(`/courses/teacher/${user.id}`);
        if (coursesResult.success) {
            document.getElementById('coursesCount').textContent = coursesResult.data.courses.length;

            let assignmentsCount = 0;
            for (const course of coursesResult.data.courses) {
                const assignmentResult = await apiCallWithAuth(`/assignments/course/${course._id}`);
                if (assignmentResult.success) {
                    assignmentsCount += assignmentResult.data.assignments.length;
                }
            }
            document.getElementById('assignmentsCount').textContent = assignmentsCount;

            let studentsCount = 0;
            for (const course of coursesResult.data.courses) {
                studentsCount += course.enrolledStudents.length;
            }
            document.getElementById('studentsCount').textContent = studentsCount;
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
                <span class="course-description-text">${course.description}</span>
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

    container.querySelectorAll('.view-submissions-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const assignmentId = e.target.dataset.assignmentId;
            window.location.href = `view-submissions.html?assignmentId=${assignmentId}`;
        });
    });
}

function displayCourseGrades(grades, stats) {
    if (grades.length === 0) {
        courseGradesContainer.innerHTML = '<p>No grades calculated yet</p>';
        return;
    }

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

    courseGradesContainer.querySelectorAll('.calculate-grade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.target.dataset.studentId;
            const courseId = e.target.dataset.courseId;
            calculateStudentGrade(studentId, courseId);
        });
    });
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

// Additional functions
async function calculateStudentGrade(studentId, courseId) {
    try {
        const result = await apiCallWithAuth(`/grades/calculate/${studentId}/${courseId}`, {}, 'POST');

        if (result.success) {
            showMessage('Grade recalculated successfully!', 'success');
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.role === 'Teacher') {
                loadCourseGrades();
            }
        } else {
            showMessage(result.message || 'Failed to calculate grade');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to calculate grade');
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
    if (endpoint.includes('/courses/teacher/')) {
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
                    }
                ],
                count: 1
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

// Search functions for all tabs
function performAssignmentsSearch() {
    const assignmentsSearchInput = document.getElementById('assignmentsSearchInput');
    if (!assignmentsSearchInput) return;

    const searchTerm = assignmentsSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        loadTeacherAssignments();
        return;
    }

    // Filter assignments based on search term
    const filteredAssignments = allAssignments.filter(assignment => {
        return assignment.title.toLowerCase().includes(searchTerm) ||
                assignment.description.toLowerCase().includes(searchTerm) ||
                assignment.course.title.toLowerCase().includes(searchTerm);
    });

    displayAssignments(filteredAssignments, courseAssignmentsContainer, false, true);
}

function performGradedAssignmentsSearch() {
    const gradedAssignmentsSearchInput = document.getElementById('gradedAssignmentsSearchInput');
    if (!gradedAssignmentsSearchInput) return;

    const searchTerm = gradedAssignmentsSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        loadGradedAssignments();
        return;
    }

    // Filter graded assignments based on search term
    const filteredAssignments = allGradedAssignments.filter(assignment => {
        return assignment.title.toLowerCase().includes(searchTerm) ||
                assignment.description.toLowerCase().includes(searchTerm) ||
                assignment.course.title.toLowerCase().includes(searchTerm);
    });

    displayGradedAssignments(filteredAssignments, gradedAssignmentsContainer);
}

function performGradesSearch() {
    const gradesSearchInput = document.getElementById('gradesSearchInput');
    if (!gradesSearchInput) return;

    const searchTerm = gradesSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        loadCourseGrades();
        return;
    }

    // Filter grades based on search term
    const filteredGrades = allGrades.filter(grade => {
        return grade.student.name.toLowerCase().includes(searchTerm) ||
                grade.student.email.toLowerCase().includes(searchTerm) ||
                grade.course.title.toLowerCase().includes(searchTerm);
    });

    displayCourseGrades(filteredGrades, []);
}

function performMaterialsSearch() {
    const materialsSearchInput = document.getElementById('materialsSearchInput');
    if (!materialsSearchInput) return;

    const searchTerm = materialsSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        loadTeacherMaterials();
        return;
    }

    // Filter materials based on search term
    const filteredMaterials = allMaterials.filter(material => {
        return material.title.toLowerCase().includes(searchTerm) ||
                material.description.toLowerCase().includes(searchTerm) ||
                material.course.title.toLowerCase().includes(searchTerm) ||
                (material.tags && material.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
    });

    displayMaterials(filteredMaterials, courseMaterialsContainer);
}

function performDiscussionsSearch() {
    const discussionsSearchInput = document.getElementById('discussionsSearchInput');
    if (!discussionsSearchInput) return;

    const searchTerm = discussionsSearchInput.value.trim().toLowerCase();

    if (searchTerm === '') {
        loadTeacherDiscussions();
        return;
    }

    // Filter discussions based on search term
    const filteredDiscussions = allDiscussions.filter(discussion => {
        return discussion.title.toLowerCase().includes(searchTerm) ||
                discussion.content.toLowerCase().includes(searchTerm) ||
                discussion.author.name.toLowerCase().includes(searchTerm) ||
                (discussion.tags && discussion.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
    });

    displayDiscussions(filteredDiscussions, courseDiscussionsContainer, false);
}