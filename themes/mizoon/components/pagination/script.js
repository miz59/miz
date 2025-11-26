class Pagination {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('.pagination').forEach(indicator => {
            this.setupSize(indicator);
            this.setupIndicator(indicator);
        });
    }

    setupSize(indicator) {
        const sizePagination = indicator.dataset.paginationSize;
        if (sizePagination) {
            indicator.style.setProperty('--pagination-size', sizePagination);
        }
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

new Pagination();