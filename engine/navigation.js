// ==================== NAVIGATION ====================
function initNavigation() {
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    
    const pageEl = document.getElementById(page);
    const linkEl = document.querySelector(`[data-page="${page}"]`);
    
    if (pageEl) {
        pageEl.classList.add('active', 'animate-slide');
    }
    if (linkEl) {
        linkEl.classList.add('active');
    }
    
    closeSidebar();
    
    if (page === 'store') {
        refreshStore();
    }
}

function toggleSidebar() {
    sidebar.classList.toggle('open');
    if (overlay) {
        overlay.classList.toggle('show');
    }
}

function closeSidebar() {
    sidebar.classList.remove('open');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle-panel');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    document.getElementById('overlay').addEventListener('click', closeSidebar);
}