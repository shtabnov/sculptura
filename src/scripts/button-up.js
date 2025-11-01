document.addEventListener("DOMContentLoaded", () => {
    const offset = 100;
    const scrollUp = document.querySelector(".scroll-up");
    const scrollUpPath = document.querySelector(".scroll-up__path");

    if (
        !scrollUp ||
        !scrollUpPath ||
        typeof scrollUpPath.getTotalLength !== "function"
    ) {
        return;
    }

    const pathLength = scrollUpPath.getTotalLength();
    scrollUpPath.style.strokeDasharray = `${pathLength} ${pathLength}`;
    scrollUpPath.style.transition = "stroke-dashoffset 20ms";

    const getTop = () =>
        window.pageYOffset || document.documentElement.scrollTop;

    // updateDashoffset
    const updateDashoffset = (scrollUpPathElement) => {
        if (!scrollUpPathElement || !scrollUpPathElement.style) {
            return;
        }
        const height =
            document.documentElement.scrollHeight - window.innerHeight;
        const dashoffset = pathLength - (getTop() * pathLength) / height;
        scrollUpPathElement.style.strokeDashoffset = dashoffset;
    };

    // onScroll
    window.addEventListener("scroll", () => {
        // Проверяем существование элементов при каждом вызове
        const currentScrollUp = document.querySelector(".scroll-up");
        const currentScrollUpPath = document.querySelector(".scroll-up__path");

        if (
            !currentScrollUp ||
            !currentScrollUp.classList ||
            !currentScrollUpPath
        ) {
            return;
        }

        updateDashoffset(currentScrollUpPath);

        if (getTop() > offset) {
            currentScrollUp.classList.add("scroll-up_active");
        } else {
            currentScrollUp.classList.remove("scroll-up_active");
        }
    });

    // click
    scrollUp.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    });

    // начальная отрисовка
    updateDashoffset(scrollUpPath);
});
