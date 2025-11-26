class Range {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('.range').forEach(range => {
            const rangeHeight = range.dataset.rangeHeight;
            if (rangeHeight) {
                range.style.setProperty('--range-height', rangeHeight);
            }
        });
    }
}

new Range();