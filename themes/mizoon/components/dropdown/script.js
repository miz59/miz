class Dropdown {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            this.setupDropdown(dropdown);
        });
    }

    setupDropdown(dropdown) {
        const box = dropdown.querySelector('.dropdown-box');
        const menu = dropdown.querySelector('.dropdown-menu');
        const submenus = dropdown.querySelectorAll('.dropdown-submenu');
        const isHoverEnabled = dropdown.classList.contains('dropdown-hover') || 
            (menu && menu.classList.contains('dropdown-hover'));

        if (!isHoverEnabled) {
            box.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle(dropdown);
            });
        }

        submenus.forEach(submenu => {
            const toggle = submenu.querySelector('.dropdown-submenu-toggle');

            if (!isHoverEnabled && toggle) {
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleSubmenu(submenu);
                });
            }

            submenu.addEventListener('mouseenter', () => {
                if (window.innerWidth > 768 && isHoverEnabled) {
                    this.openSubmenu(submenu);
                }
            });

            submenu.addEventListener('mouseleave', () => {
                if (window.innerWidth > 768 && isHoverEnabled) {
                    this.closeSubmenu(submenu);
                }
            });
        });

        if (!isHoverEnabled) {
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    this.close(dropdown);
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.close(dropdown);
                }
            });
        }
    }

    toggle(dropdown) {
        if (dropdown.classList.contains('active')) {
            this.close(dropdown);
        } else {
            this.open(dropdown);
        }
    }

    open(dropdown) {
        document.querySelectorAll('.dropdown.active').forEach(d => {
            if (d !== dropdown) d.classList.remove('active');
        });
        dropdown.classList.add('active');
    }

    close(dropdown) {
        dropdown.classList.remove('active');
        dropdown.querySelectorAll('.dropdown-submenu').forEach(sub => {
            this.closeSubmenu(sub);
        });
    }

    toggleSubmenu(submenu) {
        if (submenu.classList.contains('active')) {
            this.closeSubmenu(submenu);
        } else {
            this.openSubmenu(submenu);
        }
    }

    openSubmenu(submenu) {
        const siblings = Array.from(submenu.parentElement.children)
            .filter(child => child !== submenu && child.classList.contains('dropdown-submenu'));
        siblings.forEach(sib => this.closeSubmenu(sib));
        submenu.classList.add('active');
    }

    closeSubmenu(submenu) {
        submenu.classList.remove('active');
        submenu.querySelectorAll('.dropdown-submenu').forEach(child => {
            this.closeSubmenu(child);
        });
    }
}

new Dropdown();