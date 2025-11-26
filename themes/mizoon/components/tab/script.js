class Tabs {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('.tab').forEach(container => {
            const tabList = container.querySelector('.tab-list');
            const labels = container.querySelectorAll('.tab-label');
            const contents = container.querySelectorAll('.tab-content');
            const position = container.getAttribute('data-tab-list-position');
            let slider = null;

            if (position === 'bottom' || position === 'top') {
                container.style.flexDirection = 'column';
            } else if (position === 'left' || position === 'right') {
                container.style.flexDirection = 'row';
                tabList.style.flexDirection = 'column';
            }

            if (container.classList.contains('tab-list-slider')) {
                slider = tabList.querySelector('.tab-slider');
                if (!slider) {
                    slider = document.createElement('div');
                    slider.classList.add('tab-slider');
                    tabList.appendChild(slider);
                }
            }

            const moveSlider = (activeLabel) => {
                if (!slider) return;

                const rect = activeLabel.getBoundingClientRect();
                const parentRect = activeLabel.parentElement.getBoundingClientRect();

                if (position === 'left' || position === 'right') {
                    const height = rect.height;
                    const top = rect.top - parentRect.top;
                    slider.style.height = `${height}px`;
                    slider.style.transform = `translateY(${top}px)`;
                    slider.style.top = '0%';
                } else {
                    const width = rect.width;
                    const left = rect.left - parentRect.left;
                    slider.style.width = `${width}px`;
                    slider.style.transform = `translateX(${left}px)`;
                    slider.style.left = '0%';
                }
            };

            const setActiveTab = (index) => {
                labels.forEach(l => l.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                labels[index].classList.add('active');
                contents[index].classList.add('active');
                moveSlider(labels[index]);
            };

            labels.forEach((label, idx) => {
                label.addEventListener('click', () => setActiveTab(idx));
            });

            const activeLabel = container.querySelector('.tab-label.active');
            if (activeLabel) moveSlider(activeLabel);
        });
    }
}

new Tabs();