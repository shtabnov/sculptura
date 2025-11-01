document.addEventListener("DOMContentLoaded", () => {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
        return;
    }

    // Проверка наличия ymaps и что он инициализирован (без ошибок API ключа)
    if (typeof ymaps === "undefined" || !ymaps || !ymaps.ready) {
        console.warn(
            "Yandex Maps API не загружен. Карта не будет отображаться."
        );
        return;
    }

    ymaps.ready(init);

    let center = [];
    let width = document.documentElement.clientWidth;
    if (width < 769) {
        center = [57.97533526685659, 56.10150267024038];
    } else {
        center = [57.97533526685659, 56.10338558096882];
    }

    function init() {
        if (!document.getElementById("map")) {
            return;
        }

        var map = new ymaps.Map("map", {
            center: center,
            zoom: 18,
        });

        var placemark = new ymaps.Placemark(
            [57.97533526685659, 56.10150267024038],
            {
                balloonContentHeader: "Sculptura",
                balloonContentBody: "д. Кондратово ул. Карла Маркса, 8А",
                balloonContentFooter: "8 963-881-62-67",
                hintContent: "Забота о себе",
            },
            {
                iconLayout: "default#image",
                iconImageHref:
                    (window.SCL_THEME_URI || "") +
                    "/assets/images/icon/location.svg",
                iconImageSize: [100, 100],
                iconImageOffset: [-40, -100],
            }
        );

        map.geoObjects.add(placemark);

        map.controls.remove("geolocationControl"); // удаляем геолокацию
        map.controls.remove("searchControl"); // удаляем поиск
        map.controls.remove("trafficControl"); // удаляем контроль трафика
        map.controls.remove("typeSelector"); // удаляем тип
        map.controls.remove("fullscreenControl"); // удаляем кнопку перехода в полноэкранный режим
        // map.controls.remove('zoomControl'); // удаляем контрол зуммирования
        map.controls.remove("rulerControl"); // удаляем контрол правил
        map.behaviors.disable(["scrollZoom"]); // отключаем скролл карты (опционально)
    }
});
