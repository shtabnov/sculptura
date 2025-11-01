document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menu__toggle");
    const navList = document.querySelector(".nav__list");
    const navItems = document.querySelectorAll(".nav__item");

    // Отображаем меню при нажитии на бургер
    if (menuBtn && navList && navList.classList) {
        menuBtn.addEventListener("click", () => {
            if (navList && navList.classList) {
                navList.classList.toggle("nav__list_active");
            }
        });
    }

    // Скрываем меню при нажатии на ссылку
    if (navItems && navItems.length > 0) {
        navItems.forEach((navItem) => {
            if (navItem && navItem.addEventListener) {
                navItem.addEventListener("click", () => {
                    if (navList && navList.classList) {
                        navList.classList.toggle("nav__list_active");
                    }
                });
            }
        });
    }
});
