class Nav {
    constructor(selector = '.nav') {
        this.navs = document.querySelectorAll(selector);
        this.init();
    }

    init() {
        this.navs.forEach(nav => {
            this.setupNavItems(nav);
        });
    }

    setupNavItems(nav) {
        const items = nav.querySelectorAll('.nav-item');
        
        items.forEach(item => {
            if (!item.classList.contains('disabled')) {
                item.addEventListener('click', (e) => {
                    if (!item.classList.contains('disabled')) {
                        e.preventDefault();
                        this.setActiveItem(nav, item);
                    }
                });

                const elements = item.querySelectorAll('a, p, span, div');
                elements.forEach(element => {
                    element.addEventListener('click', (e) => {
                        if (!item.classList.contains('disabled')) {
                            e.preventDefault();
                            e.stopPropagation();
                            this.setActiveItem(nav, item);
                        }
                    });
                });
            }
        });
    }

    setActiveItem(nav, targetItem) {
        const items = nav.querySelectorAll('.nav-item');
        
        items.forEach(item => {
            if (item === targetItem) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    disableItem(item) {
        if (item) {
            item.classList.add('disabled');
            item.style.pointerEvents = 'none';
        }
    }

    enableItem(item) {
        if (item) {
            item.classList.remove('disabled');
            item.style.pointerEvents = 'auto';
        }
    }
}

new Nav();