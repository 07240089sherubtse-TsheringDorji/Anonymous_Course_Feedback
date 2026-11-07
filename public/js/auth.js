
const API_BASE = '/api';

function showMessage(message, type = 'error') {
    const messageBox = document.getElementById('authMessage');

    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `form-message show ${type}`;
}

function getResponseMessage(data, fallback) {
    return data?.message || data?.error || fallback;
}

function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

// Student registration
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword =
            document.getElementById('confirmPassword').value;
        const button = document.getElementById('registerButton');

        if (password !== confirmPassword) {
            showMessage('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            showMessage('Password must contain at least 8 characters.');
            return;
        }

        button.disabled = true;
        button.textContent = 'Creating account...';

        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    getResponseMessage(data, 'Registration failed.')
                );
            }

            showMessage(
                'Registration successful! You can now sign in.',
                'success'
            );

            registerForm.reset();

            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);

        } catch (error) {
            showMessage(error.message || 'Unable to connect to the server.');
        } finally {
            button.disabled = false;
            button.textContent = 'Create Student Account';
        }
    });
}

// Student and administrator login
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const button = document.getElementById('loginButton');

        button.disabled = true;
        button.textContent = 'Signing in...';

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    getResponseMessage(data, 'Login failed.')
                );
            }

            const result = data.data || data;
            const token =
                result.token ||
                result.accessToken ||
                result.access_token;

            if (!token) {
                throw new Error(
                    'Login response did not contain a token. Please check the backend login response.'
                );
            }

            const tokenPayload = decodeToken(token);
            const user = result.user || result.account || {};

            const role = user.role || result.role || tokenPayload?.role;

            if (!role) {
                throw new Error(
                    'Login succeeded, but the account role was not found in the response.'
                );
            }

            if (role !== 'student' && role !== 'admin') {
                throw new Error('This account has an unsupported role.');
            }

            localStorage.setItem('authToken', token);
            localStorage.setItem('userRole', role);

            if (user.name) {
                localStorage.setItem('userName', user.name);
            }

            if (user.email || email) {
                localStorage.setItem('userEmail', user.email || email);
            }

            showMessage('Login successful. Redirecting...', 'success');

            setTimeout(() => {
                window.location.href =
                    role === 'admin'
                        ? '/admin.html'
                        : '/student.html';
            }, 700);

        } catch (error) {
            showMessage(error.message || 'Unable to connect to the server.');
        } finally {
            button.disabled = false;
            button.textContent = 'Sign In';
        }
    });
}
