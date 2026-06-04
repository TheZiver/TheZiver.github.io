"use strict";
(function () {
    const LAZY_CLASS = 'lazy-image-loading';
    const LOADED_CLASS = 'lazy-image-loaded';
    const ERROR_CLASS = 'lazy-image-error';
    function isElement(node) {
        return node.nodeType === Node.ELEMENT_NODE;
    }
    function isHTMLElement(node) {
        return node.nodeType === Node.ELEMENT_NODE;
    }
    function loadImage(img) {
        if (img.dataset.src && !img.dataset.loading) {
            img.dataset.loading = 'true';
            const imgSrc = img.dataset.src;
            img.removeAttribute('data-src');
            const tempImg = new Image();
            tempImg.onload = function () {
                img.src = imgSrc;
                img.classList.remove(LAZY_CLASS);
                img.classList.add(LOADED_CLASS);
                delete img.dataset.loading;
            };
            tempImg.onerror = function () {
                img.classList.remove(LAZY_CLASS);
                img.classList.add(ERROR_CLASS);
                delete img.dataset.loading;
            };
            tempImg.src = imgSrc;
        }
    }
    function loadImages(container) {
        const root = container || document;
        const images = root.querySelectorAll('img.lazy-image-loading');
        images.forEach(function (img) {
            if (img.dataset.src) {
                loadImage(img);
            }
        });
    }
    function processMutations(mutations) {
        for (let i = 0; i < mutations.length; i++) {
            const mutation = mutations[i];
            const nodes = mutation.addedNodes;
            for (let j = 0; j < nodes.length; j++) {
                const node = nodes[j];
                if (isElement(node)) {
                    const el = node;
                    if (el.tagName === 'IMG' && el.classList.contains(LAZY_CLASS)) {
                        loadImage(el);
                    }
                    const subImages = el.querySelectorAll('img.' + LAZY_CLASS);
                    subImages.forEach(function (img) {
                        if (img.dataset.src) {
                            loadImage(img);
                        }
                    });
                }
            }
        }
    }
    const observer = new MutationObserver(processMutations);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    document.addEventListener('DOMContentLoaded', function () {
        loadImages();
    });
    window.addEventListener('load', function () {
        loadImages();
    });
})();
