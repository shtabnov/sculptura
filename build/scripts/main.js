"use strict";

var offset = 100;
var scrollUp = document.querySelector('.scroll-up');
var scrollUpPath = document.querySelector('.scroll-up__path');
var pathLength = scrollUpPath.getTotalLength();
scrollUpPath.style.strokeDasharray = "".concat(pathLength, " ").concat(pathLength);
scrollUpPath.style.transition = 'stroke-dashoffset 20ms';

var getTop = function getTop() {
  return window.pageYOffset || document.documentElement.scrollTop;
}; // updateDashoffset


var updateDashoffset = function updateDashoffset() {
  var height = document.documentElement.scrollHeight - window.innerHeight;
  var dashoffset = pathLength - getTop() * pathLength / height;
  scrollUpPath.style.strokeDashoffset = dashoffset;
}; //onScroll 


window.addEventListener('scroll', function () {
  updateDashoffset();

  if (getTop() > offset) {
    scrollUp.classList.add('scroll-up_active');
  } else {
    scrollUp.classList.remove('scroll-up_active');
  }
}); //click

scrollUp.addEventListener('click', function () {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});
"use strict";

ymaps.ready(init);
var center = [];
var width = document.documentElement.clientWidth;

if (width < 769) {
  center = [57.97533526685659, 56.10150267024038];
} else {
  center = [57.97533526685659, 56.10338558096882];
}

function init() {
  var map = new ymaps.Map('map', {
    center: center,
    zoom: 18
  });
  var placemark = new ymaps.Placemark([57.97533526685659, 56.10150267024038], {
    balloonContentHeader: 'Sculptura',
    balloonContentBody: 'д. Кондратово ул. Карла Маркса, 8А',
    balloonContentFooter: '8 963-881-62-67',
    hintContent: 'Забота о себе'
  }, {
    iconLayout: 'default#image',
    iconImageHref: 'images/icon/location.svg',
    iconImageSize: [100, 100],
    iconImageOffset: [-40, -100]
  });
  map.geoObjects.add(placemark);
  map.controls.remove('geolocationControl'); // удаляем геолокацию

  map.controls.remove('searchControl'); // удаляем поиск

  map.controls.remove('trafficControl'); // удаляем контроль трафика

  map.controls.remove('typeSelector'); // удаляем тип

  map.controls.remove('fullscreenControl'); // удаляем кнопку перехода в полноэкранный режим
  // map.controls.remove('zoomControl'); // удаляем контрол зуммирования

  map.controls.remove('rulerControl'); // удаляем контрол правил

  map.behaviors.disable(['scrollZoom']); // отключаем скролл карты (опционально)
}
"use strict";

var menuBtn = document.getElementById('menu__toggle');
var navList = document.querySelector('.nav__list');
var navItems = document.querySelectorAll('.nav__item');
var header = document.querySelector('.header'); // Отображаем меню при нажитии на бургер

menuBtn.addEventListener('click', function () {
  navList.classList.toggle('nav__list_active');
}); // Скрываем меню при нажатии на ссылку

navItems.forEach(function (navItem) {
  return navItem.addEventListener('click', function () {
    navList.classList.toggle('nav__list_active');
  });
}); // фиксируем хедер при прокрутке

window.addEventListener('scroll', function () {
  if (window.scrollY > 1) {
    header.classList.add('header_fixed');
  } else {
    header.classList.remove('header_fixed');
  }
});
"use strict";

var slides = document.querySelectorAll('.hero__image');
var count = slides.length;

if (count > 0) {
  var slide = function slide() {
    setInterval(function () {
      removeActiv();
      count--;
      count < 0 ? count = slides.length - 1 : count;
      addActive(count);
    }, 5000);
  };

  var removeActiv = function removeActiv() {
    slides.forEach(function (e) {
      return e.classList.remove('hero__image_active');
    });
  };

  var addActive = function addActive(n) {
    slides[n].classList.add('hero__image_active');
  };

  slide();
}
"use strict";

new Splide('#reviews_slider', {
  perPage: 2,
  perMove: 1,
  type: 'loop',
  breakpoints: {
    1025: {
      fixedHeight: '442px'
    },
    769: {
      perPage: 1,
      fixedWidth: 'calc(100% - 0px)',
      fixedHeight: '340px'
    }
  }
}).mount();
"use strict";

new Splide('#sale_slider', {
  type: 'loop',
  perPage: 1
}).mount();
// const anchors = document.querySelectorAll('a[href*="#"]');
// console.log()
// if (anchors) {
//     for (let anchor of anchors) {
//         anchor.addEventListener('click', function (e) {
//             e.preventDefault();
//             const blockID = anchor.getAttribute('href').substr(1);
//             console.log(blockID);
//             document.getElementById(blockID).scrollIntoView({
//                 behavior: 'smooth',
//                 block: 'start',
//             });
//         });
//     }
// }
"use strict";