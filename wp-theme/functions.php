<?php
/**
 * Functions and definitions
 *
 * @package Sculptura
 */

if (!defined('ABSPATH')) {
    exit;
}

// Константы
define('SCULPTURA_VERSION', '1.0.0');
define('SCULPTURA_THEME_PATH', get_template_directory());
define('SCULPTURA_THEME_URI', get_template_directory_uri());

/**
 * Подключение класса Walker
 */
require_once SCULPTURA_THEME_PATH . '/class-sculptura-walker-nav-menu.php';

/**
 * Подключение стилей и скриптов
 */
function sculptura_enqueue_assets() {
    // CSS
    wp_enqueue_style(
        'splide-core',
        'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.0.7/dist/css/splide-core.min.css',
        [],
        '4.0.7'
    );
    wp_enqueue_style(
        'sculptura-main',
        SCULPTURA_THEME_URI . '/assets/css/style.css',
        ['splide-core'],
        SCULPTURA_VERSION
    );

    // JS
    wp_enqueue_script(
        'splide',
        'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.0.7/dist/js/splide.min.js',
        [],
        '4.0.7',
        true
    );

    // Yandex Maps API (для карты в блоке contact)
    wp_enqueue_script(
        'ymaps',
        'https://api-maps.yandex.ru/2.1/?apikey=808cc89a-2e19-415e-b76d-133597c233bc&lang=ru_RU',
        [],
        null,
        true
    );

    wp_enqueue_script(
        'sculptura-main',
        SCULPTURA_THEME_URI . '/assets/js/main.min.js',
        ['splide', 'jquery', 'ymaps'],
        SCULPTURA_VERSION,
        true
    );

    // Глобальная переменная с URI темы для обращений из JS к ассетам
    wp_add_inline_script(
        'sculptura-main',
        'window.SCL_THEME_URI = ' . json_encode(SCULPTURA_THEME_URI) . ';',
        'before'
    );
}
add_action('wp_enqueue_scripts', 'sculptura_enqueue_assets');

/**
 * Добавление Favicon
 */
function sculptura_add_favicon() {
    $favicon_url = SCULPTURA_THEME_URI . '/assets/images/logo.svg';
    $fallback_favicon = SCULPTURA_THEME_URI . '/assets/images/logo.png';
    
    echo '<link rel="icon" type="image/svg+xml" href="' . esc_url($favicon_url) . '">' . "\n";
    echo '<link rel="alternate icon" href="' . esc_url($fallback_favicon) . '">' . "\n";
    echo '<link rel="apple-touch-icon" href="' . esc_url($fallback_favicon) . '">' . "\n";
}
add_action('wp_head', 'sculptura_add_favicon', 1);

/**
 * Поддержка темой функций WordPress
 */
function sculptura_theme_support() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', [
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ]);
    add_theme_support('custom-logo');
}
add_action('after_setup_theme', 'sculptura_theme_support');

/**
 * Разрешить загрузку SVG файлов
 */
function sculptura_mime_types($mimes) {
    $mimes['svg'] = 'image/svg+xml';
    return $mimes;
}
add_filter('upload_mimes', 'sculptura_mime_types');

/**
 * Исправить отображение SVG в медиа-библиотеке
 */
function sculptura_fix_svg_thumbnail($response, $attachment, $meta) {
    if ($response['type'] === 'image' && $response['subtype'] === 'svg+xml') {
        $response['image'] = [
            'src' => $response['url'],
            'width' => 150,
            'height' => 150
        ];
        $response['thumb'] = [
            'src' => $response['url'],
            'width' => 150,
            'height' => 150
        ];
    }
    return $response;
}
add_filter('wp_prepare_attachment_for_js', 'sculptura_fix_svg_thumbnail', 10, 3);

/**
 * Убрать width="1" height="1" атрибуты у SVG в контенте
 */
function sculptura_remove_svg_size_attributes($html) {
    // Проверяем, что это действительно SVG
    if (empty($html) || (strpos($html, '.svg') === false && strpos($html, 'image/svg+xml') === false)) {
        return $html;
    }
    
    // Удаляем width="1" и height="1" у SVG
    $html = preg_replace('/\s+width=["\']1["\']/i', '', $html);
    $html = preg_replace('/\s+height=["\']1["\']/i', '', $html);
    
    return $html;
}
add_filter('the_content', 'sculptura_remove_svg_size_attributes', 10);
add_filter('post_thumbnail_html', 'sculptura_remove_svg_size_attributes', 10);
add_filter('wp_get_attachment_image', 'sculptura_remove_svg_size_attributes', 10);

/**
 * Убрать width и height из атрибутов изображения для SVG
 */
function sculptura_image_attributes($attr, $attachment, $size) {
    if ($attachment && get_post_mime_type($attachment->ID) === 'image/svg+xml') {
        unset($attr['width']);
        unset($attr['height']);
    }
    return $attr;
}
add_filter('wp_get_attachment_image_attributes', 'sculptura_image_attributes', 10, 3);

/**
 * Регистрация меню
 */
function sculptura_register_menus() {
    register_nav_menus([
        'primary' => 'Основное меню',
    ]);
}
add_action('init', 'sculptura_register_menus');

/**
 * Регистрация Custom Post Types
 */
function sculptura_register_post_types() {
    // Услуги
    register_post_type('service', [
        'labels' => [
            'name' => 'Услуги',
            'singular_name' => 'Услуга',
            'add_new' => 'Добавить услугу',
            'add_new_item' => 'Добавить новую услугу',
            'edit_item' => 'Редактировать услугу',
            'new_item' => 'Новая услуга',
            'view_item' => 'Просмотр услуги',
            'search_items' => 'Искать услуги',
            'not_found' => 'Услуги не найдены',
            'not_found_in_trash' => 'В корзине услуг не найдено',
        ],
        'public' => true,
        'has_archive' => false,
        'menu_icon' => 'dashicons-businessman',
        'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
        'rewrite' => ['slug' => 'services', 'with_front' => false],
        'show_in_rest' => true,
    ]);

    // Акции
    register_post_type('sale', [
        'labels' => [
            'name' => 'Акции',
            'singular_name' => 'Акция',
            'add_new' => 'Добавить акцию',
            'add_new_item' => 'Добавить новую акцию',
            'edit_item' => 'Редактировать акцию',
            'new_item' => 'Новая акция',
            'view_item' => 'Просмотр акции',
            'search_items' => 'Искать акции',
            'not_found' => 'Акции не найдены',
            'not_found_in_trash' => 'В корзине акций не найдено',
        ],
        'public' => true,
        'has_archive' => false,
        'menu_icon' => 'dashicons-tag',
        'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
        'rewrite' => ['slug' => 'sales', 'with_front' => false],
        'show_in_rest' => true,
    ]);
}
add_action('init', 'sculptura_register_post_types');

/**
 * Регистрация Custom Post Types для Features и Reviews
 */
function sculptura_register_additional_post_types() {
    // Features (Преимущества)
    register_post_type('feature', [
        'labels' => [
            'name' => 'Преимущества',
            'singular_name' => 'Преимущество',
            'add_new' => 'Добавить преимущество',
            'add_new_item' => 'Добавить новое преимущество',
        ],
        'public' => false,
        'show_ui' => true,
        'menu_icon' => 'dashicons-star-filled',
        'supports' => ['title', 'editor', 'thumbnail'],
        'show_in_rest' => true,
    ]);

    // Reviews (Отзывы)
    register_post_type('review', [
        'labels' => [
            'name' => 'Отзывы',
            'singular_name' => 'Отзыв',
            'add_new' => 'Добавить отзыв',
            'add_new_item' => 'Добавить новый отзыв',
        ],
        'public' => false,
        'show_ui' => true,
        'menu_icon' => 'dashicons-format-quote',
        'supports' => ['title', 'editor', 'thumbnail'],
        'show_in_rest' => true,
    ]);
}
add_action('init', 'sculptura_register_additional_post_types');

/**
 * Добавление мета-боксов для главной страницы (Hero секция)
 */
function sculptura_add_homepage_meta_boxes() {
    $homepage_id = get_option('page_on_front');
    if (!$homepage_id) {
        return;
    }
    
    add_meta_box(
        'sculptura_hero_section',
        'Hero секция',
        'sculptura_hero_meta_box_callback',
        'page',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'sculptura_add_homepage_meta_boxes');

/**
 * Callback для Hero мета-бокса
 */
function sculptura_hero_meta_box_callback($post) {
    wp_nonce_field('sculptura_hero_save', 'sculptura_hero_nonce');
    
    $hero_title = get_post_meta($post->ID, '_hero_title', true);
    $hero_subtitle = get_post_meta($post->ID, '_hero_subtitle', true);
    $hero_image_1 = get_post_meta($post->ID, '_hero_image_1', true);
    $hero_image_2 = get_post_meta($post->ID, '_hero_image_2', true);
    $hero_image_3 = get_post_meta($post->ID, '_hero_image_3', true);
    ?>
    <table class="form-table">
        <tr>
            <th><label for="hero_title">Заголовок</label></th>
            <td><input type="text" id="hero_title" name="hero_title" value="<?php echo esc_attr($hero_title); ?>" class="regular-text" /></td>
        </tr>
        <tr>
            <th><label for="hero_subtitle">Подзаголовок</label></th>
            <td><textarea id="hero_subtitle" name="hero_subtitle" rows="4" class="large-text"><?php echo esc_textarea($hero_subtitle); ?></textarea></td>
        </tr>
        <tr>
            <th><label for="hero_image_1">Изображение 1</label></th>
            <td>
                <input type="url" id="hero_image_1" name="hero_image_1" value="<?php echo esc_url($hero_image_1); ?>" class="regular-text" />
                <button type="button" class="button sculptura-media-upload" data-target="hero_image_1">Выбрать изображение</button>
            </td>
        </tr>
        <tr>
            <th><label for="hero_image_2">Изображение 2</label></th>
            <td>
                <input type="url" id="hero_image_2" name="hero_image_2" value="<?php echo esc_url($hero_image_2); ?>" class="regular-text" />
                <button type="button" class="button sculptura-media-upload" data-target="hero_image_2">Выбрать изображение</button>
            </td>
        </tr>
        <tr>
            <th><label for="hero_image_3">Изображение 3</label></th>
            <td>
                <input type="url" id="hero_image_3" name="hero_image_3" value="<?php echo esc_url($hero_image_3); ?>" class="regular-text" />
                <button type="button" class="button sculptura-media-upload" data-target="hero_image_3">Выбрать изображение</button>
            </td>
        </tr>
    </table>
    <script>
    jQuery(document).ready(function($) {
        $('.sculptura-media-upload').on('click', function(e) {
            e.preventDefault();
            var target = $(this).data('target');
            var frame = wp.media({
                title: 'Выберите изображение',
                button: { text: 'Использовать' },
                multiple: false
            });
            frame.on('select', function() {
                var attachment = frame.state().get('selection').first().toJSON();
                $('#' + target).val(attachment.url);
            });
            frame.open();
        });
    });
    </script>
    <?php
}

/**
 * Сохранение Hero мета-полей
 */
function sculptura_save_homepage_meta($post_id) {
    if (!isset($_POST['sculptura_hero_nonce']) || !wp_verify_nonce($_POST['sculptura_hero_nonce'], 'sculptura_hero_save')) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    if (!current_user_can('edit_page', $post_id)) {
        return;
    }
    
    $homepage_id = get_option('page_on_front');
    if ($post_id != $homepage_id) {
        return;
    }
    
    if (isset($_POST['hero_title'])) {
        update_post_meta($post_id, '_hero_title', sanitize_text_field($_POST['hero_title']));
    }
    if (isset($_POST['hero_subtitle'])) {
        update_post_meta($post_id, '_hero_subtitle', sanitize_textarea_field($_POST['hero_subtitle']));
    }
    if (isset($_POST['hero_image_1'])) {
        update_post_meta($post_id, '_hero_image_1', esc_url_raw($_POST['hero_image_1']));
    }
    if (isset($_POST['hero_image_2'])) {
        update_post_meta($post_id, '_hero_image_2', esc_url_raw($_POST['hero_image_2']));
    }
    if (isset($_POST['hero_image_3'])) {
        update_post_meta($post_id, '_hero_image_3', esc_url_raw($_POST['hero_image_3']));
    }
}
add_action('save_post', 'sculptura_save_homepage_meta');

/**
 * Добавление мета-полей для услуг (hero image и intro)
 */
function sculptura_add_service_meta_boxes() {
    add_meta_box(
        'sculptura_service_fields',
        'Дополнительные поля услуги',
        'sculptura_service_meta_box_callback',
        'service',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'sculptura_add_service_meta_boxes');

/**
 * Callback для мета-бокса услуги
 */
function sculptura_service_meta_box_callback($post) {
    wp_nonce_field('sculptura_service_save', 'sculptura_service_nonce');
    
    $service_hero_image = get_post_meta($post->ID, '_service_hero_image', true);
    $service_intro = get_post_meta($post->ID, '_service_intro', true);
    ?>
    <table class="form-table">
        <tr>
            <th><label for="service_hero_image">Изображение вверху страницы</label></th>
            <td>
                <input type="url" id="service_hero_image" name="service_hero_image" value="<?php echo esc_url($service_hero_image); ?>" class="regular-text" />
                <button type="button" class="button sculptura-media-upload" data-target="service_hero_image">Выбрать изображение</button>
                <?php if ($service_hero_image) : ?>
                    <p><img src="<?php echo esc_url($service_hero_image); ?>" style="max-width: 200px; height: auto; margin-top: 10px;" /></p>
                <?php endif; ?>
            </td>
        </tr>
        <tr>
            <th><label for="service_intro">Интро-текст</label></th>
            <td><textarea id="service_intro" name="service_intro" rows="4" class="large-text"><?php echo esc_textarea($service_intro); ?></textarea></td>
        </tr>
    </table>
    <script>
    jQuery(document).ready(function($) {
        $('.sculptura-media-upload').on('click', function(e) {
            e.preventDefault();
            var target = $(this).data('target');
            var frame = wp.media({
                title: 'Выберите изображение',
                button: { text: 'Использовать' },
                multiple: false
            });
            frame.on('select', function() {
                var attachment = frame.state().get('selection').first().toJSON();
                $('#' + target).val(attachment.url);
                if (target === 'service_hero_image') {
                    $('#' + target).next('p').remove();
                    $('#' + target).after('<p><img src="' + attachment.url + '" style="max-width: 200px; height: auto; margin-top: 10px;" /></p>');
                }
            });
            frame.open();
        });
    });
    </script>
    <?php
}

/**
 * Сохранение мета-полей услуги
 */
function sculptura_save_service_meta($post_id) {
    if (!isset($_POST['sculptura_service_nonce']) || !wp_verify_nonce($_POST['sculptura_service_nonce'], 'sculptura_service_save')) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    if (isset($_POST['service_hero_image'])) {
        update_post_meta($post_id, '_service_hero_image', esc_url_raw($_POST['service_hero_image']));
    }
    if (isset($_POST['service_intro'])) {
        update_post_meta($post_id, '_service_intro', sanitize_textarea_field($_POST['service_intro']));
    }
}
add_action('save_post_service', 'sculptura_save_service_meta');

/**
 * Добавление мета-поля "Дата" для отзывов
 */
function sculptura_add_review_meta_boxes() {
    add_meta_box(
        'sculptura_review_date',
        'Дата отзыва',
        'sculptura_review_date_callback',
        'review',
        'side',
        'default'
    );
}
add_action('add_meta_boxes', 'sculptura_add_review_meta_boxes');

function sculptura_review_date_callback($post) {
    wp_nonce_field('sculptura_review_save', 'sculptura_review_nonce');
    $review_date = get_post_meta($post->ID, '_review_date', true);
    ?>
    <p>
        <label for="review_date">Дата отзыва:</label><br>
        <input type="date" id="review_date" name="review_date" value="<?php echo esc_attr($review_date); ?>" class="regular-text" />
    </p>
    <?php
}

function sculptura_save_review_meta($post_id) {
    if (!isset($_POST['sculptura_review_nonce']) || !wp_verify_nonce($_POST['sculptura_review_nonce'], 'sculptura_review_save')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    if (isset($_POST['review_date'])) {
        update_post_meta($post_id, '_review_date', sanitize_text_field($_POST['review_date']));
    }
}
add_action('save_post_review', 'sculptura_save_review_meta');

/**
 * Хелпер: получение мета-поля
 */
function sculptura_get_meta($key, $post_id = null, $default = '') {
    if (!$post_id) {
        $post_id = get_the_ID();
    }
    $value = get_post_meta($post_id, $key, true);
    return $value ? $value : $default;
}

