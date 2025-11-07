// Функция для плавной прокрутки к элементу с учетом хедера
function scrollToElement(elementId, smooth = true) {
    const targetElement = document.getElementById(elementId);

    if (!targetElement) {
        return false;
    }

    // Получаем высоту хедера для учета при прокрутке
    const header = document.querySelector(".header");
    const headerHeight = header ? header.offsetHeight : 0;

    // Вычисляем позицию элемента относительно документа
    // Используем getBoundingClientRect для более точного расчета
    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const elementTop = rect.top + scrollTop;

    // Вычитаем высоту хедера и добавляем небольшой отступ (10px) для комфорта
    const offsetPosition = elementTop - headerHeight - 10;

    // Прокручиваем с учетом высоты хедера
    window.scrollTo({
        top: Math.max(0, offsetPosition), // Убеждаемся, что позиция не отрицательная
        behavior: smooth ? "smooth" : "auto",
    });

    return true;
}

document.addEventListener("DOMContentLoaded", () => {
    // Обрабатываем якорные ссылки при клике
    const anchors = document.querySelectorAll('a[href*="#"]');

    if (anchors && anchors.length > 0) {
        for (let anchor of anchors) {
            anchor.addEventListener("click", function (e) {
                const href = anchor.getAttribute("href");

                if (!href) {
                    return;
                }

                // Извлекаем якорь из ссылки (может быть #reception или /#reception или полный URL)
                let blockID = null;

                // Если ссылка начинается с #, это локальный якорь
                if (href.startsWith("#")) {
                    blockID = href.substring(1);
                }
                // Если ссылка содержит #, извлекаем якорь
                else if (href.includes("#")) {
                    const hashIndex = href.indexOf("#");
                    blockID = href.substring(hashIndex + 1);

                    // Проверяем, ведет ли ссылка на другую страницу
                    try {
                        const url = new URL(href, window.location.origin);
                        const currentPath = window.location.pathname;
                        const targetPath = url.pathname;

                        // Если это другая страница, позволяем браузеру обработать переход
                        if (
                            targetPath !== currentPath &&
                            targetPath !== "/" &&
                            targetPath !== ""
                        ) {
                            return; // Позволяем браузеру обработать переход
                        }
                    } catch (err) {
                        // Если не удалось распарсить URL, продолжаем обработку
                    }
                } else {
                    return; // Нет якоря в ссылке
                }

                // Проверяем, что элемент существует на текущей странице
                const targetElement = document.getElementById(blockID);

                if (targetElement) {
                    e.preventDefault();
                    scrollToElement(blockID, true);
                }
                // Если элемента нет, позволяем браузеру обработать ссылку (переход на другую страницу)
            });
        }
    }

    // Обрабатываем якорь при загрузке страницы (если в URL есть #)
    if (window.location.hash) {
        const hash = window.location.hash.substring(1); // Убираем #

        // Небольшая задержка, чтобы убедиться, что страница полностью загружена
        setTimeout(() => {
            scrollToElement(hash, false); // Без плавной прокрутки при загрузке
        }, 100);
    }
});
