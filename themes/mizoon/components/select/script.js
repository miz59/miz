class CustomSelect {
    constructor(element) {
        if (!element) {
            document.querySelectorAll('.select').forEach(el => new CustomSelect(el));
            return;
        }

        this.select = element;
        this.label = this.select.querySelector('.select-label');
        this.display = this.select.querySelector('.selected-option');
        this.list = this.select.querySelector('.select-list');
        this.items = this.select.querySelectorAll('.select-option:not(.disable)');

        this.bindEvents();
    }

    bindEvents() {
        this.select.addEventListener('click', (e) => this.toggleList(e));

        this.items.forEach(item => {
            item.addEventListener('click', () => this.selectItem(item));
        });

        document.addEventListener('click', (e) => {
            if (!this.select.contains(e.target)) {
                this.select.classList.remove('active');
            }
        });
    }

    toggleList(e) {
        if (e.target.tagName.toLowerCase() === 'li' && !e.target.classList.contains('disable')) return;

        const rect = this.select.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow < 250 && spaceAbove > spaceBelow) {
            this.select.classList.remove('open-down');
            this.select.classList.add('open-up');
        } else {
            this.select.classList.remove('open-up');
            this.select.classList.add('open-down');
        }

        this.select.classList.toggle('active');
    }

    selectItem(item) {
        this.items.forEach(i => i.classList.remove('selected-option'));
        item.classList.add('selected-option');
        
        if (!this.display) {
            this.display = document.createElement('div');
            this.display.classList.add('selected-option');
            this.select.appendChild(this.display);
        }
        
        this.display.textContent = item.textContent;
        this.select.classList.remove('active');
        this.select.classList.add('has-value');
    }
}
new CustomSelect();