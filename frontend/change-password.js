// API base URL - change this to your backend URL
const API_BASE_URL = 'http://localhost:5000/api';

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

    // Insert message at the top of the form
    const formContainer = document.querySelector('.form-container');
    formContainer.insertBefore(messageDiv, formContainer.firstChild);

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
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-save"></i> Change Password';
    }
};

const getToken = () => {
    return localStorage.getItem('token');
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

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = [];

    if (password.length >= 8) strength++;
    else feedback.push('At least 8 characters');

    if (/[a-z]/.test(password)) strength++;
    else feedback.push('Lowercase letter');

    if (/[A-Z]/.test(password)) strength++;
    else feedback.push('Uppercase letter');

    if (/[0-9]/.test(password)) strength++;
    else feedback.push('Number');

    if (/[^A-Za-z0-9]/.test(password)) strength++;
    else feedback.push('Special character');

    return { strength, feedback };
}

// Update password strength indicator
function updatePasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    const { strength } = checkPasswordStrength(password);

    // Reset classes
    strengthBar.className = 'strength-bar';

    if (strength <= 1) {
        strengthBar.classList.add('weak');
        strengthText.textContent = 'Weak password';
    } else if (strength <= 3) {
        strengthBar.classList.add('medium');
        strengthText.textContent = 'Medium password';
    } else {
        strengthBar.classList.add('strong');
        strengthText.textContent = 'Strong password';
    }

    // Set width based on strength
    const width = (strength / 5) * 100;
    strengthBar.style.width = width + '%';
}

// Real-time password confirmation validation
function validatePasswordConfirmation() {
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (confirmPassword.value && newPassword.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
    } else {
        confirmPassword.setCustomValidity('');
    }
}

// Form submission handler
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    try {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // Validate passwords match
        if (data.newPassword !== data.confirmPassword) {
            showMessage('New passwords do not match', 'error');
            return;
        }

        // Validate password strength
        const { strength } = checkPasswordStrength(data.newPassword);
        if (strength < 2) {
            showMessage('Password is too weak. Please choose a stronger password.', 'error');
            return;
        }

        const result = await apiCallWithAuth('/auth/change-password', data, 'PUT');

        if (result.success) {
            showMessage('Password changed successfully!', 'success');

            // Clear form
            e.target.reset();

            // Reset password strength indicator
            document.getElementById('strengthBar').style.width = '0%';
            document.getElementById('strengthText').textContent = 'Password strength';

            // Redirect to dashboard after success
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showMessage(result.message || 'Failed to change password');
        }
    } catch (error) {
        showMessage(error.message || 'Failed to change password');
    } finally {
        setLoading(submitBtn, false);
    }
});

// Event listeners for real-time validation
document.getElementById('newPassword').addEventListener('input', updatePasswordStrength);
document.getElementById('confirmPassword').addEventListener('input', validatePasswordConfirmation);

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = getToken();
    if (!token) {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
    }
});