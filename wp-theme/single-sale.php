<?php
/**
 * Шаблон детальной страницы акции
 *
 * @package Sculptura
 */

get_header();
?>

<main>
    <?php while (have_posts()) : the_post(); ?>
        <article class="sale-detail">
            <div class="sale-detail__container">
                <h1><?php the_title(); ?></h1>
                <?php if (has_post_thumbnail()) : ?>
                    <div class="sale-detail__image">
                        <?php the_post_thumbnail('large', ['alt' => get_the_title()]); ?>
                    </div>
                <?php endif; ?>
                <div class="sale-detail__content">
                    <?php the_content(); ?>
                </div>
            </div>
        </article>
    <?php endwhile; ?>
</main>

<?php
get_footer();

