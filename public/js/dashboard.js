let token = localStorage.getItem("zorvyn_token");
let user = JSON.parse(localStorage.getItem("zorvyn_user"));
let trendsChart, breakdownChart;

let currentPage = 1;
const recsLimit = 20;
let searchQuery = "";
let searchTimeout;
let isViewingDeleted = false;

// --- Initialize App ---
document.addEventListener("DOMContentLoaded", async () => {
    setupEventListeners();
    if (token) {
        const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
            handleLogout("Session expired, please log in again");
        } else {
            const data = await res.json();
            if (data.success) {
                user = data.data; // refresh user data
                localStorage.setItem("zorvyn_user", JSON.stringify(user));
                showDashboard();
            } else {
                handleLogout("Session expired, please log in again");
            }
        }
    } else {
        showAuth();
    }
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

    // Search and Pagination
    document.getElementById("search-input")?.addEventListener("input", handleSearch);
    document.getElementById("clear-filters-btn")?.addEventListener("click", () => {
        document.getElementById("search-input").value = "";
        searchQuery = "";
        currentPage = 1;
        fetchRecords();
    });
    document.getElementById("prev-page")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            fetchRecords();
        }
    });
    document.getElementById("next-page")?.addEventListener("click", () => {
        currentPage++;
        fetchRecords();
    });

    // Event Delegation for Table Actions (Edit/Delete/Restore)
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
        } else if (target.classList.contains("btn-restore")) {
            const id = target.getAttribute("data-id");
            restoreRecord(id);
        }
    });
    
    // View Deleted Toggle
    document.getElementById("view-active-btn")?.addEventListener("click", () => {
        isViewingDeleted = false;
        document.getElementById("view-active-btn").classList.add("active");
        document.getElementById("view-deleted-btn").classList.remove("active");
        currentPage = 1;
        fetchRecords();
    });
    document.getElementById("view-deleted-btn")?.addEventListener("click", () => {
        isViewingDeleted = true;
        document.getElementById("view-deleted-btn").classList.add("active");
        document.getElementById("view-active-btn").classList.remove("active");
        currentPage = 1;
        fetchRecords();
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

        if (res.status === 429) {
            showToast("Too many requests. Please slow down.");
            startLoginCooldown();
            return;
        }

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

        if (res.status === 429) {
            showToast("Too many requests. Please slow down.");
            startLoginCooldown();
            return;
        }

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

function handleLogout(eOrMessage) {
    let message = typeof eOrMessage === 'string' ? eOrMessage : null;
    if (eOrMessage && typeof eOrMessage === 'object' && eOrMessage.preventDefault) {
        eOrMessage.preventDefault();
    }
    token = null;
    user = null;
    localStorage.removeItem("zorvyn_token");
    localStorage.removeItem("zorvyn_user");
    showAuth();
    if (message) {
        const messageEl = document.getElementById("auth-message");
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.style.color = "var(--expense-color)";
        }
    }
}

// --- Dashboard Functions ---
function showAuth() {
    document.getElementById("auth-section").classList.remove("hidden");
    document.getElementById("dashboard-section").classList.add("hidden");

    // Setup authentication page tutorial
    const authSteps = [
        {
            title: "Welcome to Zorvyn",
            description:
                "Log in or register to securely access your financial dashboard.",
            position: "bottom",
        },
        {
            title: "Quick Testing",
            description:
                "Use these auto-login buttons to instantly test the system as an Admin, Analyst, or Viewer.",
            targetSelector: ".quick-access",
            position: "top",
        },
    ];
    if (typeof window.initPageTutorial === "function") {
        window.initPageTutorial("auth-page", authSteps);
    }
}

function showDashboard() {
    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("dashboard-section").classList.remove("hidden");
    document.getElementById("user-welcome").textContent =
        `Welcome back, ${user.name} (${user.role})`;

    // UI Role Checks
    const addBtn = document.getElementById("open-add-modal");
    const viewToggle = document.getElementById("records-view-toggle");
    if (user.role === "ADMIN") {
        addBtn.classList.remove("hidden");
        if (viewToggle) viewToggle.classList.remove("hidden");
    } else {
        addBtn.classList.add("hidden");
        if (viewToggle) viewToggle.classList.add("hidden");
    }

    refreshData().then(() => {
        // Fire tutorial config once DOM paints (only plays if not seen)
        const dashboardSteps = [
            {
                title: "Welcome",
                description:
                    "Welcome to your Finance Dashboard. This is your central view of all financial activity.",
                position: "bottom",
            },
            {
                title: "Summary Cards",
                description:
                    "These cards show your total income, expenses, and net balance at a glance.",
                targetSelector: ".stats-grid",
                position: "bottom",
            },
            { 
               title: 'Recent Activity', 
               description: 'Recent transactions are listed here. Click any row to see full details.', 
               targetSelector: '.records-card', 
               position: 'top' 
            },
            { 
               title: 'Account Settings', 
               description: 'Use the logout button to securely end your session when you are finished.', 
               targetSelector: '.header-right', 
               position: 'bottom' 
            }
        ];
        if (typeof window.initPageTutorial === "function") {
            window.initPageTutorial("dashboard-home", dashboardSteps);
        }
    });
}

async function refreshData() {
    await fetchSummary();
    await fetchTrends();
    await fetchBreakdown();
    await fetchRecords();
}

async function fetchSummary() {
    const data = await apiFetch("/api/dashboard/summary");
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

function handleSearch(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        currentPage = 1; // reset to first page
        fetchRecords();
    }, 400);
}

async function fetchRecords() {
    let endpoint = isViewingDeleted ? "/api/records/deleted" : "/api/records";
    let url = `${endpoint}?page=${currentPage}&limit=${recsLimit}`;
    if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
    }
    const data = await apiFetch(url);
    if (data) {
        const { records, pagination } = data;
        const list = document.getElementById("records-list");
        const noRecs = document.getElementById("no-records-message");
        const table = document.getElementById("records-table");

        if (records.length === 0) {
            table.classList.add("hidden");
            noRecs.classList.remove("hidden");
            document.getElementById("pagination-info").textContent = "Showing 0 records";
            const pageNumContainer = document.getElementById("page-numbers");
            if(pageNumContainer) pageNumContainer.innerHTML = "";
            return;
        } else {
            table.classList.remove("hidden");
            noRecs.classList.add("hidden");
        }

        list.innerHTML = records
            .map((record) => {
                let displayCat = record.category;
                let displayNotes = record.notes || "-";
                if (searchQuery) {
                    const regex = new RegExp(`(${searchQuery})`, "gi");
                    displayCat = displayCat.replace(regex, "<mark>$1</mark>");
                    if (record.notes) {
                        displayNotes = displayNotes.replace(regex, "<mark>$1</mark>");
                    }
                }
                
                let actionsHTML = '<span class="text-secondary">-</span>';
                if (user.role === "ADMIN") {
                    if (isViewingDeleted) {
                        actionsHTML = `<button class="btn-action btn-restore" data-id="${record.id}">↺ Restore</button>`;
                    } else {
                        actionsHTML = `
                            <button class="btn-action btn-edit" data-id="${record.id}">✎</button>
                            <button class="btn-action btn-delete" data-id="${record.id}">🗑</button>
                        `;
                    }
                }
                
                return `
            <tr>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td>${displayCat}</td>
                <td><span class="badge ${record.type.toLowerCase()}">${record.type}</span></td>
                <td class="${record.type === "INCOME" ? "income" : "expense"}">${formatCurrency(record.amount)}</td>
                <td>${displayNotes}</td>
                <td>${actionsHTML}</td>
            </tr>
        `})
            .join("");

        renderPagination(pagination);
    }
}

function renderPagination(pagination) {
    if (!pagination) return;
    const { total, page, limit, totalPages, hasNextPage, hasPrevPage } = pagination;
    const startRange = total === 0 ? 0 : (page - 1) * limit + 1;
    const endRange = Math.min(page * limit, total);
    
    document.getElementById("pagination-info").textContent = `Showing ${startRange}–${endRange} of ${total} records`;
    
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");
    prevBtn.disabled = !hasPrevPage;
    nextBtn.disabled = !hasNextPage;
    // Visually show disable state if not already handled by CSS
    prevBtn.style.opacity = hasPrevPage ? "1" : "0.5";
    nextBtn.style.opacity = hasNextPage ? "1" : "0.5";
    
    const pageNumContainer = document.getElementById("page-numbers");
    pageNumContainer.innerHTML = "";
    
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);
    
    if (page <= 2) endPage = Math.min(5, totalPages);
    if (page >= totalPages - 1) startPage = Math.max(1, totalPages - 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement("button");
        btn.className = `secondary-btn sm page-btn`;
        if (i === page) {
            btn.style.backgroundColor = "rgba(255, 255, 255, 0.1)"; // Active state
        }
        btn.textContent = i;
        btn.addEventListener("click", () => {
            currentPage = i;
            fetchRecords();
        });
        pageNumContainer.appendChild(btn);
    }
    
    currentPage = page;
}

async function fetchTrends() {
    const data = await apiFetch("/api/dashboard/trends");
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
    const data = await apiFetch("/api/dashboard/by-category");
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
    if (confirm("This record will be soft deleted and can be restored by an admin.")) {
        const data = await apiFetch(`/api/records/${id}`, { method: "DELETE" });
        if (data) refreshData();
    }
}

async function restoreRecord(id) {
    const data = await apiFetch(`/api/records/${id}/restore`, { method: "POST" });
    if (data) refreshData();
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.backgroundColor = "#ef4444";
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "8px";
    toast.style.zIndex = "9999";
    toast.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
    toast.style.transition = "opacity 0.3s ease";
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function startLoginCooldown() {
    const loginBtn = document.querySelector("#login-form button[type='submit']");
    const regBtn = document.querySelector("#register-form button[type='submit']");
    
    if (loginBtn.disabled) return; // already in cooldown
    
    const originalLoginText = loginBtn.textContent;
    const originalRegText = regBtn.textContent;
    
    loginBtn.disabled = true;
    regBtn.disabled = true;
    
    let secondsLeft = 60;
    loginBtn.textContent = `Try again in ${secondsLeft}s...`;
    regBtn.textContent = `Try again in ${secondsLeft}s...`;
    
    const interval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
            clearInterval(interval);
            loginBtn.disabled = false;
            regBtn.disabled = false;
            loginBtn.textContent = originalLoginText;
            regBtn.textContent = originalRegText;
        } else {
            loginBtn.textContent = `Try again in ${secondsLeft}s...`;
            regBtn.textContent = `Try again in ${secondsLeft}s...`;
        }
    }, 1000);
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
        if (res.status === 429) {
            showToast("Too many requests. Please slow down.");
            return null;
        }

        const data = await res.json();

        if (res.status === 401) {
            handleLogout("Session expired, please log in again");
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
