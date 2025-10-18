// API base URL - change this to your backend URL
const API_BASE_URL = 'http://localhost:5000/api';

// DOM elements
const profileForm = document.getElementById('profileForm');
const profilePicturePreview = document.getElementById('profilePicturePreview');
const profilePictureInput = document.getElementById('profilePictureInput');
const profilePictureContainer = document.querySelector('.profile-picture-container');
const removePictureBtn = document.getElementById('removePictureBtn');
const successModal = document.getElementById('successModal');
const closeSuccessModal = document.getElementById('closeSuccessModal');
const cancelBtn = document.getElementById('cancelBtn');
const bioTextarea = document.getElementById('bio');
const bioCharCount = document.getElementById('bioCharCount');

// Form fields
const nameField = document.getElementById('name');
const emailField = document.getElementById('email');
const roleField = document.getElementById('role');
const createdAtField = document.getElementById('createdAt');
const mobileNumberField = document.getElementById('mobileNumber');
const dateOfBirthField = document.getElementById('dateOfBirth');
const addressField = document.getElementById('address');
const bioField = document.getElementById('bio');

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
    const authContainer = document.querySelector('.auth-container');
    authContainer.insertBefore(messageDiv, authContainer.firstChild);

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

    console.log(`Making ${method} request to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    console.log(`Response status: ${response.status}`);

    const result = await response.json();
    console.log('Response data:', result);

    if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
    }

    return result;
};

// Load user profile
async function loadProfile() {
    try {
        console.log('Loading profile...');

        // First test if auth routes are accessible
        console.log('Testing auth routes...');
        const debugResult = await fetch(`${API_BASE_URL}/debug-auth`);
        console.log('Debug auth result:', debugResult.status);

        const result = await apiCallWithAuth('/auth/profile');
        console.log('Profile loaded:', result);
        const user = result.data.user;

        // Populate read-only fields
        nameField.value = user.name || '';
        emailField.value = user.email || '';
        roleField.value = user.role || '';
        createdAtField.value = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '';

        // Populate editable fields
        mobileNumberField.value = user.mobileNumber || '';
        dateOfBirthField.value = user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '';
        addressField.value = user.address || '';
        bioField.value = user.bio || '';

        // Update character count for bio
        updateBioCharCount();

        // Handle profile picture
        if (user.profilePicture) {
            profilePicturePreview.src = `http://localhost:5000/uploads/profiles/${user.profilePicture}`;
            profilePicturePreview.style.display = 'block';
            removePictureBtn.style.display = 'inline-block';
        } else {
            profilePicturePreview.src = '';
            profilePicturePreview.style.display = 'none';
            removePictureBtn.style.display = 'none';
        }

    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('Error loading profile: ' + error.message, 'error');
    }
}

// Update bio character count
function updateBioCharCount() {
    const count = bioField.value.length;
    bioCharCount.textContent = count;
}

// Handle profile picture upload
function handleProfilePictureUpload(file) {
    if (file) {
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

        // Preview the image
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePicturePreview.src = e.target.result;
            profilePicturePreview.style.display = 'block';
            removePictureBtn.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }
}

// Remove profile picture
function removeProfilePicture() {
    profilePicturePreview.src = '';
    profilePicturePreview.style.display = 'none';
    profilePictureInput.value = '';
    removePictureBtn.style.display = 'none';
}

// Handle form submission
async function handleProfileUpdate(e) {
    e.preventDefault();

    const submitBtn = profileForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const formData = new FormData();

        // Add editable fields
        if (mobileNumberField.value.trim()) {
            formData.append('mobileNumber', mobileNumberField.value.trim());
        }
        if (dateOfBirthField.value) {
            formData.append('dateOfBirth', dateOfBirthField.value);
        }
        if (addressField.value.trim()) {
            formData.append('address', addressField.value.trim());
        }
        if (bioField.value.trim()) {
            formData.append('bio', bioField.value.trim());
        }

        // Add profile picture if selected
        if (profilePictureInput.files[0]) {
            formData.append('profilePicture', profilePictureInput.files[0]);
        }

        // Make API call
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showMessage('Profile updated successfully!', 'success');
            successModal.classList.remove('hidden');

            // Update local storage with new profile data
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...currentUser, ...result.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
            showMessage(result.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Error updating profile', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Check authentication
function checkAuth() {
    const token = getToken();
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'index.html';
        return false;
    }

    try {
        const userData = JSON.parse(user);
        return true;
    } catch (error) {
        window.location.href = 'index.html';
        return false;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    loadProfile();

    // Event listeners
    profileForm.addEventListener('submit', handleProfileUpdate);

    // Profile picture upload
    profilePictureContainer.addEventListener('click', () => {
        profilePictureInput.click();
    });

    profilePictureInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleProfilePictureUpload(file);
    });

    // Remove picture button
    removePictureBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeProfilePicture();
    });

    // Bio character count
    bioField.addEventListener('input', updateBioCharCount);

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            window.location.href = 'index.html';
        }
    });

    // Success modal
    closeSuccessModal.addEventListener('click', () => {
        successModal.classList.add('hidden');
    });

    // Close modal when clicking outside
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.add('hidden');
        }
    });
});