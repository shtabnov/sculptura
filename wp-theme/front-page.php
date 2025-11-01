<?php
/**
 * Главная страница (шаблон)
 *
 * @package Sculptura
 */

get_header();

$homepage_id = get_option('page_on_front');
?>

<main>
    <?php
    // Hero секция
    $hero_title = sculptura_get_meta('_hero_title', $homepage_id);
    $hero_subtitle = sculptura_get_meta('_hero_subtitle', $homepage_id);
    $hero_images = [];
    for ($i = 1; $i <= 3; $i++) {
        $img = sculptura_get_meta('_hero_image_' . $i, $homepage_id);
        if ($img) {
            $hero_images[] = $img;
        }
    }
    ?>
    <section class="hero">
        <div class="hero__slider">
            <?php if (!empty($hero_images)) : ?>
                <?php foreach ($hero_images as $index => $image_url) : ?>
                    <div class="hero__image<?php echo $index === 0 ? ' hero__image_active' : ''; ?>">
                        <img src="<?php echo esc_url($image_url); ?>" alt="Hero image <?php echo $index + 1; ?>">
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
            <div class="hero__container">
                <?php if ($hero_title) : ?>
                    <div class="hero__title">
                        <h1><?php echo esc_html($hero_title); ?></h1>
                    </div>
                <?php endif; ?>
                <?php if ($hero_subtitle) : ?>
                    <div class="hero__description">
                        <p><?php echo nl2br(esc_html($hero_subtitle)); ?></p>
                    </div>
                <?php endif; ?>
                <div class="hero__lnk-wrap">
                    <a class="hero__link" href="#reception">Записаться на прием</a>
                </div>
            </div>
            <div class="hero__btn-wrap">
                <div class="hero__btn">
                    <a href="#features">
                        <svg class="t-cover__arrow-svg" style="fill:#ffffff;" x="0px" y="0px" width="40px" height="20px" viewBox="0 0 38.417 18.592">
                            <g><path d="M19.208,18.592c-0.241,0-0.483-0.087-0.673-0.261L0.327,1.74c-0.408-0.372-0.438-1.004-0.066-1.413c0.372-0.409,1.004-0.439,1.413-0.066L19.208,16.24L36.743,0.261c0.411-0.372,1.042-0.342,1.413,0.066c0.372,0.408,0.343,1.041-0.065,1.413L19.881,18.332C19.691,18.505,19.449,18.592,19.208,18.592z"></path></g>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <?php
    // Features секция
    $features_query = new WP_Query([
        'post_type' => 'feature',
        'posts_per_page' => -1,
        'orderby' => 'menu_order',
        'order' => 'ASC',
    ]);
    ?>
    <section class="features" id="features">
        <div class="features__container">
            <h2>Наши преимущества</h2>
            <?php if ($features_query->have_posts()) : ?>
                <div class="features__wrapper">
                    <?php while ($features_query->have_posts()) : $features_query->the_post(); ?>
                        <div class="features__card">
                            <?php if (has_post_thumbnail()) : ?>
                                <div class="features__card-img">
                                    <?php the_post_thumbnail('medium', ['alt' => get_the_title()]); ?>
                                </div>
                            <?php endif; ?>
                            <div class="features__card-txt">
                                <p><?php the_title(); ?></p>
                                <?php if (has_excerpt()) : ?>
                                    <p><?php echo esc_html(get_the_excerpt()); ?></p>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endwhile; ?>
                </div>
                <?php wp_reset_postdata(); ?>
            <?php endif; ?>
        </div>
    </section>

    <?php
    // Services секция
    $services = new WP_Query([
        'post_type' => 'service',
        'posts_per_page' => -1,
        'orderby' => 'menu_order',
        'order' => 'ASC',
    ]);
    ?>
    <section class="service" id="service">
        <div class="service__container">
            <h2 class="service__title">Наши услуги</h2>
            <?php if ($services->have_posts()) : ?>
                <div class="service__wrapper">
                    <?php while ($services->have_posts()) : $services->the_post(); ?>
                        <div class="service__card">
                            <?php if (has_post_thumbnail()) : ?>
                                <div class="service__card-image">
                                    <?php the_post_thumbnail('medium', ['alt' => get_the_title()]); ?>
                                </div>
                            <?php endif; ?>
                            <div class="service__card-content">
                                <h3 class="service__card-title"><?php the_title(); ?></h3>
                                <?php if (has_excerpt()) : ?>
                                    <p class="service__card-description"><?php echo esc_html(get_the_excerpt()); ?></p>
                                <?php endif; ?>
                                <a class="service__card-btn" href="<?php the_permalink(); ?>">Подробнее</a>
                            </div>
                        </div>
                    <?php endwhile; ?>
                </div>
                <?php wp_reset_postdata(); ?>
            <?php endif; ?>
        </div>
    </section>

    <?php
    // Sales секция
    $sales = new WP_Query([
        'post_type' => 'sale',
        'posts_per_page' => -1,
        'orderby' => 'date',
        'order' => 'DESC',
    ]);
    ?>
    <section class="sale" id="sale">
        <div class="sale__container">
            <h2>Акции</h2>
            <?php if ($sales->have_posts()) : ?>
                <div class="sale__wrapper">
                    <div class="sale__slader splide" id="sale_slider">
                        <div class="splide__track">
                            <ul class="splide__list">
                                <?php while ($sales->have_posts()) : $sales->the_post(); ?>
                                    <li class="splide__slide">
                                        <div class="sale__item">
                                            <?php if (has_post_thumbnail()) : ?>
                                                <?php the_post_thumbnail('large', ['alt' => get_the_title()]); ?>
                                            <?php endif; ?>
                                        </div>
                                    </li>
                                <?php endwhile; ?>
                            </ul>
                        </div>
                        <div class="splide__arrows">
                            <button class="splide__arrow splide__arrow--prev"></button>
                            <ul class="splide__pagination splide__pagination--ltr"></ul>
                            <button class="splide__arrow splide__arrow--next"></button>
                        </div>
                    </div>
                </div>
                <?php wp_reset_postdata(); ?>
            <?php endif; ?>
        </div>
    </section>

    <?php
    // Reviews секция
    $reviews_query = new WP_Query([
        'post_type' => 'review',
        'posts_per_page' => -1,
        'orderby' => 'date',
        'order' => 'DESC',
    ]);
    ?>
    <section class="reviews" id="reviews">
        <div class="reviews__container">
            <h2>Отзывы</h2>
            <?php if ($reviews_query->have_posts()) : ?>
                <div class="reviews__slider splide" id="reviews_slider">
                    <div class="splide__arrows">
                        <button class="splide__arrow splide__arrow--prev"></button>
                        <button class="splide__arrow splide__arrow--next"></button>
                    </div>
                    <div class="splide__track">
                        <ul class="splide__list">
                            <?php while ($reviews_query->have_posts()) : $reviews_query->the_post(); ?>
                                <li class="splide__slide">
                                    <div class="reviews__card">
                                        <?php if (has_post_thumbnail()) : ?>
                                            <div class="reviews__img">
                                                <?php the_post_thumbnail('medium', ['alt' => get_the_title()]); ?>
                                            </div>
                                        <?php endif; ?>
                                        <div class="reviews__txt">
                                            <h3><?php the_title(); ?></h3>
                                            <p><?php echo nl2br(esc_html(get_the_content())); ?></p>
                                            <?php 
                                            $review_date = sculptura_get_meta('_review_date');
                                            if ($review_date) : 
                                            ?>
                                                <p class="date"><?php echo esc_html(date_i18n('d.m.Y', strtotime($review_date))); ?></p>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </li>
                            <?php endwhile; ?>
                        </ul>
                    </div>
                </div>
                <?php wp_reset_postdata(); ?>
            <?php endif; ?>
        </div>
    </section>

    <section class="contact" id="contact">
        <div class="contact__container">
            <h2>Контакты</h2>
            <div class="contact__wrap">
                <div class="contact__map" id="map"></div>
                <div class="contact__card card">
                    <h3>Контакты</h3>
                    <div class="card__address">
                        <address>д. Кондратово</address>
                        <address>ул. Садовое кольцо 14</address>
                        <em>вход с торца здания</em>
                    </div>
                    <div class="card__schedule">
                        <p>с 9:00 до 21:00</p>
                        <p>последняя запись до 19:00</p>
                    </div>
                    <div class="card__phone">
                        <a href="tel:+79638816267">+7 (963) 881‑62‑67</a>
                    </div>
                    <div class="card__social">
                        <a href="https://vk.com/buccal59" target="_blank" rel="noopener noreferrer">Наша группа в контакте</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<?php
get_footer();
