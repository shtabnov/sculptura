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

  // Регулярное выражение для валидации формата +7 (9**) ***-**-**
  var phoneRegex = /^\+7\s?\(9\d{2}\)\s?\d{3}-\d{2}-\d{2}$/;

  /**
   * Извлекает только цифры пользователя (без 7 из +7)
   * @param {string} value - Значение поля
   * @returns {string} - Только цифры пользователя (максимум 10)
   */
  function extractUserDigits(value) {
    // Извлекаем все цифры
    var digits = value.replace(/\D/g, "");

    // Если есть цифры и первая 7, убираем её (это часть +7)
    if (digits.length > 0 && digits[0] === "7") {
      digits = digits.substring(1);
    }

    // Ограничиваем до 10 цифр
    if (digits.length > 10) {
      digits = digits.substring(0, 10);
    }
    return digits;
  }

  /**
   * Форматирует цифры в формат +7 (***) ***-**-**
   * @param {string} digits - Только цифры пользователя (без 7)
   * @returns {string} - Отформатированный номер
   */
  function formatPhone(digits) {
    if (!digits || digits.length === 0) {
      return "";
    }
    var formatted = "+7 (";

    // Первые 3 цифры
    if (digits.length > 0) {
      formatted += digits.substring(0, 3);
    }

    // Следующие 3 цифры
    if (digits.length >= 3) {
      formatted += ") " + digits.substring(3, 6);
    }

    // Следующие 2 цифры
    if (digits.length >= 6) {
      formatted += "-" + digits.substring(6, 8);
    }

    // Последние 2 цифры
    if (digits.length >= 8) {
      formatted += "-" + digits.substring(8, 10);
    }
    return formatted;
  }

  /**
   * Валидация номера телефона
   * @param {string} phone - Номер телефона
   * @returns {boolean} - true если валиден
   */
  function validatePhone(phone) {
    var cleanPhone = phone.replace(/\s/g, "");

    // Проверяем формат и что после +7( идет 9
    if (!phoneRegex.test(cleanPhone)) {
      return false;
    }

    // Дополнительная проверка: после +7( должна быть цифра 9
    var match = cleanPhone.match(/^\+7\((\d)/);
    if (match && match[1] !== "9") {
      return false;
    }
    return cleanPhone.length === 18; // +7(***)***-**-**
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

  /**
   * Вычисляет позицию курсора после форматирования
   * @param {string} oldValue - Старое значение
   * @param {number} oldCursorPos - Старая позиция курсора
   * @param {string} newValue - Новое значение
   * @param {number} userDigitsCount - Количество цифр пользователя
   * @returns {number} - Новая позиция курсора
   */
  function calculateNewCursorPosition(oldValue, oldCursorPos, newValue, userDigitsCount) {
    // Подсчитываем количество цифр до позиции курсора в старом значении
    var beforeCursor = oldValue.substring(0, oldCursorPos);
    var digitsBefore = beforeCursor.replace(/\D/g, "").length;

    // Если в старом значении была 7 из +7, не считаем её
    if (oldValue.startsWith("+7") && digitsBefore > 0) {
      var oldDigits = oldValue.replace(/\D/g, "");
      if (oldDigits.startsWith("7") && oldDigits.length > 1) {
        digitsBefore = Math.max(0, digitsBefore - 1);
      }
    }

    // Находим позицию в новом значении
    var digitCount = 0;
    var newCursorPosition = newValue.length;
    for (var i = 0; i < newValue.length; i++) {
      if (/\d/.test(newValue[i])) {
        digitCount++;
        if (digitCount === digitsBefore) {
          newCursorPosition = i + 1;
          break;
        }
      }
    }

    // Если курсор был в конце, ставим его в конец
    if (digitsBefore >= userDigitsCount) {
      newCursorPosition = newValue.length;
    }
    return newCursorPosition;
  }

  // Обработчик ввода - применяем маску
  phoneInput.addEventListener("input", function (e) {
    var oldValue = e.target.value;
    var oldCursorPos = e.target.selectionStart;

    // Извлекаем только цифры пользователя (без 7 из +7)
    var userDigits = extractUserDigits(e.target.value);

    // Если цифр нет, очищаем поле
    if (userDigits.length === 0) {
      e.target.value = "";
      return;
    }

    // Форматируем номер
    var newValue = formatPhone(userDigits);
    e.target.value = newValue;

    // Восстанавливаем позицию курсора
    var newCursorPos = calculateNewCursorPosition(oldValue, oldCursorPos, newValue, userDigits.length);
    e.target.setSelectionRange(newCursorPos, newCursorPos);

    // Проверяем валидность только при полном номере
    if (validatePhone(newValue)) {
      removeError();
    }
  });

  // Обработчик вставки (Ctrl+V, Cmd+V)
  phoneInput.addEventListener("paste", function (e) {
    e.preventDefault();
    var pastedText = (e.clipboardData || window.clipboardData).getData("text");
    var userDigits = extractUserDigits(pastedText);
    var formatted = formatPhone(userDigits);
    phoneInput.value = formatted;
    phoneInput.setSelectionRange(formatted.length, formatted.length);
    if (validatePhone(formatted)) {
      removeError();
    } else {
      showError();
    }
  });

  // Обработчик потери фокуса - валидация
  phoneInput.addEventListener("blur", function () {
    var value = phoneInput.value.trim();
    if (value && !validatePhone(value)) {
      showError();
    } else {
      removeError();
    }
  });

  // Обработчик отправки формы - валидация перед отправкой
  var form = phoneInput.closest("form");
  if (form) {
    form.addEventListener("submit", function (e) {
      var value = phoneInput.value.trim();
      if (!value || !validatePhone(value)) {
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

  // Обработчик клавиш - разрешаем только цифры и управляющие клавиши
  phoneInput.addEventListener("keydown", function (e) {
    var allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

    // Разрешаем Ctrl/Cmd + A, C, V, X
    if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) {
      return;
    }

    // Если это разрешенная клавиша, пропускаем
    if (allowedKeys.includes(e.key)) {
      return;
    }

    // Если это цифра, пропускаем
    if (/\d/.test(e.key)) {
      return;
    }

    // Запрещаем все остальные символы
    e.preventDefault();
  });
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
// Функция для плавной прокрутки к элементу с учетом хедера
function scrollToElement(elementId) {
  var smooth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var targetElement = document.getElementById(elementId);
  if (!targetElement) {
    return false;
  }

  // Получаем высоту хедера для учета при прокрутке
  var header = document.querySelector(".header");
  var headerHeight = header ? header.offsetHeight : 0;

  // Вычисляем позицию элемента относительно документа
  // Используем getBoundingClientRect для более точного расчета
  var rect = targetElement.getBoundingClientRect();
  var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  var elementTop = rect.top + scrollTop;

  // Вычитаем высоту хедера и добавляем небольшой отступ (10px) для комфорта
  var offsetPosition = elementTop - headerHeight - 10;

  // Прокручиваем с учетом высоты хедера
  window.scrollTo({
    top: Math.max(0, offsetPosition),
    // Убеждаемся, что позиция не отрицательная
    behavior: smooth ? "smooth" : "auto"
  });
  return true;
}
document.addEventListener("DOMContentLoaded", function () {
  // Обрабатываем якорные ссылки при клике
  var anchors = document.querySelectorAll('a[href*="#"]');
  if (anchors && anchors.length > 0) {
    var _iterator = _createForOfIteratorHelper(anchors),
      _step;
    try {
      var _loop = function _loop() {
        var anchor = _step.value;
        anchor.addEventListener("click", function (e) {
          var href = anchor.getAttribute("href");
          if (!href) {
            return;
          }

          // Извлекаем якорь из ссылки (может быть #reception или /#reception или полный URL)
          var blockID = null;

          // Если ссылка начинается с #, это локальный якорь
          if (href.startsWith("#")) {
            blockID = href.substring(1);
          }
          // Если ссылка содержит #, извлекаем якорь
          else if (href.includes("#")) {
            var hashIndex = href.indexOf("#");
            blockID = href.substring(hashIndex + 1);

            // Проверяем, ведет ли ссылка на другую страницу
            try {
              var url = new URL(href, window.location.origin);
              var currentPath = window.location.pathname;
              var targetPath = url.pathname;

              // Если это другая страница, позволяем браузеру обработать переход
              if (targetPath !== currentPath && targetPath !== "/" && targetPath !== "") {
                return; // Позволяем браузеру обработать переход
              }
            } catch (err) {
              // Если не удалось распарсить URL, продолжаем обработку
            }
          } else {
            return; // Нет якоря в ссылке
          }

          // Проверяем, что элемент существует на текущей странице
          var targetElement = document.getElementById(blockID);
          if (targetElement) {
            e.preventDefault();
            scrollToElement(blockID, true);
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

  // Обрабатываем якорь при загрузке страницы (если в URL есть #)
  if (window.location.hash) {
    var hash = window.location.hash.substring(1); // Убираем #

    // Небольшая задержка, чтобы убедиться, что страница полностью загружена
    setTimeout(function () {
      scrollToElement(hash, false); // Без плавной прокрутки при загрузке
    }, 100);
  }
});