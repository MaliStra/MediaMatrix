// ==================== ГОРИЗОНТАЛЬНЫЙ КАРУСЕЛЬ ПЛАГИНОВ ====================

let currentCarouselIndex = 0;
let cardWidth = 280;
let isCarouselRendered = false;

const colorClasses = ['0', '1', '2', '3', '4', '5', '6', '7'];

// Список стандартных страниц, которые нужно исключить
const EXCLUDED_PAGES = ['home', 'store', 'plugins', 'settings'];

function renderCarousel() {
    const track = document.getElementById('pluginsCarouselTrack');
    const noPlugins = document.getElementById('carouselNoPlugins');
    const indicators = document.getElementById('carouselIndicators');
    const carouselSection = document.querySelector('.plugins-carousel-section');
    
    if (!track) return;
    
    // Временно показываем секцию, чтобы рассчитать размеры (потом применится applyShowCarousel)
    if (carouselSection) {
        carouselSection.style.display = 'block';
    }
    
    // Получаем все элементы бокового меню
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    // Фильтруем: оставляем только плагины (исключаем стандартные страницы)
    const pluginLinks = Array.from(sidebarLinks).filter(link => {
        const pageId = link.dataset.page;
        return !EXCLUDED_PAGES.includes(pageId);
    });
    
    if (!pluginLinks || pluginLinks.length === 0) {
        track.innerHTML = '';
        if (noPlugins) noPlugins.classList.remove('hidden');
        if (indicators) indicators.innerHTML = '';
        updateCarouselButtons();
        isCarouselRendered = true;
        // Применяем видимость (скорее всего скроет секцию, если нужно)
        if (typeof window.applyShowCarousel === 'function') {
            window.applyShowCarousel();
        }
        return;
    }
    
    if (noPlugins) noPlugins.classList.add('hidden');
    
    let html = '';
    let index = 0;
    
    pluginLinks.forEach((link) => {
        const iconElement = link.querySelector('i');
        const iconClass = iconElement ? iconElement.className : 'fas fa-puzzle-piece';
        
        const nameElement = link.querySelector('span');
        const pluginName = nameElement ? nameElement.textContent : 'Плагин';
        
        const pageId = link.dataset.page;
        
        const randomColor = colorClasses[index % colorClasses.length];
        
        html += `
            <div class="carousel-card" data-color="${randomColor}" onclick="navigateToCarouselPage('${pageId}')">
                <div class="carousel-icon">
                    <i class="${iconClass}"></i>
                </div>
                
                <h4 class="carousel-name">${escapeHtml(pluginName)}</h4>
                
            </div>
        `;
        
        index++;
    });
    
    track.innerHTML = html;
    
    setTimeout(updateCardWidth, 100);
    
    updateCarouselButtons();
    renderCarouselIndicators();
    
    isCarouselRendered = true;

    // Применяем сохранённую настройку видимости
    if (typeof window.applyShowCarousel === 'function') {
        window.applyShowCarousel();
    }
}

function navigateToCarouselPage(pageId) {
    if (pageId) {
        navigateTo(pageId);
    }
}

function updateCardWidth() {
    const card = document.querySelector('.carousel-card');
    if (card) {
        const cardStyle = window.getComputedStyle(card);
        const cardWidthNum = parseFloat(cardStyle.width);
        const gap = 20; // должно совпадать с gap в .carousel-track
        cardWidth = cardWidthNum + gap;
    }
}

function renderCarouselIndicators() {
    const indicators = document.getElementById('carouselIndicators');
    const container = document.querySelector('.carousel-container');
    
    if (!indicators || !container) return;
    
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const pluginLinks = Array.from(sidebarLinks).filter(link => {
        const pageId = link.dataset.page;
        return !EXCLUDED_PAGES.includes(pageId);
    });
    
    const cardCount = pluginLinks.length;
    
    if (cardCount === 0) {
        indicators.innerHTML = '';
        return;
    }
    
    const visibleCards = Math.floor(container.offsetWidth / cardWidth) || 1;
    const maxIndex = Math.max(0, cardCount - visibleCards);
    
    if (maxIndex <= 0) {
        indicators.innerHTML = '';
        return;
    }
    
    let dotsHtml = '';
    for (let i = 0; i <= maxIndex; i++) {
        dotsHtml += `<button class="carousel-dot ${i === currentCarouselIndex ? 'active' : ''}" onclick="scrollToCarouselIndex(${i})"></button>`;
    }
    
    indicators.innerHTML = dotsHtml;
}

function scrollCarousel(direction) {
    const track = document.getElementById('pluginsCarouselTrack');
    const container = document.querySelector('.carousel-container');
    
    if (!track || !container) return;
    
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const pluginLinks = Array.from(sidebarLinks).filter(link => {
        const pageId = link.dataset.page;
        return !EXCLUDED_PAGES.includes(pageId);
    });
    
    const cardCount = pluginLinks.length;
    
    const visibleCards = Math.floor(container.offsetWidth / cardWidth) || 1;
    const maxIndex = Math.max(0, cardCount - visibleCards);
    
    currentCarouselIndex += direction;
    
    if (currentCarouselIndex < 0) currentCarouselIndex = 0;
    if (currentCarouselIndex > maxIndex) currentCarouselIndex = maxIndex;
    
    const scrollAmount = currentCarouselIndex * cardWidth;
    track.style.transform = `translateX(-${scrollAmount}px)`;
    
    updateCarouselButtons();
    updateCarouselIndicators();
}

function scrollToCarouselIndex(index) {
    const track = document.getElementById('pluginsCarouselTrack');
    const container = document.querySelector('.carousel-container');
    
    if (!track || !container) return;
    
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const pluginLinks = Array.from(sidebarLinks).filter(link => {
        const pageId = link.dataset.page;
        return !EXCLUDED_PAGES.includes(pageId);
    });
    
    const cardCount = pluginLinks.length;
    const visibleCards = Math.floor(container.offsetWidth / cardWidth) || 1;
    const maxIndex = Math.max(0, cardCount - visibleCards);
    
    currentCarouselIndex = Math.min(index, maxIndex);
    
    const scrollAmount = currentCarouselIndex * cardWidth;
    track.style.transform = `translateX(-${scrollAmount}px)`;
    
    updateCarouselButtons();
    updateCarouselIndicators();
}

function updateCarouselButtons() {
    const prevBtn = document.getElementById('pluginsPrevBtn');
    const nextBtn = document.getElementById('pluginsNextBtn');
    const container = document.querySelector('.carousel-container');
    
    if (!prevBtn || !nextBtn || !container) return;
    
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const pluginLinks = Array.from(sidebarLinks).filter(link => {
        const pageId = link.dataset.page;
        return !EXCLUDED_PAGES.includes(pageId);
    });
    
    const cardCount = pluginLinks.length;
    
    if (cardCount === 0) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }
    
    const visibleCards = Math.floor(container.offsetWidth / cardWidth) || 1;
    const maxIndex = Math.max(0, cardCount - visibleCards);
    
    prevBtn.disabled = currentCarouselIndex === 0;
    nextBtn.disabled = currentCarouselIndex >= maxIndex;
}

function updateCarouselIndicators() {
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentCarouselIndex);
    });
}

function initCarousel() {
    const prevBtn = document.getElementById('pluginsPrevBtn');
    const nextBtn = document.getElementById('pluginsNextBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => scrollCarousel(-1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => scrollCarousel(1));
    }
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateCardWidth();
            scrollToCarouselIndex(currentCarouselIndex);
            renderCarouselIndicators();
        }, 150);
    });
    
    // Наблюдаем за изменениями в боковом меню
    const observer = new MutationObserver(() => {
        // Сохраняем позицию скролла
        const currentScroll = currentCarouselIndex;
        renderCarousel();
        // Восстанавливаем позицию после рендера
        setTimeout(() => {
            scrollToCarouselIndex(currentScroll);
        }, 50);
    });
    
    const sidebar = document.querySelector('.sidebar-nav');
    if (sidebar) {
        observer.observe(sidebar, { childList: true, subtree: true });
    }
    
    // Первый рендер
    renderCarousel();
}

// Экспортируем функции
window.renderCarousel = renderCarousel;
window.scrollCarousel = scrollCarousel;
window.scrollToCarouselIndex = scrollToCarouselIndex;
window.navigateToCarouselPage = navigateToCarouselPage;

// Автоматический рендер при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initCarousel, 100);
    });
} else {
    setTimeout(initCarousel, 100);
}