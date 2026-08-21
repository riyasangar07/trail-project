// DKTE YCP Diploma Newsletter Portal - Application Engine

// Global State
const state = {
    currentView: 'landing',
    historyStack: ['landing'],
    currentUser: null,
    departments: [],
    selectedDepartment: null,
    selectedDepartmentData: null,
    newsletters: [],
    activeDashboardTab: 'about',
    activeStaffTab: 'details',
    activeAdminTab: 'analytics',
    searchQuery: '',
    charts: {}
};

// UI Elements Cache
const elements = {
    mainContent: document.getElementById('main-content'),
    body: document.getElementById('body-root'),
    toastContainer: document.getElementById('toast-container'),
    mobileMenu: document.getElementById('mobile-menu'),
    modalWrapper: document.getElementById('global-modal-wrapper'),
    modalBox: document.getElementById('global-modal-box'),
    authNavContainer: document.getElementById('auth-nav-container'),
    mobileAuthContainer: document.getElementById('mobile-auth-container')
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkAuthStatus();
    loadDepartments();
    loadAllNewsletters();
    
    // Set up popstate or initial render
    navigateTo('landing');
});

// ==========================================
// NAVIGATION & ROUTING
// ==========================================
function navigateTo(viewName, params = {}) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
    });

    state.currentView = viewName;
    if (state.historyStack[state.historyStack.length - 1] !== viewName) {
        state.historyStack.push(viewName);
    }

    const viewElement = document.getElementById(`view-${viewName}`);
    if (viewElement) {
        viewElement.classList.remove('hidden');
        viewElement.classList.add('animate-fade-in');
    }

    // Custom view trigger handlers
    if (viewName === 'landing') {
        renderLanding();
    } else if (viewName === 'all-newsletters') {
        renderAllNewsletters();
    } else if (viewName === 'dept-dashboard' && params.code) {
        loadDepartmentDashboard(params.code);
    } else if (viewName === 'admin-dashboard') {
        loadAdminDashboard();
    } else if (viewName === 'staff-dashboard') {
        loadStaffDashboard();
    } else if (viewName === 'contact-general') {
        renderGeneralContactForm();
    }

    // Refresh icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateBack() {
    if (state.historyStack.length > 1) {
        state.historyStack.pop(); // Remove current view
        const prevView = state.historyStack[state.historyStack.length - 1];
        navigateTo(prevView);
    } else {
        navigateTo('landing');
    }
}

function scrollToSection(id) {
    // If not on landing page, go to landing page first
    if (state.currentView !== 'landing') {
        navigateTo('landing');
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } else {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==========================================
// TOAST ALERT SYSTEM
// ==========================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-5 py-4 bg-white border rounded-2xl shadow-xl animate-fade-in transition-all duration-300 max-w-sm dark:bg-dkte-darkCard ${
        type === 'success' ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20' :
        type === 'error' ? 'border-red-500/30 bg-red-50/50 dark:bg-red-950/20' :
        'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20'
    }`;

    let icon = 'info';
    let iconColor = 'text-blue-500';
    if (type === 'success') {
        icon = 'check-circle';
        iconColor = 'text-green-500';
    } else if (type === 'error') {
        icon = 'alert-triangle';
        iconColor = 'text-red-500';
    }

    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5 ${iconColor}"></i>
        <div class="flex-grow text-xs font-semibold text-slate-800 dark:text-slate-200">${message}</div>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
    `;

    elements.toastContainer.appendChild(toast);
    
    if (window.lucide) {
        window.lucide.createIcons();
    }

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// THEME CONTROL (DARK/LIGHT MODE)
// ==========================================
function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-sun-icon').classList.remove('hidden');
        document.getElementById('theme-moon-icon').classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('theme-sun-icon').classList.add('hidden');
        document.getElementById('theme-moon-icon').classList.remove('hidden');
    }
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
    
    if (isDark) {
        document.getElementById('theme-sun-icon').classList.remove('hidden');
        document.getElementById('theme-moon-icon').classList.add('hidden');
        showToast('Switched to Dark Mode', 'info');
    } else {
        document.getElementById('theme-sun-icon').classList.add('hidden');
        document.getElementById('theme-moon-icon').classList.remove('hidden');
        showToast('Switched to Light Mode', 'info');
    }
}

function toggleMobileMenu() {
    const isHidden = elements.mobileMenu.classList.toggle('hidden');
    document.getElementById('menu-burger-icon').classList.toggle('hidden', !isHidden);
    document.getElementById('menu-close-icon').classList.toggle('hidden', isHidden);
}

// ==========================================
// AUTHENTICATION FLOW
// ==========================================
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status/');
        if (response.ok) {
            const data = await response.json();
            state.currentUser = data;
            renderAuthNavbar(true);
        } else {
            state.currentUser = null;
            renderAuthNavbar(false);
        }
    } catch (err) {
        state.currentUser = null;
        renderAuthNavbar(false);
    }
}

function renderAuthNavbar(isLoggedIn) {
    if (isLoggedIn && state.currentUser) {
        const dashboardBtn = state.currentUser.role === 'SUPER_ADMIN' 
            ? `<button onclick="navigateTo('admin-dashboard')" class="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Admin Panel</button>`
            : `<button onclick="navigateTo('staff-dashboard')" class="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-950 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"><i data-lucide="sliders" class="w-3.5 h-3.5"></i> Staff Dashboard (${state.currentUser.department_code})</button>`;

        const navHtml = `
            <div class="flex items-center gap-3">
                ${dashboardBtn}
                <button onclick="handleLogout()" class="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-red-500 transition-colors" title="Log Out">
                    <i data-lucide="log-out" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        elements.authNavContainer.innerHTML = navHtml;
        elements.mobileAuthContainer.innerHTML = `
            <div class="w-full space-y-2">
                ${state.currentUser.role === 'SUPER_ADMIN' 
                    ? `<button onclick="toggleMobileMenu(); navigateTo('admin-dashboard')" class="w-full py-2.5 bg-orange-500 text-white rounded-xl text-xs font-semibold">Admin Panel</button>`
                    : `<button onclick="toggleMobileMenu(); navigateTo('staff-dashboard')" class="w-full py-2.5 bg-blue-700 text-white rounded-xl text-xs font-semibold">Staff Dashboard</button>`
                }
                <button onclick="toggleMobileMenu(); handleLogout()" class="w-full py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">Log Out</button>
            </div>
        `;
    } else {
        elements.authNavContainer.innerHTML = `
            <button onclick="navigateTo('login')" class="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-700 to-blue-850 hover:from-blue-800 hover:to-blue-900 text-white rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg transition-all flex items-center gap-2">
                <i data-lucide="log-in" class="w-3.5 h-3.5"></i> Staff Login
            </button>
        `;
        elements.mobileAuthContainer.innerHTML = `
            <button onclick="toggleMobileMenu(); navigateTo('login')" class="w-full py-2.5 bg-blue-700 text-white rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2">
                <i data-lucide="log-in" class="w-4 h-4"></i> Staff Login
            </button>
        `;
    }
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/auth/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            state.currentUser = data.user;
            showToast(`Welcome back, ${data.user.username}!`, 'success');
            renderAuthNavbar(true);
            form.reset();
            
            if (data.user.role === 'SUPER_ADMIN') {
                navigateTo('admin-dashboard');
            } else {
                navigateTo('staff-dashboard');
            }
        } else {
            const err = await response.json();
            showToast(err.error || 'Login failed.', 'error');
        }
    } catch (err) {
        showToast('Server communication error during login.', 'error');
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout/', { method: 'POST' });
        if (response.ok) {
            state.currentUser = null;
            showToast('Logged out successfully.', 'success');
            renderAuthNavbar(false);
            navigateTo('landing');
        }
    } catch (err) {
        showToast('Logout communication failed.', 'error');
    }
}

// ==========================================
// API DATA RETRIEVAL
// ==========================================
async function loadDepartments() {
    try {
        const response = await fetch('/api/departments/');
        if (response.ok) {
            state.departments = await response.json();
            renderLanding();
            populateContactDeptDropdown();
        }
    } catch (err) {
        console.error('Failed to load departments.', err);
    }
}

async function loadAllNewsletters() {
    try {
        const response = await fetch('/api/newsletters/');
        if (response.ok) {
            state.newsletters = await response.json();
        }
    } catch (err) {
        console.error('Failed to load newsletters.', err);
    }
}

function populateContactDeptDropdown() {
    const select = document.getElementById('contact-dept-dropdown');
    if (!select) return;
    select.innerHTML = '<option value="">Global (General Enquiry)</option>' + 
        state.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

// ==========================================
// LANDING PAGE RENDER
// ==========================================
function renderLanding() {
    const grid = document.getElementById('departments-cards-grid');
    if (!grid) return;

    if (state.departments.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-10 text-center text-slate-400 font-semibold">No departments found. Please run seed_data.py or add departments.</div>`;
        return;
    }

    // Set fallback local department images for beautiful aesthetics
    const images = {
        'CSE': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
        'AIML': 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80',
        'ENTC': 'https://images.unsplash.com/photo-1517420784867-114f6e4d89a4?auto=format&fit=crop&w=600&q=80',
        'MECH': 'https://images.unsplash.com/photo-1537462715879-360eeb61a0bc?auto=format&fit=crop&w=600&q=80',
        'CIVIL': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80',
        'EE': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80',
        'MECHATRONICS': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80',
    };

    grid.innerHTML = state.departments.map(dept => {
        const bgImg = dept.logo || images[dept.code] || 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80';
        return `
            <div class="group relative flex flex-col h-[320px] bg-slate-900 text-white rounded-2xl overflow-hidden shadow-lg hover-lift">
                <!-- Background Image Overlay -->
                <div class="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500" style="background-image: url('${bgImg}')"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                
                <!-- Card content -->
                <div class="relative z-10 flex-grow p-6 flex flex-col justify-end">
                    <span class="inline-block self-start px-2 py-0.5 text-[9px] font-extrabold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded uppercase tracking-wider mb-2">${dept.code}</span>
                    <h4 class="text-xl font-bold tracking-tight text-white group-hover:text-orange-400 transition-colors mb-2">${dept.name}</h4>
                    <p class="text-xs text-slate-300 font-light line-clamp-2 mb-4 leading-relaxed">${dept.vision || 'Nurturing technology professionals of tomorrow.'}</p>
                    
                    <button onclick="navigateTo('dept-dashboard', {code: '${dept.code}'})" class="w-full py-2.5 bg-white/10 hover:bg-orange-500 text-white text-xs font-bold rounded-xl border border-white/20 hover:border-transparent transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider">
                        View Department <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ==========================================
// ALL NEWSLETTERS LIST & SEARCH
// ==========================================
function renderAllNewsletters() {
    const grid = document.getElementById('all-newsletters-grid');
    if (!grid) return;

    const query = document.getElementById('newsletter-search-input').value.toLowerCase();
    
    // Filter newsletters
    const filtered = state.newsletters.filter(nl => {
        return nl.title.toLowerCase().includes(query) || 
               nl.description.toLowerCase().includes(query) || 
               nl.department_name.toLowerCase().includes(query) ||
               nl.department_code.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-16 text-center text-slate-400 font-medium"><i data-lucide="alert-circle" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i> No newsletters match your search query.</div>`;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    grid.innerHTML = filtered.map(nl => {
        const publishDate = new Date(nl.publish_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        return `
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm dark:bg-dkte-darkCard dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between h-[300px]">
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="px-2 py-0.5 text-[9px] font-extrabold text-blue-700 bg-blue-100 rounded dark:bg-orange-500/10 dark:text-orange-400 uppercase tracking-wider">${nl.department_code}</span>
                        <span class="text-[10px] text-slate-400 font-semibold"><i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i>${publishDate}</span>
                    </div>
                    <h4 class="text-md font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1">${nl.title}</h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-4 leading-relaxed">${nl.description}</p>
                </div>
                
                <button onclick="readNewsletter(${nl.id})" class="w-full mt-4 py-2.5 bg-slate-50 hover:bg-blue-600 dark:bg-slate-900 dark:hover:bg-orange-500 text-slate-700 dark:text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:border-transparent transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider">
                    Read Newsletter <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;
    }).join('');

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function searchNewsletters() {
    renderAllNewsletters();
}

async function readNewsletter(nlId) {
    try {
        const response = await fetch(`/api/newsletters/`);
        if (response.ok) {
            const list = await response.json();
            const nl = list.find(item => item.id === nlId);
            if (!nl) return;

            navigateTo('newsletter-reader');
            const readerContent = document.getElementById('newsletter-reader-content');
            
            const publishDate = new Date(nl.publish_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
            
            let pdfLink = '';
            if (nl.pdf_attachment) {
                pdfLink = `
                    <div class="p-5 rounded-2xl bg-blue-50 border border-blue-100 dark:bg-slate-900 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-orange-400"><i data-lucide="file-text" class="w-5 h-5"></i></div>
                            <div>
                                <h5 class="text-xs font-bold text-slate-900 dark:text-white">Newsletter PDF Attachment</h5>
                                <p class="text-[10px] text-slate-400">Download and read full newsletter offline.</p>
                            </div>
                        </div>
                        <a href="${nl.pdf_attachment}" download class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 uppercase tracking-wider shadow-md">
                            <i data-lucide="download" class="w-3.5 h-3.5"></i> Download Attachment
                        </a>
                    </div>
                `;
            }

            readerContent.innerHTML = `
                <div class="space-y-6">
                    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
                        <div class="space-y-1.5">
                            <span class="px-2.5 py-1 text-[9px] font-extrabold text-blue-700 bg-blue-50 dark:bg-orange-500/10 dark:text-orange-400 rounded uppercase tracking-wider">${nl.department_name} (${nl.department_code})</span>
                            <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">${nl.title}</h3>
                        </div>
                        <div class="text-xs font-semibold text-slate-400"><i data-lucide="clock" class="w-4 h-4 inline mr-1"></i>Published: ${publishDate}</div>
                    </div>
                    
                    <div class="prose max-w-none text-slate-600 dark:text-slate-300 space-y-4">
                        <h4 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Overview & Faculty Desk</h4>
                        <p class="leading-relaxed text-sm">${nl.description}</p>
                    </div>

                    ${nl.event_details ? `
                        <div class="prose max-w-none text-slate-600 dark:text-slate-300 space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <h4 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Event Highlights & Industrial visits</h4>
                            <p class="leading-relaxed text-sm">${nl.event_details}</p>
                        </div>
                    ` : ''}

                    ${pdfLink}
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }
    } catch (err) {
        showToast('Could not fetch newsletter details.', 'error');
    }
}

// ==========================================
// GENERAL COLLEGE CONTACT SUBMISSION
// ==========================================
function renderGeneralContactForm() {
    populateContactDeptDropdown();
}

async function submitGeneralContact(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    
    // Set blank to null for general enquiries
    if (payload.department === '') {
        delete payload.department;
    } else {
        payload.department = parseInt(payload.department);
    }

    try {
        const response = await fetch('/api/contact/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast('Your message has been submitted. Thank you!', 'success');
            form.reset();
        } else {
            const err = await response.json();
            showToast('Could not submit message. Please check the fields.', 'error');
        }
    } catch (err) {
        showToast('Communication issue with server.', 'error');
    }
}

// ==========================================
// DEPARTMENT DASHBOARD (STUDENT PORTAL)
// ==========================================
async function loadDepartmentDashboard(code) {
    try {
        const response = await fetch(`/api/departments/${code}/`);
        if (response.ok) {
            const data = await response.json();
            state.selectedDepartment = data.department;
            state.selectedDepartmentData = data;
            
            document.getElementById('dashboard-dept-code').innerText = data.department.code;
            document.getElementById('dashboard-dept-name').innerText = data.department.name;
            
            // Set academic files links
            const calLink = document.getElementById('download-academic-cal');
            const ttLink = document.getElementById('download-timetable');
            
            if (data.department.academic_calendar_pdf) {
                calLink.href = data.department.academic_calendar_pdf;
                calLink.style.display = 'flex';
            } else {
                calLink.style.display = 'none';
            }

            if (data.department.time_table_pdf) {
                ttLink.href = data.department.time_table_pdf;
                ttLink.style.display = 'flex';
            } else {
                ttLink.style.display = 'none';
            }

            renderDeptDashboardSidebar();
            
            // Render first tab ('about') by default
            switchDeptDashboardTab('about');
        }
    } catch (err) {
        showToast('Could not load department dashboard.', 'error');
    }
}

function renderDeptDashboardSidebar() {
    const sidebarNav = document.getElementById('dept-sidebar-menu');
    if (!sidebarNav) return;

    const tabs = [
        { id: 'about', label: 'About & Vision', icon: 'info' },
        { id: 'faculty', label: 'Faculty & HOD', icon: 'users' },
        { id: 'labs', label: 'Laboratories', icon: 'terminal' },
        { id: 'newsletters', label: 'Newsletters', icon: 'newspaper' },
        { id: 'events', label: 'Events & Workshops', icon: 'calendar' },
        { id: 'placements', label: 'Placements', icon: 'award' },
        { id: 'notices', label: 'Notices', icon: 'bell' },
        { id: 'downloads', label: 'Downloads / PDFs', icon: 'file-text' }
    ];

    sidebarNav.innerHTML = tabs.map(tab => `
        <a href="#" onclick="switchDeptDashboardTab('${tab.id}'); return false;" id="dept-tab-btn-${tab.id}" class="sidebar-tab-btn flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-700 dark:text-slate-300 text-xs font-semibold">
            <span class="flex items-center gap-2"><i data-lucide="${tab.icon}" class="w-4 h-4"></i> ${tab.label}</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 opacity-40"></i>
        </a>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
}

function switchDeptDashboardTab(tabId) {
    state.activeDashboardTab = tabId;
    
    // Toggle active state in sidebar
    document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
        btn.classList.remove('sidebar-active');
    });
    const activeBtn = document.getElementById(`dept-tab-btn-${tabId}`);
    if (activeBtn) activeBtn.classList.add('sidebar-active');
    
    // Render the selected tab content inside panels container
    renderDeptDashboardPanel();
}

function renderDeptDashboardPanel() {
    const panels = document.getElementById('dept-dashboard-panels');
    if (!panels) return;

    const data = state.selectedDepartmentData;
    const dept = data.department;

    if (state.activeDashboardTab === 'about') {
        panels.innerHTML = `
            <div class="space-y-8 animate-fade-in">
                <div class="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 shadow-sm space-y-4">
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white">Department Overview</h3>
                    <p class="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">${dept.overview || 'Welcome to our department.'}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 shadow-sm space-y-3">
                        <div class="flex items-center gap-2 text-blue-600 dark:text-orange-400 font-bold text-sm"><i data-lucide="target" class="w-5 h-5"></i> VISION</div>
                        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${dept.vision || 'To achieve academic excellence.'}</p>
                    </div>
                    <div class="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 shadow-sm space-y-3">
                        <div class="flex items-center gap-2 text-blue-600 dark:text-orange-400 font-bold text-sm"><i data-lucide="compass" class="w-5 h-5"></i> MISSION</div>
                        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${dept.mission || 'Provide quality based knowledge.'}</p>
                    </div>
                </div>
            </div>
        `;
    }

    else if (state.activeDashboardTab === 'faculty') {
        const hod = data.faculties.find(f => f.is_hod);
        const regularFaculty = data.faculties.filter(f => !f.is_hod);

        let hodHtml = `<div class="p-4 text-center text-slate-400">Head of Department details are not set.</div>`;
        if (hod) {
            const photoUrl = hod.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';
            hodHtml = `
                <div class="relative bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-2xl p-6 shadow-sm max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-6 hod-card overflow-hidden">
                    <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-500 shadow-md flex-shrink-0">
                        <img src="${photoUrl}" alt="${hod.name}" class="w-full h-full object-cover">
                    </div>
                    <div class="space-y-2 text-center sm:text-left flex-grow">
                        <h4 class="text-md font-bold text-slate-900 dark:text-white">${hod.name}</h4>
                        <p class="text-xs font-semibold text-orange-500 uppercase tracking-widest">${hod.designation}</p>
                        <div class="w-12 h-[2px] bg-slate-200 dark:bg-slate-700 mx-auto sm:mx-0"></div>
                        <p class="text-xs text-slate-500 dark:text-slate-400"><strong>Qualification:</strong> ${hod.qualification}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400"><strong>Experience:</strong> ${hod.experience}</p>
                        ${hod.email ? `<p class="text-xs text-slate-400 mt-2 font-medium"><i data-lucide="mail" class="w-3.5 h-3.5 inline mr-1 text-slate-400"></i> ${hod.email}</p>` : ''}
                    </div>
                </div>
            `;
        }

        let facultyHtml = `<div class="col-span-full p-4 text-center text-slate-400 font-medium">No other faculty records added yet.</div>`;
        if (regularFaculty.length > 0) {
            facultyHtml = regularFaculty.map(f => {
                const photoUrl = f.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80';
                return `
                    <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4 hover:border-slate-350 dark:hover:border-slate-750 transition-colors">
                        <div class="w-16 h-16 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                            <img src="${photoUrl}" alt="${f.name}" class="w-full h-full object-cover">
                        </div>
                        <div class="space-y-1">
                            <h5 class="text-xs font-bold text-slate-900 dark:text-white">${f.name}</h5>
                            <p class="text-[10px] font-bold text-blue-600 dark:text-orange-400 uppercase tracking-wider">${f.designation}</p>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400">${f.qualification} | ${f.experience}</p>
                            ${f.email ? `<p class="text-[10px] text-slate-400"><i data-lucide="mail" class="w-3 h-3 inline"></i> ${f.email}</p>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        panels.innerHTML = `
            <div class="space-y-10 animate-fade-in">
                <div>
                    <h3 class="text-md font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Head of Department</h3>
                    ${hodHtml}
                </div>
                <div>
                    <h3 class="text-md font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Faculty Members</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        ${facultyHtml}
                    </div>
                </div>
            </div>
        `;
    }

    else if (state.activeDashboardTab === 'labs') {
        let labsHtml = `<div class="col-span-full py-10 text-center text-slate-400">No laboratory records added.</div>`;
        if (data.labs.length > 0) {
            labsHtml = data.labs.map(lab => {
                const labImg = lab.image || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&w=600&q=80';
                return `
                    <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row hover:border-slate-350 dark:hover:border-slate-750 transition-colors">
                        <div class="w-full md:w-48 h-36 md:h-full relative flex-shrink-0 bg-slate-900">
                            <img src="${labImg}" alt="${lab.name}" class="w-full h-full object-cover opacity-75">
                        </div>
                        <div class="p-6 space-y-3 flex-grow">
                            <h4 class="text-sm font-bold text-slate-900 dark:text-white">${lab.name}</h4>
                            <div class="w-10 h-[2px] bg-blue-500"></div>
                            <div>
                                <h5 class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Equipments & Tools</h5>
                                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${lab.equipment || 'General lab setups.'}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        panels.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Department Laboratories</h3>
                <div class="grid grid-cols-1 gap-6">
                    ${labsHtml}
                </div>
            </div>
        `;
    }

    else if (state.activeDashboardTab === 'newsletters') {
        let nlsHtml = `<div class="col-span-full py-12 text-center text-slate-400 font-medium">No published newsletters available for this department.</div>`;
        if (data.newsletters.length > 0) {
            nlsHtml = data.newsletters.map(nl => {
                const publishDate = new Date(nl.publish_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                return `
                    <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[280px]">
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="px-2 py-0.5 text-[8px] font-extrabold text-orange-500 bg-orange-500/10 rounded uppercase tracking-wider">${nl.publish_date}</span>
                                <i data-lucide="newspaper" class="w-4 h-4 text-slate-400"></i>
                            </div>
                            <h4 class="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">${nl.title}</h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-4 leading-relaxed">${nl.description}</p>
                        </div>
                        <button onclick="readNewsletter(${nl.id})" class="w-full mt-4 py-2 bg-slate-50 hover:bg-blue-600 dark:bg-slate-900 dark:hover:bg-orange-500 text-slate-700 dark:text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:border-transparent transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider">
                            Open Newsletter <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                `;
            }).join('');
        }

        panels.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Academic & Event Newsletters</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    ${nlsHtml}
                </div>
            </div>
        `;
    }

    else if (state.activeDashboardTab === 'events') {
        let eventsHtml = `<div class="py-6 text-center text-slate-400">No upcoming events listed.</div>`;
        if (data.events.length > 0) {
            eventsHtml = data.events.map(ev => {
                const dateStr = new Date(ev.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                return `
                    <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-start gap-4">
                        <div class="p-3 bg-blue-100 dark:bg-slate-900 rounded-xl text-blue-600 dark:text-orange-400 flex-shrink-0"><i data-lucide="calendar" class="w-5 h-5"></i></div>
                        <div class="space-y-1">
                            <h4 class="text-xs font-bold text-slate-900 dark:text-white">${ev.title}</h4>
                            <p class="text-[10px] text-slate-400 font-semibold">${dateStr}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1.5">${ev.description}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }

        let workshopsHtml = `<div class="py-6 text-center text-slate-400">No workshop details added.</div>`;
        if (data.workshops.length > 0) {
            workshopsHtml = data.workshops.map(ws => {
                const dateStr = new Date(ws.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                return `
                    <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-start gap-4">
                        <div class="p-3 bg-orange-100 dark:bg-slate-900 rounded-xl text-orange-600 dark:text-orange-400 flex-shrink-0"><i data-lucide="cpu" class="w-5 h-5"></i></div>
                        <div class="space-y-1">
                            <h4 class="text-xs font-bold text-slate-900 dark:text-white">${ws.title}</h4>
                            <p class="text-[10px] text-slate-400 font-semibold">Resource Person: <strong>${ws.resource_person}</strong> | ${dateStr}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }

        let visitsHtml = `<div class="py-6 text-center text-slate-400">No industrial visits listed.</div>`;
        if (data.visits.length > 0) {
            visitsHtml = data.visits.map(vi => {
                const dateStr = new Date(vi.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                return `
                    <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-start gap-4">
                        <div class="p-3 bg-green-100 dark:bg-slate-900 rounded-xl text-green-600 dark:text-orange-400 flex-shrink-0"><i data-lucide="map-pin" class="w-5 h-5"></i></div>
                        <div class="space-y-1">
                            <h4 class="text-xs font-bold text-slate-900 dark:text-white">Visit to ${vi.industry_name}</h4>
                            <p class="text-[10px] text-slate-400 font-semibold">${vi.location} | Date: ${dateStr}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }

        panels.innerHTML = `
            <div class="space-y-10 animate-fade-in">
                <div>
                    <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">Upcoming Events</h3>
                    <div class="grid grid-cols-1 gap-4">${eventsHtml}</div>
                </div>
                <div>
                    <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">Workshops Conducted</h3>
                    <div class="grid grid-cols-1 gap-4">${workshopsHtml}</div>
                </div>
                <div>
                    <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">Industrial Visits</h3>
                    <div class="grid grid-cols-1 gap-4">${visitsHtml}</div>
                </div>
            </div>
        `;
    }

    else if (state.activeDashboardTab === 'placements') {
        let plcHtml = `<div class="col-span-full py-10 text-center text-slate-400">No placements recorded.</div>`;
        if (data.placements.length > 0) {
            plcHtml = data.placements.map(plc => {
                const photoUrl = plc.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                return `
                    <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                        <div class="w-14 h-14 rounded-full overflow-hidden border border-slate-250 flex-shrink-0 bg-slate-100">
                            <img src="${photoUrl}" alt="${plc.student_name}" class="w-full h-full object-cover">
                        </div>
                        <div class="space-y-1">
                            <h5 class="text-xs font-bold text-slate-900 dark:text-white">${plc.student_name}</h5>
                            <p class="text-[10px] font-bold text-green-600 dark:text-orange-400 uppercase tracking-widest">${plc.company_name}</p>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400">Package: <strong>${plc.package}</strong> | Year: ${plc.year}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }

        panels.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Student Placement Records</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    ${plcHtml}
                </div>
            </div>
        `;
    }

    else if (state.activeDashboardTab === 'notices') {
        let noticesHtml = `<div class="py-10 text-center text-slate-400">No active notices posted.</div>`;
        if (data.notices.length > 0) {
            noticesHtml = data.notices.map(no => {
                const dateStr = new Date(no.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                let fileBtn = '';
                if (no.file_attachment) {
                    fileBtn = `<a href="${no.file_attachment}" download class="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-orange-400 hover:underline mt-2"><i data-lucide="download" class="w-3 h-3"></i> Download Notice Attachment</a>`;
                }
                return `
                    <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
                        <div class="flex items-center justify-between">
                            <h4 class="text-xs font-bold text-slate-900 dark:text-white">${no.title}</h4>
                            <span class="text-[10px] text-slate-400 font-semibold">${dateStr}</span>
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${no.content}</p>
                        ${fileBtn}
                    </div>
                `;
            }).join('');
        }

        panels.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Important Notices & Circulars</h3>
                <div class="grid grid-cols-1 gap-4">
                    ${noticesHtml}
                </div>
            </div>
        `;
    }

    else if (state.activeDashboardTab === 'downloads') {
        const cats = {
            'NOTES': 'Syllabus Notes / PDF Files',
            'SYLLABUS': 'Department Curriculum & Syllabus',
            'PAPERS': 'Previous Semester Examination Papers'
        };

        let downloadsHtml = '';
        for (const [key, label] of Object.entries(cats)) {
            const list = data.downloads.filter(d => d.category === key);
            let itemsHtml = `<div class="text-xs text-slate-400 p-2">No documents available.</div>`;
            if (list.length > 0) {
                itemsHtml = list.map(d => `
                    <div class="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-250 dark:bg-slate-900/40 dark:border-slate-800 rounded-xl">
                        <div class="flex items-center gap-2">
                            <i data-lucide="file" class="w-4 h-4 text-slate-400"></i>
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${d.title}</span>
                        </div>
                        <a href="${d.file}" download class="p-1.5 bg-white border border-slate-200 hover:border-blue-500 rounded-lg text-slate-500 hover:text-blue-600 dark:bg-slate-900 dark:border-slate-800 dark:hover:text-orange-400 transition-colors">
                            <i data-lucide="download" class="w-3.5 h-3.5"></i>
                        </a>
                    </div>
                `).join('');
            }

            downloadsHtml += `
                <div class="space-y-3">
                    <h4 class="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">${label}</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${itemsHtml}</div>
                </div>
            `;
        }

        panels.innerHTML = `
            <div class="space-y-8 animate-fade-in">
                <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Academic Resources</h3>
                ${downloadsHtml}
            </div>
        `;
    }

    if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// SUPER ADMIN DASHBOARD
// ==========================================
async function loadAdminDashboard() {
    if (!state.currentUser || state.currentUser.role !== 'SUPER_ADMIN') {
        showToast('Access Denied. Admin privileges required.', 'error');
        navigateTo('landing');
        return;
    }
    
    renderAdminSidebar();
    switchAdminTab('analytics');
}

function renderAdminSidebar() {
    const nav = document.getElementById('admin-sidebar-nav');
    if (!nav) return;

    const tabs = [
        { id: 'analytics', label: 'Analytics Dashboard', icon: 'bar-chart-3' },
        { id: 'approvals', label: 'Pending Newsletters', icon: 'check-square' },
        { id: 'departments', label: 'Manage Departments', icon: 'building' },
        { id: 'staff', label: 'Manage Staff Accounts', icon: 'users' },
        { id: 'logs', label: 'Activity Logs', icon: 'history' },
        { id: 'contacts', label: 'Contact Queries', icon: 'mail' }
    ];

    nav.innerHTML = tabs.map(tab => `
        <a href="#" onclick="switchAdminTab('${tab.id}'); return false;" id="admin-tab-btn-${tab.id}" class="admin-tab-btn flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-700 dark:text-slate-300 text-xs font-semibold">
            <span class="flex items-center gap-2"><i data-lucide="${tab.icon}" class="w-4 h-4"></i> ${tab.label}</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 opacity-40"></i>
        </a>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
}

function switchAdminTab(tabId) {
    state.activeAdminTab = tabId;
    
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('sidebar-active'));
    const activeBtn = document.getElementById(`admin-tab-btn-${tabId}`);
    if (activeBtn) activeBtn.classList.add('sidebar-active');
    
    renderAdminDashboardPanel();
}

async function renderAdminDashboardPanel() {
    const container = document.getElementById('admin-dashboard-content');
    if (!container) return;

    // Load dynamic data from Backend API
    try {
        const response = await fetch('/api/admin/stats/');
        if (!response.ok) {
            container.innerHTML = `<div class="p-6 text-center text-red-500 font-medium">Failed to retrieve administrative statistics.</div>`;
            return;
        }
        
        const stats = await response.json();

        if (state.activeAdminTab === 'analytics') {
            container.innerHTML = `
                <div class="space-y-8 animate-fade-in">
                    <!-- Widget Stats Cards -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 p-5 rounded-2xl shadow-sm text-center">
                            <span class="text-2xl font-black text-blue-700 dark:text-orange-400">${stats.total_departments}</span>
                            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Departments</p>
                        </div>
                        <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 p-5 rounded-2xl shadow-sm text-center">
                            <span class="text-2xl font-black text-blue-700 dark:text-orange-400">${stats.total_faculty}</span>
                            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Faculty</p>
                        </div>
                        <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 p-5 rounded-2xl shadow-sm text-center">
                            <span class="text-2xl font-black text-blue-700 dark:text-orange-400">${stats.total_published_newsletters}</span>
                            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Newsletters</p>
                        </div>
                        <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 p-5 rounded-2xl shadow-sm text-center relative">
                            <span class="text-2xl font-black text-orange-500">${stats.total_pending_newsletters}</span>
                            ${stats.total_pending_newsletters > 0 ? `<span class="absolute top-2 right-2 flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span>` : ''}
                            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Approvals</p>
                        </div>
                    </div>

                    <!-- Charts Area -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Newsletters Published by Department</h4>
                            <div class="relative h-64"><canvas id="chart-newsletters"></canvas></div>
                        </div>
                        <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Events & Placements recorded</h4>
                            <div class="relative h-64"><canvas id="chart-activities"></canvas></div>
                        </div>
                    </div>
                </div>
            `;
            // Trigger Chart.js rendering
            setTimeout(() => drawAdminCharts(stats.department_wise_stats), 50);
        }

        else if (state.activeAdminTab === 'approvals') {
            const pendingRes = await fetch('/api/admin/newsletters/pending/');
            const pending = pendingRes.ok ? await pendingRes.json() : [];

            let listHtml = `<div class="p-8 text-center text-slate-400 font-semibold"><i data-lucide="check-circle" class="w-8 h-8 text-green-500 mx-auto mb-2"></i> All caught up! No pending newsletters to approve.</div>`;
            if (pending.length > 0) {
                listHtml = pending.map(nl => `
                    <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div class="space-y-1.5 flex-grow">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 text-[8px] font-extrabold text-blue-700 bg-blue-100 rounded dark:bg-orange-500/10 dark:text-orange-400 uppercase tracking-wider">${nl.department_code}</span>
                                <h4 class="text-xs font-bold text-slate-900 dark:text-white">${nl.title}</h4>
                            </div>
                            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">${nl.description}</p>
                            ${nl.pdf_attachment ? `<a href="${nl.pdf_attachment}" download class="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:underline"><i data-lucide="download" class="w-3.5 h-3.5"></i> Download PDF Attachment</a>` : ''}
                        </div>
                        <div class="flex gap-2 w-full md:w-auto">
                            <button onclick="reviewNewsletter(${nl.id}, 'APPROVE')" class="flex-grow md:flex-grow-0 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"><i data-lucide="check" class="w-4 h-4"></i> Approve</button>
                            <button onclick="reviewNewsletter(${nl.id}, 'REJECT')" class="flex-grow md:flex-grow-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"><i data-lucide="x" class="w-4 h-4"></i> Reject</button>
                        </div>
                    </div>
                `).join('');
            }

            container.innerHTML = `
                <div class="space-y-6 animate-fade-in">
                    <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Pending Newsletters Approvals</h3>
                    <div class="grid grid-cols-1 gap-4">${listHtml}</div>
                </div>
            `;
        }

        else if (state.activeAdminTab === 'departments') {
            const deptsList = state.departments.map(d => `
                <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <h4 class="text-xs font-bold text-slate-900 dark:text-white">${d.name}</h4>
                        <p class="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Code: <strong>${d.code}</strong></p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="openDepartmentModal(${d.id})" class="p-2 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-orange-400 transition-colors"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button onclick="deleteDepartment(${d.id})" class="p-2 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-500 hover:text-red-500 transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="space-y-6 animate-fade-in">
                    <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest">Manage Departments</h3>
                        <button onclick="openDepartmentModal()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"><i data-lucide="plus" class="w-4 h-4"></i> Add Department</button>
                    </div>
                    <div class="grid grid-cols-1 gap-4">${deptsList}</div>
                </div>
            `;
        }

        else if (state.activeAdminTab === 'staff') {
            const staffRes = await fetch('/api/admin/staff/');
            const staff = staffRes.ok ? await staffRes.json() : [];

            const staffList = staff.map(st => `
                <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <h4 class="text-xs font-bold text-slate-900 dark:text-white">${st.username}</h4>
                        <p class="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Department: <strong>${st.department_code || 'General'}</strong></p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="openStaffModal(${st.id})" class="p-2 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-orange-400 transition-colors"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button onclick="deleteStaff(${st.id})" class="p-2 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-500 hover:text-red-500 transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="space-y-6 animate-fade-in">
                    <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest">Staff Accounts</h3>
                        <button onclick="openStaffModal()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"><i data-lucide="plus" class="w-4 h-4"></i> Create Staff</button>
                    </div>
                    <div class="grid grid-cols-1 gap-4">${staffList}</div>
                </div>
            `;
        }

        else if (state.activeAdminTab === 'logs') {
            const logsRows = stats.recent_activities.map(log => {
                const logTime = new Date(log.timestamp).toLocaleString();
                return `
                    <tr class="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                        <td class="px-4 py-3.5 text-xs font-bold text-slate-850 dark:text-white">${log.username}</td>
                        <td class="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">${log.action}</td>
                        <td class="px-4 py-3.5 text-[10px] text-slate-400 font-semibold">${logTime}</td>
                    </tr>
                `;
            }).join('');

            container.innerHTML = `
                <div class="space-y-6 animate-fade-in">
                    <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Global Activity Logs</h3>
                    <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <table class="w-full text-left">
                            <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th class="px-4 py-3">User</th>
                                    <th class="px-4 py-3">Activity</th>
                                    <th class="px-4 py-3">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${logsRows || '<tr><td colspan="3" class="p-4 text-center text-slate-400">No logs found.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        else if (state.activeAdminTab === 'contacts') {
            const messagesHtml = stats.contact_messages.map(msg => {
                const dateStr = new Date(msg.submitted_at).toLocaleDateString();
                return `
                    <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                        <div class="flex items-center justify-between border-b border-slate-50 dark:border-slate-900 pb-2">
                            <div>
                                <h4 class="text-xs font-bold text-slate-900 dark:text-white">${msg.subject}</h4>
                                <p class="text-[10px] text-slate-400 font-semibold">From: <strong>${msg.name}</strong> (${msg.email})</p>
                            </div>
                            <span class="text-[10px] text-slate-400 font-bold">${dateStr}</span>
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${msg.message}</p>
                    </div>
                `;
            }).join('');

            container.innerHTML = `
                <div class="space-y-6 animate-fade-in">
                    <h3 class="text-md font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Contact Queries</h3>
                    <div class="grid grid-cols-1 gap-4">${messagesHtml || '<p class="text-center text-slate-400 py-6">No contact messages received.</p>'}</div>
                </div>
            `;
        }

        if (window.lucide) window.lucide.createIcons();
    } catch (err) {
        showToast('Failed to load admin panel data.', 'error');
    }
}

// Draw Dashboard ChartJS Visualization
function drawAdminCharts(deptStats) {
    const labels = deptStats.map(d => d.code);
    const newslettersData = deptStats.map(d => d.newsletters_count);
    const placementsData = deptStats.map(d => d.placements_count);
    const eventsData = deptStats.map(d => d.events_count);

    // Destroy existing charts if they exist to prevent memory leaks
    if (state.charts.newsletters) state.charts.newsletters.destroy();
    if (state.charts.activities) state.charts.activities.destroy();

    const ctxNl = document.getElementById('chart-newsletters').getContext('2d');
    state.charts.newsletters = new Chart(ctxNl, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Newsletters Published',
                data: newslettersData,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: '#2563eb',
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });

    const ctxAct = document.getElementById('chart-activities').getContext('2d');
    state.charts.activities = new Chart(ctxAct, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Events Organised',
                    data: eventsData,
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.05)',
                    tension: 0.3,
                    borderWidth: 2
                },
                {
                    label: 'Students Placed',
                    data: placementsData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    tension: 0.3,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
}

// Super Admin Approval Action
async function reviewNewsletter(nlId, action) {
    try {
        const response = await fetch(`/api/admin/newsletters/${nlId}/review/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action })
        });
        
        if (response.ok) {
            showToast(`Newsletter has been ${action === 'APPROVE' ? 'Approved' : 'Rejected'}.`, 'success');
            renderAdminDashboardPanel(); // Refresh
            loadAllNewsletters(); // Refresh global list
        } else {
            showToast('Review action failed.', 'error');
        }
    } catch (err) {
        showToast('Communication issue.', 'error');
    }
}

// Backup Actions
function triggerDbBackup() {
    window.open('/api/admin/backup/', '_blank');
    showToast('Database backup bundle downloading...', 'success');
}

function exportReports() {
    const csvContent = "data:text/csv;charset=utf-8,Department,Faculty,Newsletters,Events,Placements\n" + 
        state.departments.map(d => `"${d.name}","${d.code}","${state.newsletters.filter(n => n.department_code === d.code).length}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "dkte_ycp_college_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV Analytics report exported successfully.', 'success');
}

// ==========================================
// STAFF DASHBOARD PANEL
// ==========================================
function loadStaffDashboard() {
    if (!state.currentUser || state.currentUser.role !== 'STAFF') {
        showToast('Access Denied. Staff login required.', 'error');
        navigateTo('landing');
        return;
    }
    
    document.getElementById('staff-dept-badge').innerText = `${state.currentUser.department_code} Staff`;
    renderStaffSidebar();
    switchStaffTab('details');
}

function renderStaffSidebar() {
    const nav = document.getElementById('staff-sidebar-nav');
    if (!nav) return;

    const tabs = [
        { id: 'details', label: 'Department Details', icon: 'info' },
        { id: 'faculty', label: 'Faculty Members', icon: 'users' },
        { id: 'labs', label: 'Laboratories', icon: 'terminal' },
        { id: 'placements', label: 'Placements', icon: 'award' },
        { id: 'events', label: 'Events & Workshops', icon: 'calendar' },
        { id: 'notices', label: 'Notice Board', icon: 'bell' },
        { id: 'newsletters', label: 'Department Newsletters', icon: 'newspaper' },
        { id: 'downloads', label: 'Resource Files', icon: 'file-text' }
    ];

    nav.innerHTML = tabs.map(tab => `
        <a href="#" onclick="switchStaffTab('${tab.id}'); return false;" id="staff-tab-btn-${tab.id}" class="staff-tab-btn flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-700 dark:text-slate-300 text-xs font-semibold">
            <span class="flex items-center gap-2"><i data-lucide="${tab.icon}" class="w-4 h-4"></i> ${tab.label}</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 opacity-40"></i>
        </a>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
}

function switchStaffTab(tabId) {
    state.activeStaffTab = tabId;
    
    document.querySelectorAll('.staff-tab-btn').forEach(btn => btn.classList.remove('sidebar-active'));
    const activeBtn = document.getElementById(`staff-tab-btn-${tabId}`);
    if (activeBtn) activeBtn.classList.add('sidebar-active');
    
    renderStaffDashboardPanel();
}

async function renderStaffDashboardPanel() {
    const container = document.getElementById('staff-dashboard-content');
    if (!container) return;

    const deptCode = state.currentUser.department_code;
    const deptId = state.currentUser.department_id;

    // Load fresh data
    const response = await fetch(`/api/departments/${deptCode}/`);
    if (!response.ok) {
        container.innerHTML = `<div class="p-4 text-center text-red-500 font-semibold">Failed to fetch department control parameters.</div>`;
        return;
    }
    const data = await response.json();
    const dept = data.department;

    if (state.activeStaffTab === 'details') {
        container.innerHTML = `
            <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-2xl p-6 shadow-sm animate-fade-in space-y-6">
                <h3 class="text-md font-bold text-slate-950 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Department Constants</h3>
                
                <form id="staff-dept-details-form" onsubmit="updateDeptDetails(event)" class="space-y-6">
                    <div>
                        <label class="block text-xs font-semibold text-slate-450 dark:text-slate-400 mb-2 uppercase tracking-wider">Vision Statement</label>
                        <textarea name="vision" rows="3" required class="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 transition-colors">${dept.vision || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-450 dark:text-slate-400 mb-2 uppercase tracking-wider">Mission Statement</label>
                        <textarea name="mission" rows="3" required class="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 transition-colors">${dept.mission || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-450 dark:text-slate-400 mb-2 uppercase tracking-wider">Overview Description</label>
                        <textarea name="overview" rows="4" required class="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 transition-colors">${dept.overview || ''}</textarea>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-xs font-semibold text-slate-450 dark:text-slate-400 mb-2 uppercase tracking-wider">Syllabus / Time Table PDF</label>
                            <input type="file" name="time_table_pdf" class="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-xl px-4 py-3 text-xs">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-450 dark:text-slate-400 mb-2 uppercase tracking-wider">Academic Calendar PDF</label>
                            <input type="file" name="academic_calendar_pdf" class="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-xl px-4 py-3 text-xs">
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full py-3 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-xl text-xs font-semibold transition-all">Update Department Parameters</button>
                </form>
            </div>
        `;
    }

    else if (state.activeStaffTab === 'faculty') {
        const rows = data.faculties.map(f => `
            <tr class="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td class="px-4 py-3 text-xs font-bold text-slate-900 dark:text-white">${f.name}</td>
                <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${f.designation} ${f.is_hod ? '<span class="ml-1 px-1.5 py-0.5 text-[8px] bg-orange-500 text-white font-extrabold rounded">HOD</span>' : ''}</td>
                <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${f.qualification}</td>
                <td class="px-4 py-3 flex gap-2 justify-end">
                    <button onclick="openItemModal('faculty', ${f.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-orange-400"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="deleteItem('faculty', ${f.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 class="text-md font-bold text-slate-950 dark:text-white uppercase tracking-widest">Faculty Management</h3>
                    <button onclick="openItemModal('faculty')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"><i data-lucide="plus" class="w-4 h-4"></i> Add Member</button>
                </div>
                
                <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                                <th class="px-4 py-3">Name</th>
                                <th class="px-4 py-3">Designation</th>
                                <th class="px-4 py-3">Qualification</th>
                                <th class="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="4" class="p-4 text-center text-slate-400">No faculty members found.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    else if (state.activeStaffTab === 'labs') {
        const rows = data.labs.map(lab => `
            <tr class="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td class="px-4 py-3 text-xs font-bold text-slate-900 dark:text-white">${lab.name}</td>
                <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[240px]">${lab.equipment || 'No equipment listed.'}</td>
                <td class="px-4 py-3 flex gap-2 justify-end">
                    <button onclick="openItemModal('labs', ${lab.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-orange-400"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="deleteItem('labs', ${lab.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 class="text-md font-bold text-slate-950 dark:text-white uppercase tracking-widest">Laboratory Units</h3>
                    <button onclick="openItemModal('labs')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"><i data-lucide="plus" class="w-4 h-4"></i> Add Lab</button>
                </div>
                
                <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                                <th class="px-4 py-3">Lab Name</th>
                                <th class="px-4 py-3">Equipments</th>
                                <th class="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="3" class="p-4 text-center text-slate-400">No laboratories added yet.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    else if (state.activeStaffTab === 'placements') {
        const rows = data.placements.map(plc => `
            <tr class="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td class="px-4 py-3 text-xs font-bold text-slate-900 dark:text-white">${plc.student_name}</td>
                <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${plc.company_name}</td>
                <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${plc.package}</td>
                <td class="px-4 py-3 flex gap-2 justify-end">
                    <button onclick="openItemModal('placements', ${plc.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-orange-400"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="deleteItem('placements', ${plc.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 class="text-md font-bold text-slate-950 dark:text-white uppercase tracking-widest">Placements Board</h3>
                    <button onclick="openItemModal('placements')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"><i data-lucide="plus" class="w-4 h-4"></i> Add Record</button>
                </div>
                
                <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                                <th class="px-4 py-3">Student Name</th>
                                <th class="px-4 py-3">Company</th>
                                <th class="px-4 py-3">Package</th>
                                <th class="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="4" class="p-4 text-center text-slate-400">No placements added yet.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    else if (state.activeStaffTab === 'events') {
        const rows = data.events.map(ev => `
            <tr class="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td class="px-4 py-3 text-xs font-bold text-slate-900 dark:text-white">${ev.title}</td>
                <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${ev.date}</td>
                <td class="px-4 py-3 flex gap-2 justify-end">
                    <button onclick="openItemModal('events', ${ev.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-orange-400"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="deleteItem('events', ${ev.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 class="text-md font-bold text-slate-950 dark:text-white uppercase tracking-widest">Events & Activities</h3>
                    <button onclick="openItemModal('events')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"><i data-lucide="plus" class="w-4 h-4"></i> Add Event</button>
                </div>
                
                <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                                <th class="px-4 py-3">Event Title</th>
                                <th class="px-4 py-3">Date</th>
                                <th class="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="3" class="p-4 text-center text-slate-400">No events listed.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    else if (state.activeStaffTab === 'notices') {
        const rows = data.notices.map(no => `
            <tr class="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td class="px-4 py-3 text-xs font-bold text-slate-900 dark:text-white">${no.title}</td>
                <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${no.date}</td>
                <td class="px-4 py-3 flex gap-2 justify-end">
                    <button onclick="openItemModal('notices', ${no.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-orange-400"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="deleteItem('notices', ${no.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 class="text-md font-bold text-slate-950 dark:text-white uppercase tracking-widest">Department Circulars</h3>
                    <button onclick="openItemModal('notices')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"><i data-lucide="plus" class="w-4 h-4"></i> Add Notice</button>
                </div>
                
                <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                                <th class="px-4 py-3">Notice Title</th>
                                <th class="px-4 py-3">Date</th>
                                <th class="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="3" class="p-4 text-center text-slate-400">No active notices.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    else if (state.activeStaffTab === 'newsletters') {
        // Staff can see all their department newsletters including pending ones
        const nlRes = await fetch(`/api/newsletters/`);
        const allNls = nlRes.ok ? await nlRes.json() : [];
        const deptNls = allNls.filter(n => n.department_id === deptId);

        const rows = deptNls.map(nl => {
            let badge = '';
            if (nl.status === 'APPROVED') {
                badge = '<span class="px-1.5 py-0.5 text-[8px] bg-green-500 text-white font-extrabold rounded">Published</span>';
            } else if (nl.status === 'PENDING') {
                badge = '<span class="px-1.5 py-0.5 text-[8px] bg-orange-500 text-white font-extrabold rounded">Pending Approval</span>';
            } else {
                badge = '<span class="px-1.5 py-0.5 text-[8px] bg-red-500 text-white font-extrabold rounded">Rejected</span>';
            }
            return `
                <tr class="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td class="px-4 py-3 text-xs font-bold text-slate-900 dark:text-white">${nl.title}</td>
                    <td class="px-4 py-3 text-xs">${badge}</td>
                    <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${nl.publish_date}</td>
                    <td class="px-4 py-3 flex gap-2 justify-end">
                        <button onclick="openItemModal('newsletters', ${nl.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-orange-400"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button onclick="deleteItem('newsletters', ${nl.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 class="text-md font-bold text-slate-950 dark:text-white uppercase tracking-widest">Newsletters Panel</h3>
                    <button onclick="openItemModal('newsletters')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"><i data-lucide="plus" class="w-4 h-4"></i> Create Newsletter</button>
                </div>
                
                <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Publish Date</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="4" class="p-4 text-center text-slate-400 font-semibold">No newsletters drafted yet.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    else if (state.activeStaffTab === 'downloads') {
        const rows = data.downloads.map(d => `
            <tr class="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td class="px-4 py-3 text-xs font-bold text-slate-900 dark:text-white">${d.title}</td>
                <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${d.category_display}</td>
                <td class="px-4 py-3 flex gap-2 justify-end">
                    <button onclick="openItemModal('downloads', ${d.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-orange-400"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="deleteItem('downloads', ${d.id})" class="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 class="text-md font-bold text-slate-950 dark:text-white uppercase tracking-widest">Resource Downloads</h3>
                    <button onclick="openItemModal('downloads')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"><i data-lucide="plus" class="w-4 h-4"></i> Add File</button>
                </div>
                
                <div class="bg-white border border-slate-200 dark:bg-dkte-darkCard dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                                <th class="px-4 py-3">Document Title</th>
                                <th class="px-4 py-3">Category</th>
                                <th class="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="3" class="p-4 text-center text-slate-400">No resources files added.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    if (window.lucide) window.lucide.createIcons();
}

// Update basic department details
async function updateDeptDetails(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const deptId = state.currentUser.department_id;

    try {
        const response = await fetch(`/api/departments/${deptId}/update/`, {
            method: 'PUT',
            body: formData
        });

        if (response.ok) {
            showToast('Department parameters updated successfully!', 'success');
            renderStaffDashboardPanel();
        } else {
            showToast('Could not update department parameters.', 'error');
        }
    } catch (err) {
        showToast('Server update error.', 'error');
    }
}

// Delete item generic
async function deleteItem(modelType, itemId) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
        const response = await fetch(`/api/items/${modelType}/${itemId}/`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Record deleted successfully.', 'success');
            renderStaffDashboardPanel();
        } else {
            showToast('Could not delete record.', 'error');
        }
    } catch (err) {
        showToast('Server error.', 'error');
    }
}

// ==========================================
// SHARED CRUD MODALS & DIALOGS
// ==========================================
function openModal(htmlContent) {
    elements.modalBox.innerHTML = htmlContent;
    elements.modalWrapper.classList.remove('hidden');
    setTimeout(() => {
        elements.modalBox.classList.remove('scale-95', 'opacity-0');
        elements.modalBox.classList.add('scale-100', 'opacity-100');
    }, 50);
    if (window.lucide) window.lucide.createIcons();
}

function closeModal() {
    elements.modalBox.classList.remove('scale-100', 'opacity-100');
    elements.modalBox.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        elements.modalWrapper.classList.add('hidden');
    }, 200);
}

// Open Modal for adding/editing a department (Super Admin)
async function openDepartmentModal(deptId = null) {
    let dept = { name: '', code: '', vision: '', mission: '', overview: '' };
    if (deptId) {
        const response = await fetch('/api/departments/');
        if (response.ok) {
            const list = await response.json();
            dept = list.find(d => d.id === deptId) || dept;
        }
    }

    const html = `
        <div class="p-6 space-y-6">
            <div class="flex justify-between items-center">
                <h4 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">${deptId ? 'Edit Department' : 'Create Department'}</h4>
                <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><i data-lucide="x" class="w-4 h-4"></i></button>
            </div>
            
            <form onsubmit="submitDepartmentForm(event, ${deptId})" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Department Name</label>
                    <input type="text" name="name" required value="${dept.name}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 transition-colors dark:bg-slate-900/60 dark:border-slate-800">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Code (Short representation)</label>
                    <input type="text" name="code" required value="${dept.code}" ${deptId ? 'disabled' : ''} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 transition-colors dark:bg-slate-900/60 dark:border-slate-800">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Vision</label>
                    <textarea name="vision" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none dark:bg-slate-900/60 dark:border-slate-800">${dept.vision || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Mission</label>
                    <textarea name="mission" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none dark:bg-slate-900/60 dark:border-slate-800">${dept.mission || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Overview</label>
                    <textarea name="overview" rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none dark:bg-slate-900/60 dark:border-slate-800">${dept.overview || ''}</textarea>
                </div>
                
                <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors">Submit</button>
            </form>
        </div>
    `;
    openModal(html);
}

async function submitDepartmentForm(event, deptId = null) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const url = deptId ? `/api/admin/departments/${deptId}/` : `/api/admin/departments/`;
    const method = deptId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast('Department configuration updated successfully!', 'success');
            closeModal();
            loadDepartments();
            renderAdminDashboardPanel();
        } else {
            const err = await response.json();
            showToast(err.error || 'Failed to save department details.', 'error');
        }
    } catch (err) {
        showToast('Communication fail.', 'error');
    }
}

async function deleteDepartment(deptId) {
    if (!confirm('Are you sure you want to delete this department? All staff, faculty and notices will be deleted.')) return;
    try {
        const response = await fetch(`/api/admin/departments/${deptId}/`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showToast('Department deleted successfully.', 'success');
            loadDepartments();
            renderAdminDashboardPanel();
        } else {
            showToast('Could not delete department.', 'error');
        }
    } catch (err) {
        showToast('Server error.', 'error');
    }
}

// Staff Modal Setup (Super Admin)
async function openStaffModal(staffId = null) {
    let staff = { username: '', email: '', department: '' };
    if (staffId) {
        const staffRes = await fetch('/api/admin/staff/');
        const staffList = staffRes.ok ? await staffRes.json() : [];
        staff = staffList.find(st => st.id === staffId) || staff;
    }

    const deptOptions = state.departments.map(d => `
        <option value="${d.id}" ${staff.department_id === d.id ? 'selected' : ''}>${d.name} (${d.code})</option>
    `).join('');

    const html = `
        <div class="p-6 space-y-6">
            <div class="flex justify-between items-center">
                <h4 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">${staffId ? 'Edit Staff Account' : 'Create Staff Account'}</h4>
                <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><i data-lucide="x" class="w-4 h-4"></i></button>
            </div>
            
            <form onsubmit="submitStaffForm(event, ${staffId})" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Username</label>
                    <input type="text" name="username" required value="${staff.username}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 transition-colors dark:bg-slate-900/60 dark:border-slate-800">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                    <input type="email" name="email" required value="${staff.email || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 transition-colors dark:bg-slate-900/60 dark:border-slate-800">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Password ${staffId ? '(Leave blank to keep current)' : ''}</label>
                    <input type="password" name="password" ${staffId ? '' : 'required'} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 transition-colors dark:bg-slate-900/60 dark:border-slate-800">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Link to Department</label>
                    <select name="department" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 transition-colors dark:bg-slate-900/60 dark:border-slate-800">
                        <option value="">Choose department...</option>
                        ${deptOptions}
                    </select>
                </div>
                
                <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors">Submit</button>
            </form>
        </div>
    `;
    openModal(html);
}

async function submitStaffForm(event, staffId = null) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (payload.department) {
        payload.department = parseInt(payload.department);
    }

    const url = staffId ? `/api/admin/staff/${staffId}/` : `/api/admin/staff/`;
    const method = staffId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast('Staff user profile updated.', 'success');
            closeModal();
            renderAdminDashboardPanel();
        } else {
            const err = await response.json();
            showToast(err.error || 'Failed to modify staff details.', 'error');
        }
    } catch (err) {
        showToast('Communication error.', 'error');
    }
}

async function deleteStaff(staffId) {
    if (!confirm('Are you sure you want to delete this staff account?')) return;
    try {
        const response = await fetch(`/api/admin/staff/${staffId}/`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showToast('Staff account deleted.', 'success');
            renderAdminDashboardPanel();
        } else {
            showToast('Failed to delete staff account.', 'error');
        }
    } catch (err) {
        showToast('Server error.', 'error');
    }
}

// Generic Staff Item Add / Edit Modal
async function openItemModal(modelType, itemId = null) {
    const deptId = state.currentUser.department_id;
    let item = {};
    
    if (itemId) {
        // Fetch existing item details
        const response = await fetch(`/api/departments/${state.currentUser.department_code}/`);
        if (response.ok) {
            const data = await response.json();
            
            // Map models
            const maps = {
                'faculty': data.faculties,
                'labs': data.labs,
                'placements': data.placements,
                'events': data.events,
                'notices': data.notices,
                'downloads': data.downloads,
                'newsletters': data.newsletters // wait, staff newsletters might be pending so let's load all and filter
            };
            
            let list = maps[modelType] || [];
            if (modelType === 'newsletters') {
                const nlRes = await fetch(`/api/newsletters/`);
                if (nlRes.ok) {
                    const all = await nlRes.json();
                    list = all.filter(n => n.department_id === deptId);
                }
            }
            
            item = list.find(x => x.id === itemId) || {};
        }
    }

    // Modal forms HTML factory
    let formFieldsHtml = '';
    
    if (modelType === 'faculty') {
        formFieldsHtml = `
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                <input type="text" name="name" required value="${item.name || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Designation</label>
                <input type="text" name="designation" required value="${item.designation || ''}" placeholder="Assistant Professor / Lecturer" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Qualification</label>
                    <input type="text" name="qualification" required value="${item.qualification || ''}" placeholder="M.Tech / B.E." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Experience</label>
                    <input type="text" name="experience" required value="${item.experience || ''}" placeholder="8 Years" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
                </div>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                <input type="email" name="email" value="${item.email || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
            <div class="flex items-center gap-2">
                <input type="checkbox" name="is_hod" value="true" ${item.is_hod ? 'checked' : ''} class="rounded text-blue-600 focus:ring-blue-500 h-4 w-4">
                <label class="text-xs font-semibold text-slate-600">Is Head of Department (HOD)</label>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Photo Upload</label>
                <input type="file" name="photo" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
        `;
    }

    else if (modelType === 'labs') {
        formFieldsHtml = `
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Laboratory Name</label>
                <input type="text" name="name" required value="${item.name || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Equipments & Infrastructure</label>
                <textarea name="equipment" rows="3" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none">${item.equipment || ''}</textarea>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Lab Photo</label>
                <input type="file" name="image" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
        `;
    }

    else if (modelType === 'placements') {
        formFieldsHtml = `
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Student Name</label>
                <input type="text" name="student_name" required value="${item.student_name || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Recruiting Company</label>
                <input type="text" name="company_name" required value="${item.company_name || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Salary Package</label>
                    <input type="text" name="package" required value="${item.package || ''}" placeholder="4.2 LPA" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Academic Year</label>
                    <input type="number" name="year" required value="${item.year || 2026}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
                </div>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Photo Upload</label>
                <input type="file" name="photo" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
        `;
    }

    else if (modelType === 'events') {
        formFieldsHtml = `
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Event / Seminar Title</label>
                <input type="text" name="title" required value="${item.title || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Description / Brief Report</label>
                <textarea name="description" rows="3" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none">${item.description || ''}</textarea>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                <input type="date" name="date" required value="${item.date || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Cover Photo</label>
                <input type="file" name="image" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
        `;
    }

    else if (modelType === 'notices') {
        formFieldsHtml = `
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Notice / Circular Title</label>
                <input type="text" name="title" required value="${item.title || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Content details</label>
                <textarea name="content" rows="4" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none">${item.content || ''}</textarea>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">File Attachment (PDF / Document)</label>
                <input type="file" name="file_attachment" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
        `;
    }

    else if (modelType === 'downloads') {
        formFieldsHtml = `
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Document Title</label>
                <input type="text" name="title" required value="${item.title || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Category Type</label>
                <select name="category" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs">
                    <option value="NOTES" ${item.category === 'NOTES' ? 'selected' : ''}>Syllabus Notes / PDF</option>
                    <option value="SYLLABUS" ${item.category === 'SYLLABUS' ? 'selected' : ''}>Academic Curriculum / Syllabus</option>
                    <option value="PAPERS" ${item.category === 'PAPERS' ? 'selected' : ''}>Previous Semester papers</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Upload File (PDF / Word)</label>
                <input type="file" name="file" ${itemId ? '' : 'required'} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
        `;
    }

    else if (modelType === 'newsletters') {
        formFieldsHtml = `
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Newsletter Title / Volume</label>
                <input type="text" name="title" required value="${item.title || ''}" placeholder="e.g. ByteQuest Volume 12, Issue 2" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Newsletter Description (Faculty, labs updates etc.)</label>
                <textarea name="description" rows="4" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none">${item.description || ''}</textarea>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Event details (Hackathons, Workshops, Visits highlights)</label>
                <textarea name="event_details" rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none">${item.event_details || ''}</textarea>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Newsletter PDF Attachment (Mandatory)</label>
                <input type="file" name="pdf_attachment" ${itemId ? '' : 'required'} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
            </div>
        `;
    }

    const html = `
        <div class="p-6 space-y-6">
            <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">${itemId ? 'Edit Item' : 'Add Item'}</h4>
                <button onclick="closeModal()" class="text-slate-400 hover:text-slate-650"><i data-lucide="x" class="w-4 h-4"></i></button>
            </div>
            <form onsubmit="submitItemForm(event, '${modelType}', ${itemId})" class="space-y-4" id="item-dialog-form">
                ${formFieldsHtml}
                <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors uppercase tracking-widest">Save Record</button>
            </form>
        </div>
    `;
    openModal(html);
}

async function submitItemForm(event, modelType, itemId = null) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const deptId = state.currentUser.department_id;
    
    // Convert checkbox value to boolean for django serializer
    if (modelType === 'faculty') {
        const isHod = form.querySelector('[name="is_hod"]');
        if (isHod) {
            formData.set('is_hod', isHod.checked ? 'true' : 'false');
        }
    }

    const url = itemId 
        ? `/api/items/${modelType}/${itemId}/` 
        : `/api/departments/${deptId}/add/${modelType}/`;
    
    const method = itemId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            body: formData
        });

        if (response.ok) {
            showToast(`${modelType} records successfully saved!`, 'success');
            closeModal();
            renderStaffDashboardPanel();
            loadAllNewsletters(); // Refresh global list
        } else {
            const err = await response.json();
            showToast('Field validation failed. Please check inputs.', 'error');
        }
    } catch (err) {
        showToast('Server update communication issue.', 'error');
    }
}
