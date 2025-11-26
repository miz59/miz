class Masonry {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('.masonry').forEach(masonry => {
            const columnCount = masonry.dataset.masonryColumnCount;
            masonry.style.setProperty('--masonry-column-count', columnCount);
        });
    }
}

new Masonry();