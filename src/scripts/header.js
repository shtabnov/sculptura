const menuBtn = document.getElementById('menu__toggle');
const navList = document.querySelector('.nav__list');
const navItems = document.querySelectorAll('.nav__item');

const header = document.querySelector('.header');

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

// фиксируем хедер при прокрутке
window.addEventListener('scroll', () => {
    console.log(window.scrollY);
    if (window.scrollY > 200) {
        header.classList.add('header_fixed');
    } else {
        header.classList.remove('header_fixed');
    }
});
