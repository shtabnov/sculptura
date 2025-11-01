<?php
/**
 * Шаблон обычных страниц
 *
 * @package Sculptura
 */

get_header();
?>

<main>
    <?php while (have_posts()) : the_post(); ?>
        <article class="page-content">
            <div class="page-content__container">
                <h1><?php the_title(); ?></h1>
                <?php the_content(); ?>
            </div>
        </article>
    <?php endwhile; ?>
</main>

<?php
get_footer();

