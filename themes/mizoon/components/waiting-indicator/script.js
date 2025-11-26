class Loader {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('[class*="loader-"]').forEach(loader => {
            for (const attr of loader.attributes) {
                if (attr.name.startsWith('data-loader-')) {
                    const cssVar = '--' + attr.name.slice(5);
                    loader.style.setProperty(cssVar, attr.value);
                }
            }
        });
    }
}

new Loader();