const menuBtn = document.getElementById('menu__toggle');
const navList = document.querySelector('.nav__list');
const navItems = document.querySelectorAll('.nav__item');

// Отображаем меню при нажитии на бургер
menuBtn.addEventListener('click', () => {
    navList.classList.toggle('nav__list_active');
});
// Скрываем меню при нажатии на ссылку
navItems.forEach((navItem) =>
    navItem.addEventListener('click', () => {
        navList.classList.toggle('nav__list_active');
    })
);
