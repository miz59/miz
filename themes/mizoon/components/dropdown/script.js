class Dropdown {
    constructor(element) {
        this.dropdown = element;
        this.box = this.dropdown.querySelector('.dropdown-box');
        this.menu = this.dropdown.querySelector('.dropdown-menu');
        this.submenus = this.dropdown.querySelectorAll('.dropdown-submenu');
        this.isHoverEnabled = this.dropdown.classList.contains('dropdown-hover') || 
        this.menu.classList.contains('dropdown-hover');
        
        this.init();
    }

    init() {
        // Add click event to button only if hover is not enabled
        if (!this.isHoverEnabled) {
            this.box.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }

        // Handle submenu hover
        this.submenus.forEach(submenu => {
            const toggle = submenu.querySelector('.dropdown-submenu-toggle');
            const submenuList = submenu.querySelector('.dropdown-menu');

            // Handle click on submenu toggle only if hover is not enabled
            if (!this.isHoverEnabled) {
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleSubmenu(submenu);
                });
            }

            // Handle hover on submenu
            submenu.addEventListener('mouseenter', () => {
                if (window.innerWidth > 768) { // Only on desktop
                    if (this.isHoverEnabled) {
                        this.openSubmenu(submenu);
                    }
                }
            });

            submenu.addEventListener('mouseleave', () => {
                if (window.innerWidth > 768) { // Only on desktop
                    if (this.isHoverEnabled) {
                        this.closeSubmenu(submenu);
                    }
                }
            });
        });

        // Close dropdown when clicking outside (only if hover is not enabled)
        if (!this.isHoverEnabled) {
            document.addEventListener('click', (e) => {
                if (!this.dropdown.contains(e.target)) {
                    this.close();
                }
            });

            // Handle escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.close();
                }
            });
        }
    }

    toggle() {
        if (this.dropdown.classList.contains('active')) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        // Close all other dropdowns first
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
            if (dropdown !== this.dropdown) {
                dropdown.classList.remove('active');
            }
        });

        this.dropdown.classList.add('active');
    }

    close() {
        this.dropdown.classList.remove('active');
        // Close all submenus
        this.submenus.forEach(submenu => {
            this.closeSubmenu(submenu);
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
        // Close other submenus at the same level
        const siblings = Array.from(submenu.parentElement.children)
            .filter(child => child !== submenu && child.classList.contains('dropdown-submenu'));
        
        siblings.forEach(sibling => {
            this.closeSubmenu(sibling);
        });

        submenu.classList.add('active');
    }

    closeSubmenu(submenu) {
        submenu.classList.remove('active');
        // Close all child submenus
        submenu.querySelectorAll('.dropdown-submenu').forEach(child => {
            this.closeSubmenu(child);
        });
    }
}

// Initialize all dropdowns when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        new Dropdown(dropdown);
    });
});