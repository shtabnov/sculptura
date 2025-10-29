const saleSlider = document.querySelector('#sale_slider');
if (saleSlider) {
    new Splide( '#sale_slider', {
        type   : 'loop',
        perPage: 1,
    } ).mount();
}