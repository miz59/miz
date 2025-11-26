class ListGroup {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('.list-group').forEach(list => {
            this.setupList(list);
        });
    }

    setupList(list) {
        const items = list.querySelectorAll('.list-group-item');

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();

                if (item.hasAttribute('disabled')) return;

                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }
}

new ListGroup();