/**
 * Плавная прокрутка к элементу с учетом высоты хедера
 * @param {string} elementId - ID целевого элемента
 * @param {boolean} smooth - Использовать плавную прокрутку
 * @returns {boolean} - Успешность операции
 */
function scrollToElement(elementId, smooth = true) {
    const targetElement = document.getElementById(elementId);
    if (!targetElement) return false;

    const header = document.querySelector(".header");
    const headerHeight = header?.offsetHeight || 0;
    const OFFSET = 10; // Отступ от хедера

    // Вычисляем позицию элемента относительно документа
    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const elementTop = rect.top + scrollTop;
    const offsetPosition = Math.max(0, elementTop - headerHeight - OFFSET);

    window.scrollTo({
        top: offsetPosition,
        behavior: smooth ? "smooth" : "auto",
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

    const hashIndex = href.indexOf("#");
    const blockID = href.substring(hashIndex + 1);

    // Проверяем, ведет ли ссылка на другую страницу
    try {
        const url = new URL(href, window.location.origin);
        const currentPath = window.location.pathname;
        const targetPath = url.pathname;

        // Если это другая страница, не обрабатываем якорь
        if (targetPath && targetPath !== currentPath && targetPath !== "/") {
            return null;
        }
    } catch (err) {
        // Если не удалось распарсить URL, продолжаем обработку
    }

    return blockID;
}

document.addEventListener("DOMContentLoaded", () => {
    // Обрабатываем якорные ссылки при клике
    const anchors = document.querySelectorAll('a[href*="#"]');

    anchors.forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            const href = anchor.getAttribute("href");
            const blockID = extractAnchorId(href);

            if (blockID && document.getElementById(blockID)) {
                e.preventDefault();
                scrollToElement(blockID, true);
            }
        });
    });

    // Обрабатываем якорь при загрузке страницы
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        setTimeout(() => scrollToElement(hash, false), 100);
    }
});
