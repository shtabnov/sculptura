<?php
/**
 * Шаблон детальной страницы услуги
 *
 * @package Sculptura
 */

get_header();
?>

<main>
    <?php while (have_posts()) : the_post(); ?>
        <?php
        $hero_image = sculptura_get_meta('_service_hero_image');
        $intro_text = sculptura_get_meta('_service_intro');
        ?>
        <section class="service-detail">
            <div class="service-detail__container">
                <h1 class="service-detail__title"><?php echo esc_html(get_the_title()); ?></h1>
                <div class="service-detail__content">
                    <div class="service-detail__text">
                        <?php if ($intro_text) : ?>
                            <p class="service-detail__description">
                                <?php echo nl2br(esc_html($intro_text)); ?>
                            </p>
                        <?php endif; ?>

                        <div class="service-detail__info">
                            <?php 
                            // Добавляем SEO-контент для массажа лица
                            if (stripos($service_title, 'массаж лица') !== false && !get_the_content()) {
                                echo '<p>Профессиональный массаж лица в Перми в студии красоты Sculptura. Опытные мастера, натуральная косметика премиум-класса, индивидуальный подход к каждому клиенту.</p>';
                                echo '<p>Массаж лица в Перми — это эффективная процедура для омоложения и улучшения тонуса кожи. Мы находимся в Кондратово, Пермский край, и работаем ежедневно с 9:00 до 21:00.</p>';
                            }
                            the_content(); 
                            ?>
                        </div>

                        <div class="service-detail__action">
                            <a class="service-detail__btn" href="<?php echo esc_url(home_url('/#reception')); ?>">Записаться на прием</a>
                        </div>
                    </div>

                    <div class="service-detail__image">
                        <?php if ($hero_image) : ?>
                            <img src="<?php echo esc_url($hero_image); ?>" alt="<?php echo esc_attr(get_the_title()); ?>">
                        <?php elseif (has_post_thumbnail()) : ?>
                            <?php the_post_thumbnail('large', ['alt' => get_the_title()]); ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </section>
    <?php endwhile; ?>
</main>

<?php
get_footer();

