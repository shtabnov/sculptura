<?php
/**
 * Шаблон страницы прайс-листа
 *
 * @package Sculptura
 */

get_header();
?>

<main>
    <section class="price" id="price">
        <div class="price__container">
            <div class="price__header">
                <h1 class="price__title">ПРАЙС</h1>
            </div>

            <div class="price__content">
                <!-- Основные услуги -->
                <div class="price__section">
                    <ul class="price__list">
                        <li class="price__item">
                            <div class="price__item-content">
                                <div class="price__item-info">
                                    <h3 class="price__item-title">Ручной лифтинг лица</h3>
                                    <p class="price__item-description">Очищение, проработка ШВЗ, декольте, головы, лица, завершающий крем</p>
                                </div>
                                <div class="price__item-price">2000 ₽</div>
                            </div>
                        </li>

                        <li class="price__item">
                            <div class="price__item-content">
                                <div class="price__item-info">
                                    <h3 class="price__item-title">Буккальный массаж</h3>
                                    <p class="price__item-description">Дополнительная проработка нижней трети лица через ротовую полость</p>
                                </div>
                                <div class="price__item-price">2500 ₽</div>
                            </div>
                        </li>

                        <li class="price__item">
                            <div class="price__item-content">
                                <div class="price__item-info">
                                    <h3 class="price__item-title">RF лифтинг + уход по проблеме</h3>
                                    <p class="price__item-description">лицо, шея, декольте</p>
                                </div>
                                <div class="price__item-price">2000 ₽</div>
                            </div>
                        </li>

                        <li class="price__item">
                            <div class="price__item-content">
                                <div class="price__item-info">
                                    <h3 class="price__item-title">Ультразвуковая чистка</h3>
                                    <p class="price__item-description">щадящий способ глубокого очищения кожи, с помощью высокочастотных звуковых волн, без механического повреждения кожи</p>
                                </div>
                                <div class="price__item-price">1700 ₽</div>
                            </div>
                        </li>

                        <li class="price__item">
                            <div class="price__item-content">
                                <div class="price__item-info">
                                    <h3 class="price__item-title">Гидропилинг</h3>
                                    <p class="price__item-description">аппаратно-вакуумная чистка</p>
                                </div>
                                <div class="price__item-price">1500 ₽</div>
                            </div>
                        </li>

                        <li class="price__item">
                            <div class="price__item-content">
                                <div class="price__item-info">
                                    <h3 class="price__item-title">Пилинг уход</h3>
                                    <p class="price__item-description">Придает коже сияние и гладкость, борется с повышенной сальностью и несовершенствами кожи, слегка отбеливает, выравнивает рельеф и цвет</p>
                                </div>
                                <div class="price__item-price">2000 ₽</div>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Комплексы для лица -->
                <div class="price__section price__section_complex">
                    <h2 class="price__section-title">Комплекс для лица:</h2>
                    <ul class="price__list">
                        <li class="price__item">
                            <div class="price__item-content">
                                <div class="price__item-info">
                                    <h3 class="price__item-title">Ручной лифтинг + пилинг уход</h3>
                                </div>
                                <div class="price__item-price">3000 ₽</div>
                            </div>
                        </li>

                        <li class="price__item">
                            <div class="price__item-content">
                                <div class="price__item-info">
                                    <h3 class="price__item-title">Гидропилинг + УЗчистка</h3>
                                </div>
                                <div class="price__item-price">2500 ₽</div>
                            </div>
                        </li>

                        <li class="price__item">
                            <div class="price__item-content">
                                <div class="price__item-info">
                                    <h3 class="price__item-title">Ручной лифтинг + RF лифтинг</h3>
                                </div>
                                <div class="price__item-price">3000 ₽</div>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Дополнительно -->
                <div class="price__section price__section_additional">
                    <h2 class="price__section-title">Дополнительно:</h2>
                    <ul class="price__list">
                        <li class="price__item">
                            <div class="price__item-content">
                                <div class="price__item-info">
                                    <h3 class="price__item-title">Альгинатная маска</h3>
                                </div>
                                <div class="price__item-price">500 ₽</div>
                            </div>
                        </li>

                        <li class="price__item">
                            <div class="price__item-content">
                                <div class="price__item-info">
                                    <h3 class="price__item-title">Тейпирование лица</h3>
                                </div>
                                <div class="price__item-price">300 ₽</div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </section>
</main>

<?php
get_footer();

