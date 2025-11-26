class Breadcrumbs {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('.breadcrumb').forEach(breadcrumb => {
            this.processBreadcrumb(breadcrumb);
        });
    }

    processBreadcrumb(breadcrumb) {
        const contentImage = breadcrumb.dataset.breadcrumbContentImage;
        const content = breadcrumb.dataset.breadcrumbContent;
        const contentSize = breadcrumb.dataset.breadcrumbContentImageSize;

        const breadcrumbItems = breadcrumb.querySelectorAll('.breadcrumb-item, li');

        breadcrumbItems.forEach(item => {
            if (contentImage) {
                item.style.setProperty('--content-image', `url(${contentImage})`);
                item.style.removeProperty('--content');
            } else if (content) {
                item.style.setProperty('--content', `"${content}"`);
                item.style.removeProperty('--content-image');
            }

            if (contentSize) {
                item.style.setProperty('--content-image-size', contentSize);
            }
        });
    }
}

new Breadcrumbs();