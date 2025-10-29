const anchors = document.querySelectorAll('a[href*="#"]');

if (anchors) {
    for (let anchor of anchors) {
        anchor.addEventListener('click', function (e) {
            const href = anchor.getAttribute('href');
            
            // Проверяем, что это якорная ссылка (начинается с #)
            if (!href || !href.startsWith('#')) {
                return;
            }
            
            // Извлекаем ID элемента (убираем #)
            const blockID = href.substring(1);
            
            // Проверяем, что элемент существует на странице
            const targetElement = document.getElementById(blockID);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
            // Если элемента нет, позволяем браузеру обработать ссылку (переход на другую страницу)
        });
    }
}
