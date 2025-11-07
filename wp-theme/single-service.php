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
                <h2 class="service-detail__title"><?php the_title(); ?></h2>
                <div class="service-detail__content">
                    <div class="service-detail__text">
                        <?php if ($intro_text) : ?>
                            <p class="service-detail__description">
                                <?php echo nl2br(esc_html($intro_text)); ?>
                            </p>
                        <?php endif; ?>

                        <div class="service-detail__info">
                            <?php the_content(); ?>
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

