class TablePaginator {
    constructor() {
        this.tables = document.querySelectorAll('.table[data-item-per-page]');
        this.init();
    }

    init() {
        this.tables.forEach(table => this.setupTable(table));
    }

    setupTable(table) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const perPage = parseInt(table.getAttribute('data-item-per-page'), 10) || 5;
        const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
        const pagination = table.parentElement.querySelector('.pagination');

        if (!pagination) {
            rows.forEach((r, i) => {
                r.style.display = i < perPage ? '' : 'none';
            });
            return;
        }

        if (pagination.querySelectorAll('.page').length === 0) {
            const nextBtn = pagination.querySelector('.next-button');
            for (let i = 1; i <= totalPages; i++) {
                const p = document.createElement('div');
                p.className = 'page';
                p.textContent = i;
                pagination.insertBefore(p, nextBtn);
            }
        }

        const sizePagination = pagination.dataset.paginationSize;

        if (sizePagination) {
            pagination.style.setProperty('--pagination-size', sizePagination);
        }

        const pages = Array.from(pagination.querySelectorAll('.page'));
        const prev = pagination.querySelector('.previous-button');
        const next = pagination.querySelector('.next-button');

        const showPage = (pageNumber) => {
            const start = (pageNumber - 1) * perPage;
            const end = start + perPage;

            rows.forEach((r, i) => {
                r.style.display = i >= start && i < end ? '' : 'none';
            });

            paginationInstance.activatePage(pages[pageNumber - 1], pages);
        };

        pages.forEach((p, i) => {
            p.addEventListener('click', () => showPage(i + 1));
        });

        prev?.addEventListener('click', () => {
            const activeIndex = pages.findIndex(p => p.classList.contains('active'));
            if (activeIndex > 0) showPage(activeIndex);
        });

        next?.addEventListener('click', () => {
            const activeIndex = pages.findIndex(p => p.classList.contains('active'));
            if (activeIndex < pages.length - 1) showPage(activeIndex + 2);
        });

        showPage(1);
    }
}

new TablePaginator();