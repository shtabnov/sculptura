document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.hero__image');
    const count = slides.length;

    if (count > 0) {
        let currentSlide = 0;

        function slide() {
            setInterval(function () {
                removeActiv();
                currentSlide--;
                currentSlide < 0 ? (currentSlide = slides.length - 1) : currentSlide;
                addActive(currentSlide);
            }, 5000);
        }

        function removeActiv() {
            slides.forEach((e) => {
                if (e) {
                    e.classList.remove('hero__image_active');
                }
            });
        }

        function addActive(n) {
            if (slides[n]) {
                slides[n].classList.add('hero__image_active');
            }
        }

        slide();
    }
});
