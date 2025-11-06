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
  };

  // updateDashoffset
  var updateDashoffset = function updateDashoffset(scrollUpPathElement) {
    if (!scrollUpPathElement || !scrollUpPathElement.style) {
      return;
    }
    var height = document.documentElement.scrollHeight - window.innerHeight;
    var dashoffset = pathLength - getTop() * pathLength / height;
    scrollUpPathElement.style.strokeDashoffset = dashoffset;
  };

  // onScroll
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
  });

  // click
  scrollUp.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  // начальная отрисовка
  updateDashoffset(scrollUpPath);
});
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  var mapElement = document.getElementById("map");
  if (!mapElement) {
    return;
  }

  // Проверка наличия ymaps и что он инициализирован (без ошибок API ключа)
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
  var header = document.querySelector(".header");

  // Изменение прозрачности хедера при скролле (только для десктопа)
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
    });

    // Обработка изменения размера окна
    window.addEventListener("resize", function () {
      if (window.innerWidth <= 767.99) {
        header.classList.remove("header_scrolled");
      }
    });
  }

  // Синхронизируем состояние чекбокса с классом меню
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
  }

  // Закрываем меню при клике на ссылку
  if (navLinks && navLinks.length > 0) {
    navLinks.forEach(function (navLink) {
      if (navLink && navLink.addEventListener) {
        navLink.addEventListener("click", function () {
          // Закрываем меню
          if (navList && navList.classList) {
            navList.classList.remove("nav__list_active");
            document.body.style.overflow = "";
          }
          // Сбрасываем чекбокс (чтобы бургер вернулся в исходное состояние)
          if (menuBtn) {
            menuBtn.checked = false;
          }
        });
      }
    });
  }

  // Закрываем меню при клике на мобильный логотип
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

function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
document.addEventListener('DOMContentLoaded', function () {
  var anchors = document.querySelectorAll('a[href*="#"]');
  if (anchors && anchors.length > 0) {
    var _iterator = _createForOfIteratorHelper(anchors),
      _step;
    try {
      var _loop = function _loop() {
        var anchor = _step.value;
        anchor.addEventListener('click', function (e) {
          var href = anchor.getAttribute('href');

          // Проверяем, что это якорная ссылка (начинается с #)
          if (!href || !href.startsWith('#')) {
            return;
          }

          // Извлекаем ID элемента (убираем #)
          var blockID = href.substring(1);

          // Проверяем, что элемент существует на странице
          var targetElement = document.getElementById(blockID);
          if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
          // Если элемента нет, позволяем браузеру обработать ссылку (переход на другую страницу)
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