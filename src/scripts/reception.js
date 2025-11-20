"use strict";

/**
 * Валидация и маска ввода для номера телефона
 * Формат: +7 (9**) ***-**-**
 */

document.addEventListener("DOMContentLoaded", function () {
    const phoneInput = document.getElementById("phone");

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
        const digits = value.replace(/\D/g, "");
        if (!digits.length) return "";

        // Нормализуем: заменяем 8 на 7, добавляем 7 если отсутствует
        let cleaned = digits.startsWith("8")
            ? "7" + digits.slice(1)
            : digits.startsWith("7")
            ? digits
            : "7" + digits;

        // Ограничиваем до 11 цифр (7 + 10 цифр номера)
        cleaned = cleaned.slice(0, 11);

        // Извлекаем цифры после 7 (первые 10 цифр номера)
        const phoneDigits = cleaned.length > 1 ? cleaned.slice(1) : "";

        // Форматируем по маске
        if (!phoneDigits.length) return "+7";
        if (phoneDigits.length <= 3) return `+7 (${phoneDigits}`;
        if (phoneDigits.length <= 6) {
            return `+7 (${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3)}`;
        }
        if (phoneDigits.length <= 8) {
            return `+7 (${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(
                3,
                6
            )}-${phoneDigits.slice(6)}`;
        }
        // 9-10 цифр
        return `+7 (${phoneDigits.slice(
            0,
            3
        )}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6, 8)}-${phoneDigits.slice(8, 10)}`;
    }

    /**
     * Показывает сообщение об ошибке
     */
    function showError() {
        phoneInput.classList.add("form__input--error");

        const existingError =
            phoneInput.parentElement.querySelector(".form__error");
        if (existingError) {
            existingError.remove();
        }

        const errorMessage = document.createElement("span");
        errorMessage.className = "form__error";
        errorMessage.textContent =
            "Введите номер в формате: +7 (9**) ***-**-**";
        phoneInput.parentElement.appendChild(errorMessage);
    }

    /**
     * Убирает сообщение об ошибке
     */
    function removeError() {
        phoneInput.classList.remove("form__input--error");
        const errorMessage =
            phoneInput.parentElement.querySelector(".form__error");
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    // Валидация: проверяем, что введено 10 цифр после +7 и начинается с 9
    function validatePhone() {
        const digits = phoneInput.value.replace(/\D/g, "");
        // Проверяем, что есть 11 цифр (7 + 10 цифр номера), и вторая цифра (после 7) равна 9
        const isValid =
            digits.length === 11 && digits.startsWith("7") && digits[1] === "9";

        return isValid;
    }

    // Обработка ввода
    phoneInput.addEventListener("input", function (e) {
        let value = e.target.value;
        let formatted = formatPhone(value);

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
        const pastedText = (e.clipboardData || window.clipboardData).getData(
            "text"
        );
        const formatted = formatPhone(pastedText);
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
        const value = phoneInput.value.trim();

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
    const form = phoneInput.closest("form");
    if (form) {
        form.addEventListener("submit", function (e) {
            if (!validatePhone()) {
                e.preventDefault();
                showError();
                phoneInput.focus();
                phoneInput.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
                return false;
            }

            removeError();
        });
    }

    // Сброс стилей при фокусе
    phoneInput.addEventListener("focus", function () {
        this.classList.remove("form__input--error");
        const errorMessage = this.parentElement.querySelector(".form__error");
        if (errorMessage) {
            errorMessage.textContent = "";
        }
    });
});
