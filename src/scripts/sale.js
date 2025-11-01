document.addEventListener('DOMContentLoaded', () => {
    const saleSlider = document.querySelector('#sale_slider');
    if (saleSlider && typeof Splide !== 'undefined') {
        new Splide('#sale_slider', {
            type: 'loop',
            perPage: 1,
        }).mount();
    }
});