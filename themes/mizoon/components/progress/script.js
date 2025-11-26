class ProgressBar {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('.progress-bar').forEach(bar => {
            const percentage = bar.dataset.progressPercentage;
            const duration = bar.dataset.progressDuration;
            const delay = bar.dataset.progressDelay;

            if (percentage) {
                bar.style.setProperty('--percentage', percentage);
            }

            if (duration) {
                bar.style.setProperty('--progress-animation-duration', duration);
            }

            if (delay) {
                bar.style.setProperty('--progress-animation-delay', delay);
            }
        });
    }
}

new ProgressBar();