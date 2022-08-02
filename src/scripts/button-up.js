const offset = 100;
const scrollUp = document.querySelector('.scroll-up');
const scrollUpPath = document.querySelector('.scroll-up__path');
const pathLength = scrollUpPath.getTotalLength();

scrollUpPath.style.strokeDasharray = `${pathLength} ${pathLength}`;
scrollUpPath.style.transition = 'stroke-dashoffset 20ms';

const getTop = () => window.pageYOffset || document.documentElement.scrollTop;

// updateDashoffset
const updateDashoffset = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const dashoffset = pathLength - (getTop() * pathLength / height)
    scrollUpPath.style.strokeDashoffset = dashoffset;
};

//onScroll 
window.addEventListener('scroll', () => {
    updateDashoffset();

    if (getTop() > offset) {
        scrollUp.classList.add('scroll-up_active');
    } else {
        scrollUp.classList.remove('scroll-up_active');
    }
})

//click
scrollUp.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
})