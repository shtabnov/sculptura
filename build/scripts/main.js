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

  // Закрываем меню при клике на ссылку и обрабатываем якорные ссылки
  if (navLinks && navLinks.length > 0) {
    navLinks.forEach(function (navLink) {
      if (navLink && navLink.addEventListener) {
        navLink.addEventListener("click", function (e) {
          var href = navLink.getAttribute("href");

          // Проверяем, является ли это якорной ссылкой (содержит #)
          if (href && href.includes("#")) {
            // Извлекаем якорь из ссылки
            var anchorMatch = href.match(/#(.+)$/);
            var anchor = anchorMatch ? anchorMatch[0] : ""; // #service, #price и т.д.

            if (anchor) {
              var isHomeLink = false;

              // Проверяем, ведет ли ссылка на главную страницу
              if (href.startsWith("/#") || href.startsWith("#")) {
                // Относительная ссылка типа /#service или #service
                isHomeLink = true;
              } else {
                try {
                  // Абсолютная ссылка
                  var url = new URL(href, window.location.origin);
                  isHomeLink = url.pathname === "/" || url.pathname === "" || url.pathname === "/index.html";
                } catch (err) {
                  // Если не удалось распарсить URL, считаем относительной
                  isHomeLink = href.startsWith("/") || href.startsWith("#");
                }
              }

              // Проверяем, находимся ли мы на главной странице
              var currentPath = window.location.pathname;
              var currentSearch = window.location.search;
              var isHomePage = (currentPath === "/" || currentPath === "/index.html" || currentPath === "") && (!currentSearch || currentSearch === "");

              // Если ссылка ведет на главную, но мы не на главной странице
              if (isHomeLink && !isHomePage) {
                e.preventDefault();
                // Перенаправляем на главную с якорем
                window.location.href = window.location.origin + anchor;
                return;
              }
            }
          }

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

/**
 * Валидация и маска ввода для номера телефона
 * Формат: +7 (9**) ***-**-**
 */
document.addEventListener("DOMContentLoaded", function () {
  var phoneInput = document.getElementById("phone");
  if (!phoneInput) {
    return;
  }

  /**
   * Форматирует номер телефона по маске: +7 (9**) ***-**-**
   * @param {string} value - Входное значение
   * @returns {string} - Отформатированный номер
   */
  function formatPhone(value) {
    // Извлекаем только цифры
    var digits = value.replace(/\D/g, "");
    if (!digits.length) return "";

    // Нормализуем: заменяем 8 на 7, добавляем 7 если отсутствует
    var cleaned = digits.startsWith("8") ? "7" + digits.slice(1) : digits.startsWith("7") ? digits : "7" + digits;

    // Ограничиваем до 11 цифр (7 + 10 цифр номера)
    cleaned = cleaned.slice(0, 11);

    // Извлекаем цифры после 7 (первые 10 цифр номера)
    var phoneDigits = cleaned.length > 1 ? cleaned.slice(1) : "";

    // Форматируем по маске
    if (!phoneDigits.length) return "+7";
    if (phoneDigits.length <= 3) return "+7 (".concat(phoneDigits);
    if (phoneDigits.length <= 6) {
      return "+7 (".concat(phoneDigits.slice(0, 3), ") ").concat(phoneDigits.slice(3));
    }
    if (phoneDigits.length <= 8) {
      return "+7 (".concat(phoneDigits.slice(0, 3), ") ").concat(phoneDigits.slice(3, 6), "-").concat(phoneDigits.slice(6));
    }
    // 9-10 цифр
    return "+7 (".concat(phoneDigits.slice(0, 3), ") ").concat(phoneDigits.slice(3, 6), "-").concat(phoneDigits.slice(6, 8), "-").concat(phoneDigits.slice(8, 10));
  }

  /**
   * Показывает сообщение об ошибке
   */
  function showError() {
    phoneInput.classList.add("form__input--error");
    var existingError = phoneInput.parentElement.querySelector(".form__error");
    if (existingError) {
      existingError.remove();
    }
    var errorMessage = document.createElement("span");
    errorMessage.className = "form__error";
    errorMessage.textContent = "Введите номер в формате: +7 (9**) ***-**-**";
    phoneInput.parentElement.appendChild(errorMessage);
  }

  /**
   * Убирает сообщение об ошибке
   */
  function removeError() {
    phoneInput.classList.remove("form__input--error");
    var errorMessage = phoneInput.parentElement.querySelector(".form__error");
    if (errorMessage) {
      errorMessage.remove();
    }
  }

  // Валидация: проверяем, что введено 10 цифр после +7 и начинается с 9
  function validatePhone() {
    var digits = phoneInput.value.replace(/\D/g, "");
    // Проверяем, что есть 11 цифр (7 + 10 цифр номера), и вторая цифра (после 7) равна 9
    var isValid = digits.length === 11 && digits.startsWith("7") && digits[1] === "9";
    return isValid;
  }

  // Обработка ввода
  phoneInput.addEventListener("input", function (e) {
    var value = e.target.value;
    var formatted = formatPhone(value);

    // Не позволяем вводить больше 18 символов (максимум маски)
    if (formatted.length > 18) {
      formatted = formatted.slice(0, 18);
    }
    e.target.value = formatted;

    // НЕ показываем ошибку во время ввода, только убираем если валидно
    if (validatePhone()) {
      removeError();
    }
  });

  // Обработчик вставки (Ctrl+V, Cmd+V)
  phoneInput.addEventListener("paste", function (e) {
    e.preventDefault();
    var pastedText = (e.clipboardData || window.clipboardData).getData("text");
    var formatted = formatPhone(pastedText);
    phoneInput.value = formatted;
    phoneInput.setSelectionRange(formatted.length, formatted.length);
    if (validatePhone()) {
      removeError();
    } else {
      showError();
    }
  });

  // Валидация при потере фокуса
  phoneInput.addEventListener("blur", function () {
    var value = phoneInput.value.trim();

    // Если поле пустое - убираем ошибку
    if (!value) {
      removeError();
      return;
    }

    // Если номер валиден - убираем ошибку, иначе показываем
    if (validatePhone()) {
      removeError();
    } else {
      showError();
    }
  });

  // Валидация при отправке формы
  var form = phoneInput.closest("form");
  if (form) {
    form.addEventListener("submit", function (e) {
      if (!validatePhone()) {
        e.preventDefault();
        showError();
        phoneInput.focus();
        phoneInput.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        return false;
      }
      removeError();
    });
  }

  // Сброс стилей при фокусе
  phoneInput.addEventListener("focus", function () {
    this.classList.remove("form__input--error");
    var errorMessage = this.parentElement.querySelector(".form__error");
    if (errorMessage) {
      errorMessage.textContent = "";
    }
  });
});
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  var reviewsSlider = document.querySelector("#reviews_slider");
  if (reviewsSlider && typeof Splide !== "undefined") {
    new Splide("#reviews_slider", {
      perPage: 2,
      perMove: 1,
      type: "loop",
      breakpoints: {
        1025: {
          fixedHeight: "442px"
        },
        769: {
          perPage: 1,
          fixedWidth: "calc(100% - 0px)",
          fixedHeight: "340px",
          arrows: false
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

/**
 * Плавная прокрутка к элементу с учетом высоты хедера
 * @param {string} elementId - ID целевого элемента
 * @param {boolean} smooth - Использовать плавную прокрутку
 * @returns {boolean} - Успешность операции
 */
function scrollToElement(elementId) {
  var smooth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var targetElement = document.getElementById(elementId);
  if (!targetElement) return false;
  var header = document.querySelector(".header");
  var headerHeight = (header === null || header === void 0 ? void 0 : header.offsetHeight) || 0;
  var OFFSET = 10; // Отступ от хедера

  // Вычисляем позицию элемента относительно документа
  var rect = targetElement.getBoundingClientRect();
  var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  var elementTop = rect.top + scrollTop;
  var offsetPosition = Math.max(0, elementTop - headerHeight - OFFSET);
  window.scrollTo({
    top: offsetPosition,
    behavior: smooth ? "smooth" : "auto"
  });
  return true;
}

/**
 * Извлекает ID якоря из URL
 * @param {string} href - URL ссылки
 * @returns {string|null} - ID элемента или null
 */
function extractAnchorId(href) {
  if (!href || !href.includes("#")) return null;
  if (href.startsWith("#")) {
    return href.substring(1);
  }
  var hashIndex = href.indexOf("#");
  var blockID = href.substring(hashIndex + 1);

  // Проверяем, ведет ли ссылка на другую страницу
  try {
    var url = new URL(href, window.location.origin);
    var currentPath = window.location.pathname;
    var targetPath = url.pathname;

    // Если это другая страница, не обрабатываем якорь
    if (targetPath && targetPath !== currentPath && targetPath !== "/") {
      return null;
    }
  } catch (err) {
    // Если не удалось распарсить URL, продолжаем обработку
  }
  return blockID;
}
document.addEventListener("DOMContentLoaded", function () {
  // Обрабатываем якорные ссылки при клике
  var anchors = document.querySelectorAll('a[href*="#"]');
  anchors.forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var href = anchor.getAttribute("href");
      var blockID = extractAnchorId(href);
      if (blockID && document.getElementById(blockID)) {
        e.preventDefault();
        scrollToElement(blockID, true);
      }
    });
  });

  // Обрабатываем якорь при загрузке страницы
  if (window.location.hash) {
    var hash = window.location.hash.substring(1);
    setTimeout(function () {
      return scrollToElement(hash, false);
    }, 100);
  }
});