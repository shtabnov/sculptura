document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menu__toggle");
    const navList = document.querySelector(".nav__list");
    const navLinks = document.querySelectorAll(
        ".nav__item a.nav__link, .nav__item a.nav__logo"
    );

    // Синхронизируем состояние чекбокса с классом меню
    if (menuBtn && navList) {
        menuBtn.addEventListener("change", () => {
            if (menuBtn.checked) {
                navList.classList.add("nav__list_active");
            } else {
                navList.classList.remove("nav__list_active");
            }
        });
    }

    // Закрываем меню при клике на ссылку
    if (navLinks && navLinks.length > 0) {
        navLinks.forEach((navLink) => {
            if (navLink && navLink.addEventListener) {
                navLink.addEventListener("click", () => {
                    // Закрываем меню
                    if (navList && navList.classList) {
                        navList.classList.remove("nav__list_active");
                    }
                    // Сбрасываем чекбокс (чтобы бургер вернулся в исходное состояние)
                    if (menuBtn) {
                        menuBtn.checked = false;
                    }
                });
            }
        });
    }
});
