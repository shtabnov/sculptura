"use strict";

/**
 * Валидация и маска ввода для номера телефона
 * Формат: +7 (9**) ***-**-**
 */

document.addEventListener("DOMContentLoaded", () => {
    const phoneInput = document.getElementById("phone");

    if (!phoneInput) {
        return;
    }

    // Регулярное выражение для валидации формата +7 (9**) ***-**-**
    const phoneRegex = /^\+7\s?\(9\d{2}\)\s?\d{3}-\d{2}-\d{2}$/;

    /**
     * Извлекает только цифры пользователя (без 7 из +7)
     * @param {string} value - Значение поля
     * @returns {string} - Только цифры пользователя (максимум 10)
     */
    function extractUserDigits(value) {
        // Извлекаем все цифры
        let digits = value.replace(/\D/g, "");

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

        let formatted = "+7 (";

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
        const cleanPhone = phone.replace(/\s/g, "");

        // Проверяем формат и что после +7( идет 9
        if (!phoneRegex.test(cleanPhone)) {
            return false;
        }

        // Дополнительная проверка: после +7( должна быть цифра 9
        const match = cleanPhone.match(/^\+7\((\d)/);
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

    /**
     * Вычисляет позицию курсора после форматирования
     * @param {string} oldValue - Старое значение
     * @param {number} oldCursorPos - Старая позиция курсора
     * @param {string} newValue - Новое значение
     * @param {number} userDigitsCount - Количество цифр пользователя
     * @returns {number} - Новая позиция курсора
     */
    function calculateNewCursorPosition(
        oldValue,
        oldCursorPos,
        newValue,
        userDigitsCount
    ) {
        // Подсчитываем количество цифр до позиции курсора в старом значении
        const beforeCursor = oldValue.substring(0, oldCursorPos);
        let digitsBefore = beforeCursor.replace(/\D/g, "").length;

        // Если в старом значении была 7 из +7, не считаем её
        if (oldValue.startsWith("+7") && digitsBefore > 0) {
            const oldDigits = oldValue.replace(/\D/g, "");
            if (oldDigits.startsWith("7") && oldDigits.length > 1) {
                digitsBefore = Math.max(0, digitsBefore - 1);
            }
        }

        // Находим позицию в новом значении
        let digitCount = 0;
        let newCursorPosition = newValue.length;

        for (let i = 0; i < newValue.length; i++) {
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
    phoneInput.addEventListener("input", (e) => {
        const oldValue = e.target.value;
        const oldCursorPos = e.target.selectionStart;

        // Извлекаем только цифры пользователя (без 7 из +7)
        const userDigits = extractUserDigits(e.target.value);

        // Если цифр нет, очищаем поле
        if (userDigits.length === 0) {
            e.target.value = "";
            return;
        }

        // Форматируем номер
        const newValue = formatPhone(userDigits);
        e.target.value = newValue;

        // Восстанавливаем позицию курсора
        const newCursorPos = calculateNewCursorPosition(
            oldValue,
            oldCursorPos,
            newValue,
            userDigits.length
        );
        e.target.setSelectionRange(newCursorPos, newCursorPos);

        // Проверяем валидность только при полном номере
        if (validatePhone(newValue)) {
            removeError();
        }
    });

    // Обработчик вставки (Ctrl+V, Cmd+V)
    phoneInput.addEventListener("paste", (e) => {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData(
            "text"
        );
        const userDigits = extractUserDigits(pastedText);
        const formatted = formatPhone(userDigits);
        phoneInput.value = formatted;
        phoneInput.setSelectionRange(formatted.length, formatted.length);

        if (validatePhone(formatted)) {
            removeError();
        } else {
            showError();
        }
    });

    // Обработчик потери фокуса - валидация
    phoneInput.addEventListener("blur", () => {
        const value = phoneInput.value.trim();

        if (value && !validatePhone(value)) {
            showError();
        } else {
            removeError();
        }
    });

    // Обработчик отправки формы - валидация перед отправкой
    const form = phoneInput.closest("form");
    if (form) {
        form.addEventListener("submit", (e) => {
            const value = phoneInput.value.trim();

            if (!value || !validatePhone(value)) {
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

    // Обработчик клавиш - разрешаем только цифры и управляющие клавиши
    phoneInput.addEventListener("keydown", (e) => {
        const allowedKeys = [
            "Backspace",
            "Delete",
            "Tab",
            "Escape",
            "Enter",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Home",
            "End",
        ];

        // Разрешаем Ctrl/Cmd + A, C, V, X
        if (
            (e.ctrlKey || e.metaKey) &&
            ["a", "c", "v", "x"].includes(e.key.toLowerCase())
        ) {
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
