ymaps.ready(init);

let center = [];
let width = document.documentElement.clientWidth;
if (width < 769) {
    center = [57.97826988901288, 56.103487233862566];
} else {
    center = [57.97827456461129, 56.104658134476004]
}

function init(){
    var map = new ymaps.Map("map", {
        center: center,
        zoom: 18
    });

    var placemark = new ymaps.Placemark([57.97826988901288, 56.103487233862566], {
        balloonContentHeader: 'Sculptura',
        balloonContentBody: 'д. Кондратово ул. Карла Маркса, 8А',
        balloonContentFooter: '8 963-881-62-67',
        hintContent: 'Забота о себе'
    },
    {
        iconLayout: 'default#image',
        iconImageHref: '../images/icon/location.svg',
        iconImageSize: [100, 100],
        iconImageOffset: [-40, -100]
    });

    map.geoObjects.add(placemark);


    map.controls.remove('geolocationControl'); // удаляем геолокацию
    map.controls.remove('searchControl'); // удаляем поиск
    map.controls.remove('trafficControl'); // удаляем контроль трафика
    map.controls.remove('typeSelector'); // удаляем тип
    map.controls.remove('fullscreenControl'); // удаляем кнопку перехода в полноэкранный режим
    // map.controls.remove('zoomControl'); // удаляем контрол зуммирования
    map.controls.remove('rulerControl'); // удаляем контрол правил
    map.behaviors.disable(['scrollZoom']); // отключаем скролл карты (опционально)
}