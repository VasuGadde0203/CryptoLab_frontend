document.addEventListener("DOMContentLoaded", () => {
    setupAuthForms();

    // Setup form toggle links
    document.getElementById("show-register").addEventListener("click", (e) => {
        e.preventDefault();
        toggleForms();
    });

    document.getElementById("show-login").addEventListener("click", (e) => {
        e.preventDefault();
        toggleForms();
    });
});

const API_BASE_URL = "http://localhost:8000"; // Update with your FastAPI backend URL

async function registerUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Registration failed");
        }
        return data;
    } catch (error) {
        throw error;
    }
}

async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Login failed");
        }
        return data;
    } catch (error) {
        throw error;
    }
}

function setupAuthForms() {
    const loginForm = document.getElementById("login-form-element");
    const registerForm = document.getElementById("register-form-element");
    const loginError = document.getElementById("login-error");
    const registerError = document.getElementById("register-error");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            const response = await loginUser(email, password);
            localStorage.setItem("access_token", response.access_token);
            localStorage.setItem("user_id", response.user_id);
            loginError.style.display = "none";
            // Redirect to dashboard or homepage
            window.location.href = "/frontend/home/html/dashboard.html"// Update with actual dashboard page
        } catch (error) {
            loginError.textContent = error.message;
            loginError.style.display = "block";
        }
    });

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;

        try {
            const response = await registerUser(email, password);
            registerError.style.display = "none";
            // Automatically switch to login form after successful registration
            toggleForms();
        } catch (error) {
            registerError.textContent = error.message;
            registerError.style.display = "block";
        }
    });
}

function toggleForms() {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (loginForm.style.display === "none") {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
    } else {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
    }
}