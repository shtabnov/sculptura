"use strict";

document.addEventListener("DOMContentLoaded", function () {
  var offset = 100;
  var scrollUp = document.querySelector(".scroll-up");
  var scrollUpPath = document.querySelector(".scroll-up__path");

  if (!scrollUp || !scrollUpPath || typeof scrollUpPath.getTotalLength !== "function") {
    return;
  }

  var pathLength = scrollUpPath.getTotalLength();
  scrollUpPath.style.strokeDasharray = "".concat(pathLength, " ").concat(pathLength);
  scrollUpPath.style.transition = "stroke-dashoffset 20ms";

  var getTop = function getTop() {
    return window.pageYOffset || document.documentElement.scrollTop;
  }; // updateDashoffset


  var updateDashoffset = function updateDashoffset(scrollUpPathElement) {
    if (!scrollUpPathElement || !scrollUpPathElement.style) {
      return;
    }

    var height = document.documentElement.scrollHeight - window.innerHeight;
    var dashoffset = pathLength - getTop() * pathLength / height;
    scrollUpPathElement.style.strokeDashoffset = dashoffset;
  }; // onScroll


  window.addEventListener("scroll", function () {
    // Проверяем существование элементов при каждом вызове
    var currentScrollUp = document.querySelector(".scroll-up");
    var currentScrollUpPath = document.querySelector(".scroll-up__path");

    if (!currentScrollUp || !currentScrollUp.classList || !currentScrollUpPath) {
      return;
    }

    updateDashoffset(currentScrollUpPath);

    if (getTop() > offset) {
      currentScrollUp.classList.add("scroll-up_active");
    } else {
      currentScrollUp.classList.remove("scroll-up_active");
    }
  }); // click

  scrollUp.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }); // начальная отрисовка

  updateDashoffset(scrollUpPath);
});
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  var mapElement = document.getElementById("map");

  if (!mapElement) {
    return;
  } // Проверка наличия ymaps и что он инициализирован (без ошибок API ключа)


  if (typeof ymaps === "undefined" || !ymaps || !ymaps.ready) {
    console.warn("Yandex Maps API не загружен. Карта не будет отображаться.");
    return;
  }

  ymaps.ready(init);
  var center = [];
  var width = document.documentElement.clientWidth;

  if (width < 769) {
    center = [57.97533526685659, 56.10150267024038];
  } else {
    center = [57.97533526685659, 56.10338558096882];
  }

  function init() {
    if (!document.getElementById("map")) {
      return;
    }

    var map = new ymaps.Map("map", {
      center: center,
      zoom: 18
    });
    var placemark = new ymaps.Placemark([57.97533526685659, 56.10150267024038], {
      balloonContentHeader: "Sculptura",
      balloonContentBody: "д. Кондратово ул. Карла Маркса, 8А",
      balloonContentFooter: "8 963-881-62-67",
      hintContent: "Забота о себе"
    }, {
      iconLayout: "default#image",
      iconImageHref: (window.SCL_THEME_URI || "") + "/assets/images/icon/location.svg",
      iconImageSize: [100, 100],
      iconImageOffset: [-40, -100]
    });
    map.geoObjects.add(placemark);
    map.controls.remove("geolocationControl"); // удаляем геолокацию

    map.controls.remove("searchControl"); // удаляем поиск

    map.controls.remove("trafficControl"); // удаляем контроль трафика

    map.controls.remove("typeSelector"); // удаляем тип

    map.controls.remove("fullscreenControl"); // удаляем кнопку перехода в полноэкранный режим
    // map.controls.remove('zoomControl'); // удаляем контрол зуммирования

    map.controls.remove("rulerControl"); // удаляем контрол правил

    map.behaviors.disable(["scrollZoom"]); // отключаем скролл карты (опционально)
  }
});
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  var menuBtn = document.getElementById("menu__toggle");
  var navList = document.querySelector(".nav__list");
  var navLinks = document.querySelectorAll(".nav__item a.nav__link, .nav__item a.nav__logo");
  var mobileLogo = document.querySelector(".nav__logo_mobile");
  var header = document.querySelector(".header"); // Изменение прозрачности хедера при скролле (только для десктопа)

  if (header && window.innerWidth > 767.99) {
    var lastScrollTop = 0;
    window.addEventListener("scroll", function () {
      // Проверяем, что это не мобильная версия
      if (window.innerWidth > 767.99) {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 50) {
          header.classList.add("header_scrolled");
        } else {
          header.classList.remove("header_scrolled");
        }

        lastScrollTop = scrollTop;
      } else {
        // На мобильной версии убираем класс при скролле
        header.classList.remove("header_scrolled");
      }
    }); // Обработка изменения размера окна

    window.addEventListener("resize", function () {
      if (window.innerWidth <= 767.99) {
        header.classList.remove("header_scrolled");
      }
    });
  } // Синхронизируем состояние чекбокса с классом меню


  if (menuBtn && navList) {
    menuBtn.addEventListener("change", function () {
      if (menuBtn.checked) {
        navList.classList.add("nav__list_active");
        document.body.style.overflow = "hidden"; // Блокируем скролл при открытом меню
      } else {
        navList.classList.remove("nav__list_active");
        document.body.style.overflow = ""; // Восстанавливаем скролл
      }
    });
  } // Закрываем меню при клике на ссылку


  if (navLinks && navLinks.length > 0) {
    navLinks.forEach(function (navLink) {
      if (navLink && navLink.addEventListener) {
        navLink.addEventListener("click", function () {
          // Закрываем меню
          if (navList && navList.classList) {
            navList.classList.remove("nav__list_active");
            document.body.style.overflow = "";
          } // Сбрасываем чекбокс (чтобы бургер вернулся в исходное состояние)


          if (menuBtn) {
            menuBtn.checked = false;
          }
        });
      }
    });
  } // Закрываем меню при клике на мобильный логотип


  if (mobileLogo) {
    mobileLogo.addEventListener("click", function () {
      if (navList && navList.classList) {
        navList.classList.remove("nav__list_active");
        document.body.style.overflow = "";
      }

      if (menuBtn) {
        menuBtn.checked = false;
      }
    });
  }
});
"use strict";

document.addEventListener('DOMContentLoaded', function () {
  var slides = document.querySelectorAll('.hero__image');
  var count = slides.length;

  if (count > 0) {
    var slide = function slide() {
      setInterval(function () {
        removeActiv();
        currentSlide--;
        currentSlide < 0 ? currentSlide = slides.length - 1 : currentSlide;
        addActive(currentSlide);
      }, 5000);
    };

    var removeActiv = function removeActiv() {
      slides.forEach(function (e) {
        if (e) {
          e.classList.remove('hero__image_active');
        }
      });
    };

    var addActive = function addActive(n) {
      if (slides[n]) {
        slides[n].classList.add('hero__image_active');
      }
    };

    var currentSlide = 0;
    slide();
  }
});
"use strict";

document.addEventListener('DOMContentLoaded', function () {
  var reviewsSlider = document.querySelector('#reviews_slider');

  if (reviewsSlider && typeof Splide !== 'undefined') {
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
  }
});
"use strict";

document.addEventListener('DOMContentLoaded', function () {
  var saleSlider = document.querySelector('#sale_slider');

  if (saleSlider && typeof Splide !== 'undefined') {
    new Splide('#sale_slider', {
      type: 'loop',
      perPage: 1
    }).mount();
  }
});
"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

document.addEventListener('DOMContentLoaded', function () {
  var anchors = document.querySelectorAll('a[href*="#"]');

  if (anchors && anchors.length > 0) {
    var _iterator = _createForOfIteratorHelper(anchors),
        _step;

    try {
      var _loop = function _loop() {
        var anchor = _step.value;
        anchor.addEventListener('click', function (e) {
          var href = anchor.getAttribute('href'); // Проверяем, что это якорная ссылка (начинается с #)

          if (!href || !href.startsWith('#')) {
            return;
          } // Извлекаем ID элемента (убираем #)


          var blockID = href.substring(1); // Проверяем, что элемент существует на странице

          var targetElement = document.getElementById(blockID);

          if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          } // Если элемента нет, позволяем браузеру обработать ссылку (переход на другую страницу)

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
  }
});