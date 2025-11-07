document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menu__toggle");
    const navList = document.querySelector(".nav__list");
    const navLinks = document.querySelectorAll(
        ".nav__item a.nav__link, .nav__item a.nav__logo"
    );
    const mobileLogo = document.querySelector(".nav__logo_mobile");
    const header = document.querySelector(".header");

    // Изменение прозрачности хедера при скролле (только для десктопа)
    if (header && window.innerWidth > 767.99) {
        let lastScrollTop = 0;
        
        window.addEventListener("scroll", () => {
            // Проверяем, что это не мобильная версия
            if (window.innerWidth > 767.99) {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
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
        window.addEventListener("resize", () => {
            if (window.innerWidth <= 767.99) {
                header.classList.remove("header_scrolled");
            }
        });
    }

    // Синхронизируем состояние чекбокса с классом меню
    if (menuBtn && navList) {
        menuBtn.addEventListener("change", () => {
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
        navLinks.forEach((navLink) => {
            if (navLink && navLink.addEventListener) {
                navLink.addEventListener("click", (e) => {
                    const href = navLink.getAttribute("href");
                    
                    // Проверяем, является ли это якорной ссылкой (содержит #)
                    if (href && href.includes("#")) {
                        // Извлекаем якорь из ссылки
                        const anchorMatch = href.match(/#(.+)$/);
                        const anchor = anchorMatch ? anchorMatch[0] : ""; // #service, #price и т.д.
                        
                        if (anchor) {
                            let isHomeLink = false;
                            
                            // Проверяем, ведет ли ссылка на главную страницу
                            if (href.startsWith("/#") || href.startsWith("#")) {
                                // Относительная ссылка типа /#service или #service
                                isHomeLink = true;
                            } else {
                                try {
                                    // Абсолютная ссылка
                                    const url = new URL(href, window.location.origin);
                                    isHomeLink = url.pathname === "/" || 
                                                url.pathname === "" || 
                                                url.pathname === "/index.html";
                                } catch (err) {
                                    // Если не удалось распарсить URL, считаем относительной
                                    isHomeLink = href.startsWith("/") || href.startsWith("#");
                                }
                            }
                            
                            // Проверяем, находимся ли мы на главной странице
                            const currentPath = window.location.pathname;
                            const currentSearch = window.location.search;
                            const isHomePage = (currentPath === "/" || 
                                              currentPath === "/index.html" || 
                                              currentPath === "") && 
                                              (!currentSearch || currentSearch === "");
                            
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
        mobileLogo.addEventListener("click", () => {
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
