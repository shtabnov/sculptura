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
  console.log(window.scrollY);

  if (window.scrollY > 1) {
    header.classList.add('header_fixed');
  } else {
    header.classList.remove('header_fixed');
  }
});
"use strict";

var slides = document.querySelectorAll('.hero__image');
var count = slides.length;

function slide() {
  setInterval(function () {
    removeActiv();
    count--;
    count < 0 ? count = slides.length - 1 : count;
    addActive(count);
  }, 5000);
}

function removeActiv() {
  slides.forEach(function (e) {
    return e.classList.remove('hero__image_active');
  });
}

function addActive(n) {
  slides[n].classList.add('hero__image_active');
}

slide();
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
"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var anchors = document.querySelectorAll('a[href*="#"]');

var _iterator = _createForOfIteratorHelper(anchors),
    _step;

try {
  var _loop = function _loop() {
    var anchor = _step.value;
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      var blockID = anchor.getAttribute('href').substr(1);
      document.getElementById(blockID).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  };

  for (_iterator.s(); !(_step = _iterator.n()).done;) {
    _loop();
  }
} catch (err) {
  _iterator.e(err);
} finally {
  _iterator.f();
}