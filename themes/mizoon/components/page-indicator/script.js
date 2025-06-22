class PageIndicator {
    constructor(selector) {
        this.indicators = document.querySelectorAll(selector);
        this.init();
    }

    init() {
        this.indicators.forEach(indicator => {
            this.setupIndicator(indicator);
        });
    }

    setupIndicator(indicator) {
        const pages = indicator.querySelectorAll('.page');
        pages.forEach(page => {
            this.setupPageClick(page, pages);
        });
    }

    setupPageClick(page, allPages) {
        page.addEventListener('click', () => {
            this.activatePage(page, allPages);
        });
    }

    activatePage(selectedPage, allPages) {
        allPages.forEach(page => page.classList.remove('active'));
        selectedPage.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PageIndicator('.page-indicator');
});