<?php
/**
 * Fallback шаблон (базовый вывод постов)
 * Используется, если не найден более специфичный шаблон
 *
 * @package Sculptura
 */

get_header();
?>

<main>
    <?php if (have_posts()) : ?>
        <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 2rem 20px;">
            <?php while (have_posts()) : the_post(); ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class(); ?> style="margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid #eee;">
                    <?php if (has_post_thumbnail()) : ?>
                        <div style="margin-bottom: 1.5rem;">
                            <a href="<?php the_permalink(); ?>">
                                <?php the_post_thumbnail('large', ['style' => 'width: 100%; height: auto;']); ?>
                            </a>
                        </div>
                    <?php endif; ?>
                    
                    <header style="margin-bottom: 1rem;">
                        <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">
                            <a href="<?php the_permalink(); ?>" style="color: #131332; text-decoration: none;">
                                <?php the_title(); ?>
                            </a>
                        </h2>
                        <div style="color: #666; font-size: 0.9rem;">
                            <time datetime="<?php echo get_the_date('c'); ?>"><?php echo get_the_date(); ?></time>
                        </div>
                    </header>
                    
                    <div>
                        <?php if (has_excerpt()) : ?>
                            <?php the_excerpt(); ?>
                        <?php else : ?>
                            <?php the_content('Читать далее &raquo;'); ?>
                        <?php endif; ?>
                    </div>
                    
                    <?php if (get_post_type() !== 'page') : ?>
                        <footer style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
                            <a href="<?php the_permalink(); ?>">Читать далее &raquo;</a>
                        </footer>
                    <?php endif; ?>
                </article>
            <?php endwhile; ?>
            
            <div style="margin-top: 3rem;">
                <?php
                the_posts_pagination([
                    'prev_text' => '&laquo; Предыдущие',
                    'next_text' => 'Следующие &raquo;',
                ]);
                ?>
            </div>
        </div>
    <?php else : ?>
        <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 2rem 20px; text-align: center;">
            <h1 style="font-size: 2rem; margin-bottom: 1rem;">Ничего не найдено</h1>
            <p style="font-size: 1.1rem; color: #666;">
                К сожалению, по вашему запросу ничего не найдено. 
                <a href="<?php echo esc_url(home_url('/')); ?>" style="color: #131332;">Вернуться на главную</a>
            </p>
        </div>
    <?php endif; ?>
</main>

<?php
get_footer();
