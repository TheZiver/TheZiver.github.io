(function() {
    const LAZY_CLASS = 'lazy-image-loading';
    const LOADED_CLASS = 'lazy-image-loaded';
    const ERROR_CLASS = 'lazy-image-error';

    function isElement(node: Node): node is Element {
        return node.nodeType === Node.ELEMENT_NODE;
    }

    function isHTMLElement(node: Node): node is HTMLElement {
        return node.nodeType === Node.ELEMENT_NODE;
    }

    function loadImage(img: HTMLImageElement): void {
        if (img.dataset.src && !img.dataset.loading) {
            img.dataset.loading = 'true';
            const imgSrc: string = img.dataset.src;
            img.removeAttribute('data-src');

            const tempImg: HTMLImageElement = new Image();
            tempImg.onload = function(): void {
                img.src = imgSrc;
                img.classList.remove(LAZY_CLASS);
                img.classList.add(LOADED_CLASS);
                delete img.dataset.loading;
            };
            tempImg.onerror = function(): void {
                img.classList.remove(LAZY_CLASS);
                img.classList.add(ERROR_CLASS);
                delete img.dataset.loading;
            };
            tempImg.src = imgSrc;
        }
    }

    function loadImages(container?: Element | null): void {
        const root: Document | Element = container || document;
        const images: NodeListOf<HTMLImageElement> = root.querySelectorAll('img.lazy-image-loading');
        images.forEach(function(img: HTMLImageElement) {
            if (img.dataset.src) {
                loadImage(img);
            }
        });
    }

    function processMutations(mutations: MutationRecord[]): void {
        for (let i = 0; i < mutations.length; i++) {
            const mutation: MutationRecord = mutations[i];
            const nodes: NodeList = mutation.addedNodes;
            for (let j = 0; j < nodes.length; j++) {
                const node: Node = nodes[j];
                if (isElement(node)) {
                    const el: Element = node;
                    if (el.tagName === 'IMG' && el.classList.contains(LAZY_CLASS)) {
                        loadImage(el as HTMLImageElement);
                    }
                    const subImages: NodeListOf<HTMLImageElement> = el.querySelectorAll('img.' + LAZY_CLASS);
                    subImages.forEach(function(img: HTMLImageElement) {
                        if (img.dataset.src) {
                            loadImage(img);
                        }
                    });
                }
            }
        }
    }

    const observer: MutationObserver = new MutationObserver(processMutations);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    document.addEventListener('DOMContentLoaded', function() {
        loadImages();
    });

    window.addEventListener('load', function() {
        loadImages();
    });
})();