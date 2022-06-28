const menuBtn = document.getElementById('menu__toggle');
const navList = document.querySelector('.nav__list');

menuBtn.addEventListener('click', () => {
    navList.classList.toggle('nav__list_active');
    console.log(navList);
})