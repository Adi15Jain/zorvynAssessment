let token = localStorage.getItem("zorvyn_token");
let user = JSON.parse(localStorage.getItem("zorvyn_user"));
let trendsChart, breakdownChart;

// --- Initialize App ---
document.addEventListener("DOMContentLoaded", () => {
    if (token) {
        showDashboard();
    } else {
        showAuth();
    }
    setupEventListeners();
});

function setupEventListeners() {
    // Auth Forms
    document
        .getElementById("login-form")
        .addEventListener("submit", handleLogin);
    document
        .getElementById("register-form")
        .addEventListener("submit", handleRegister);
    document
        .getElementById("logout-btn")
        .addEventListener("click", handleLogout);

    // Tab Switching
    document
        .getElementById("tab-login")
        .addEventListener("click", () => switchAuthTab("login"));
    document
        .getElementById("tab-register")
        .addEventListener("click", () => switchAuthTab("register"));

    // Record Modal and Form
    document
        .getElementById("open-add-modal")
        .addEventListener("click", toggleRecordModal);
    document
        .getElementById("close-modal")
        .addEventListener("click", toggleRecordModal);
    document
        .getElementById("record-form")
        .addEventListener("submit", handleRecordSubmit);

    // Quick Login Buttons
    document.querySelectorAll(".quick-btn").forEach((btn) => {
        btn.addEventListener("click", () => handleQuickLogin(btn.dataset.role));
    });

    // Event Delegation for Table Actions (Edit/Delete)
    document.getElementById("records-list").addEventListener("click", (e) => {
        // Only allow if admin (though buttons are hidden for others)
        if (user.role !== "ADMIN") return;

        const target = e.target;
        if (target.classList.contains("btn-edit")) {
            const id = target.getAttribute("data-id");
            editRecord(id);
        } else if (target.classList.contains("btn-delete")) {
            const id = target.getAttribute("data-id");
            deleteRecord(id);
        }
    });
}

// --- Auth Functions ---
async function handleQuickLogin(role) {
    const credentials = {
        admin: { email: "admin@finance.local", password: "password123" },
        analyst: { email: "analyst@finance.local", password: "password123" },
        viewer: { email: "viewer@finance.local", password: "password123" },
    };

    const { email, password } = credentials[role];
    document.getElementById("login-email").value = email;
    document.getElementById("login-password").value = password;

    // Switch to login tab if not already there
    switchAuthTab("login");

    // Small delay to show the filling, then submit
    setTimeout(() => {
        document
            .getElementById("login-form")
            .dispatchEvent(new Event("submit"));
    }, 100);
}
function switchAuthTab(tab) {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const tabs = document.querySelectorAll(".tab-btn");

    if (tab === "login") {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        tabs[0].classList.add("active");
        tabs[1].classList.remove("active");
    } else {
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        tabs[0].classList.remove("active");
        tabs[1].classList.add("active");
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const messageEl = document.getElementById("auth-message");

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (data.success) {
            token = data.data.token;
            user = data.data.user;
            localStorage.setItem("zorvyn_token", token);
            localStorage.setItem("zorvyn_user", JSON.stringify(user));
            showDashboard();
        } else {
            messageEl.textContent = data.message;
            messageEl.style.color = "var(--expense-color)";
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const messageEl = document.getElementById("auth-message");

    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (data.success) {
            messageEl.textContent = "Account created! Please login.";
            messageEl.style.color = "var(--income-color)";
            switchAuthTab("login");
        } else {
            messageEl.textContent = data.message;
            messageEl.style.color = "var(--expense-color)";
        }
    } catch (err) {
        console.error(err);
    }
}

function handleLogout() {
    token = null;
    user = null;
    localStorage.removeItem("zorvyn_token");
    localStorage.removeItem("zorvyn_user");
    showAuth();
}

// --- Dashboard Functions ---
function showAuth() {
    document.getElementById("auth-section").classList.remove("hidden");
    document.getElementById("dashboard-section").classList.add("hidden");
}

function showDashboard() {
    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("dashboard-section").classList.remove("hidden");
    document.getElementById("user-welcome").textContent =
        `Welcome back, ${user.name} (${user.role})`;

    // UI Role Checks
    const addBtn = document.getElementById("open-add-modal");
    if (user.role === "ADMIN") {
        addBtn.classList.remove("hidden");
    } else {
        addBtn.classList.add("hidden");
    }

    refreshData();
}

async function refreshData() {
    await fetchSummary();
    await fetchTrends();
    await fetchBreakdown();
    await fetchRecords();
}

async function fetchSummary() {
    const data = await apiFetch("/api/analytics/summary");
    if (data) {
        document.getElementById("total-income").textContent = formatCurrency(
            data.totalIncome,
        );
        document.getElementById("total-expense").textContent = formatCurrency(
            data.totalExpense,
        );
        document.getElementById("total-balance").textContent = formatCurrency(
            data.balance,
        );
    }
}

async function fetchRecords() {
    const data = await apiFetch("/api/records");
    if (data) {
        const list = document.getElementById("records-list");
        list.innerHTML = data
            .map(
                (record) => `
            <tr>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td>${record.category}</td>
                <td><span class="badge ${record.type.toLowerCase()}">${record.type}</span></td>
                <td class="${record.type === "INCOME" ? "income" : "expense"}">${formatCurrency(record.amount)}</td>
                <td>${record.notes || "-"}</td>
                <td>
                    ${
                        user.role === "ADMIN"
                            ? `
                        <button class="btn-action btn-edit" data-id="${record.id}">✎</button>
                        <button class="btn-action btn-delete" data-id="${record.id}">🗑</button>
                    `
                            : '<span class="text-secondary">-</span>'
                    }
                </td>
            </tr>
        `,
            )
            .join("");
    }
}

async function fetchTrends() {
    const data = await apiFetch("/api/analytics/trends");
    if (data) {
        const labels = data.map((d) => d.month);
        const incomeData = data.map((d) => d.income);
        const expenseData = data.map((d) => d.expense);

        if (trendsChart) {
            trendsChart.data.labels = labels;
            trendsChart.data.datasets[0].data = incomeData;
            trendsChart.data.datasets[1].data = expenseData;
            trendsChart.update();
        } else {
            const ctx = document.getElementById("trendsChart").getContext("2d");
            trendsChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels,
                    datasets: [
                        {
                            label: "Income",
                            data: incomeData,
                            borderColor: "#10b981",
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            tension: 0.4,
                            fill: true,
                        },
                        {
                            label: "Expense",
                            data: expenseData,
                            borderColor: "#ef4444",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            tension: 0.4,
                            fill: true,
                        },
                    ],
                },
                options: chartOptions,
            });
        }
    }
}

async function fetchBreakdown() {
    const data = await apiFetch("/api/analytics/breakdown");
    if (data) {
        const labels = data.map((d) => d.category);
        const values = data.map((d) => d.total);

        if (breakdownChart) {
            breakdownChart.data.labels = labels;
            breakdownChart.data.datasets[0].data = values;
            breakdownChart.update();
        } else {
            const ctx = document
                .getElementById("breakdownChart")
                .getContext("2d");
            breakdownChart = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels,
                    datasets: [
                        {
                            data: values,
                            backgroundColor: [
                                "#6366f1",
                                "#a855f7",
                                "#ec4899",
                                "#f59e0b",
                                "#10b981",
                                "#3b82f6",
                            ],
                            borderWidth: 0,
                        },
                    ],
                },
                options: {
                    ...chartOptions,
                    cutout: "70%",
                    plugins: {
                        ...chartOptions.plugins,
                        legend: {
                            position: "bottom",
                            labels: { color: "#94a3b8" },
                        },
                    },
                },
            });
        }
    }
}

// --- Record CRUD ---
function toggleRecordModal() {
    const modal = document.getElementById("record-modal");
    modal.classList.toggle("hidden");
    if (modal.classList.contains("hidden")) {
        document.getElementById("record-form").reset();
        document.getElementById("edit-id").value = "";
        document.getElementById("modal-title").textContent = "Add New Record";
    }
}

async function handleRecordSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("edit-id").value;
    const body = {
        type: document.getElementById("rec-type").value,
        category: document.getElementById("rec-category").value,
        amount: parseFloat(document.getElementById("rec-amount").value),
        date: document.getElementById("rec-date").value,
        notes: document.getElementById("rec-notes").value,
    };

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/records/${id}` : "/api/records";

    const data = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (data) {
        toggleRecordModal();
        refreshData();
    }
}

async function editRecord(id) {
    const record = await apiFetch(`/api/records/${id}`);
    if (record) {
        document.getElementById("edit-id").value = record.id;
        document.getElementById("rec-type").value = record.type;
        document.getElementById("rec-category").value = record.category;
        document.getElementById("rec-amount").value = record.amount;
        document.getElementById("rec-date").value = record.date.split("T")[0];
        document.getElementById("rec-notes").value = record.notes || "";
        document.getElementById("modal-title").textContent = "Edit Record";
        toggleRecordModal();
    }
}

async function deleteRecord(id) {
    if (confirm("Are you sure you want to delete this record?")) {
        const data = await apiFetch(`/api/records/${id}`, { method: "DELETE" });
        if (data) refreshData();
    }
}

// --- Helper Functions ---
async function apiFetch(url, options = {}) {
    if (!token) return showAuth();

    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
    };

    try {
        const res = await fetch(url, options);
        const data = await res.json();

        if (res.status === 401) {
            handleLogout();
            return null;
        }

        if (data.success) return data.data;

        alert(data.message || "Operation failed");
        return null;
    } catch (err) {
        console.error(err);
        return null;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 800,
    },
    plugins: {
        legend: {
            display: true,
            labels: { color: "#94a3b8", font: { size: 12 } },
        },
    },
    scales: {
        y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#94a3b8", font: { size: 10 } },
        },
        x: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#94a3b8", font: { size: 10 } },
        },
    },
};
