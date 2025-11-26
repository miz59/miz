class Accordion {
    constructor() {
        this.accordionItems = document.querySelectorAll('.accordion');
        this.init();
    }

    init() {
        this.accordionItems.forEach(item => {
            item.addEventListener('click', (event) => this.handleAccordionClick(event));
        });
    }

    handleAccordionClick(event) {
        const clickedItem = event.currentTarget;
        const parentElement = clickedItem.parentElement;
        const siblings = parentElement.querySelectorAll('.accordion');

        if (this.isIndependent(clickedItem)) {
            this.toggleAccordion(clickedItem);
            return;
        }

        this.closeOtherAccordions(siblings, clickedItem);
        this.toggleAccordion(clickedItem);
    }

    isIndependent(item) {
        return item.classList.contains('accordion-absolute');
    }

    toggleAccordion(item) {
        item.classList.toggle('active');
    }

    closeOtherAccordions(siblings, currentItem) {
        siblings.forEach(sibling => {
            if (sibling !== currentItem && !this.isIndependent(sibling)) {
                sibling.classList.remove('active');
            }
        });
    }
}

// Initialize accordion when DOM is loaded
new Accordion();