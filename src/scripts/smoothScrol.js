const anchors = document.querySelectorAll('a[href*="#"]');

if (anchors) {
    for (let anchor of anchors) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const blockID = anchor.getAttribute('href').substring(2);

            console.log(blockID);

            document.getElementById(blockID).scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        });
    }
}
