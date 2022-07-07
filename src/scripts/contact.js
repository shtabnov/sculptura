ymaps.ready(init);

function init(){
    var map = new ymaps.Map("map", {
        center: [57.97771683602552, 56.10550914007951],
        zoom: 17

    });

    var placemark = new ymaps.Placemark([57.97826988901288, 56.103487233862566], {
        balloonContentHeader: 'Sculptura',
        balloonContentBody: 'д. Кондратово ул. Карла Маркса, 8А',
        balloonContentFooter: '8 963-881-62-67',
        hintContent: 'Зимние происшествия'
    });

    map.geoObjects.add(placemark);
    placemark.balloon.open();


    map.controls.remove('geolocationControl'); // удаляем геолокацию
    map.controls.remove('searchControl'); // удаляем поиск
    map.controls.remove('trafficControl'); // удаляем контроль трафика
    map.controls.remove('typeSelector'); // удаляем тип
    map.controls.remove('fullscreenControl'); // удаляем кнопку перехода в полноэкранный режим
    map.controls.remove('zoomControl'); // удаляем контрол зуммирования
    map.controls.remove('rulerControl'); // удаляем контрол правил
    map.behaviors.disable(['scrollZoom']); // отключаем скролл карты (опционально)
}