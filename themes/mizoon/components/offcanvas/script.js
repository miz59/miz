class Offcanvas {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('.offcanvas-static.offcanvas-backdrop').forEach(offcanvas => {
            const toggle = offcanvas.querySelector('.offcanvas-toggle');
            if (toggle && !offcanvas.querySelector('.backdrop')) {
                const backdrop = document.createElement('div');
                backdrop.className = 'backdrop';
                toggle.insertAdjacentElement('afterend', backdrop);
            }
        });

        document.querySelectorAll('.offcanvas-toggle').forEach(trigger => {
            trigger.addEventListener('click', () => this.toggleOffcanvas(trigger));
        });

        document.querySelectorAll('.offcanvas-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                const offcanvas = closeBtn.closest('.offcanvas-static');
                const trigger = offcanvas.querySelector('.offcanvas-toggle');
                this.closeOffcanvas(trigger);
            });
        });

        document.querySelectorAll('.backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => {
                const offcanvas = backdrop.closest('.offcanvas-static');
                const trigger = offcanvas.querySelector('.offcanvas-toggle');
                this.closeOffcanvas(trigger);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.offcanvas-toggle.active').forEach(trigger => {
                    this.closeOffcanvas(trigger);
                });
            }
        });
    }

    toggleOffcanvas(trigger) {
        if (trigger.classList.contains('active')) {
            this.closeOffcanvas(trigger);
        } else {
            this.openOffcanvas(trigger);
        }
    }

    openOffcanvas(trigger) {
        const offcanvas = trigger.closest('.offcanvas-static');
        trigger.classList.add('active');
        
        if (offcanvas.classList.contains('offcanvas-scroll')) {
            document.body.style.overflow = 'unset';
        } else if (offcanvas.classList.contains('offcanvas-no-scroll')) {
            document.body.style.overflow = 'hidden';
        }
    }

    closeOffcanvas(trigger) {
        const offcanvas = trigger.closest('.offcanvas-static');
        trigger.classList.remove('active');
        
        const activeOffcanvas = document.querySelector('.offcanvas-static .offcanvas-toggle.active');
        if (activeOffcanvas) {
            const activeOffcanvasParent = activeOffcanvas.closest('.offcanvas-static');
            if (activeOffcanvasParent.classList.contains('offcanvas-scroll')) {
                document.body.style.overflow = 'unset';
            } else if (activeOffcanvasParent.classList.contains('offcanvas-no-scroll')) {
                document.body.style.overflow = 'hidden';
            }
        } else {
            document.body.style.overflow = '';
        }
    }
}

new Offcanvas();