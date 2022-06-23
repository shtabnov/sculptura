let slides = document.querySelectorAll('.hero__image');
let count  = slides.length;

function slide() {
  setInterval(function () {
    removeActiv ()
    count--;
    count < 0 ? count = slides.length-1 : count;
    addActive (count)
  }, 5000);
}


function removeActiv () {
  slides.forEach(e => e.classList.remove('hero__image_active'))
}

function addActive (n) {
  slides[n].classList.add('hero__image_active');
}

slide();