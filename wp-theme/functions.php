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
// Принудительно используем HTTPS для URI темы
$theme_uri = get_template_directory_uri();
if (is_ssl() || (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')) {
    $theme_uri = str_replace('http://', 'https://', $theme_uri);
}
define('SCULPTURA_THEME_URI', $theme_uri);

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
 * Принудительное использование HTTPS для всех URL
 * Исправляет проблему Mixed Content
 */
function sculptura_force_https($url) {
    if (is_ssl()) {
        $url = str_replace('http://', 'https://', $url);
    }
    return $url;
}

// Применяем HTTPS ко всем URL
add_filter('wp_get_attachment_url', 'sculptura_force_https');
add_filter('wp_get_attachment_image_src', function($image) {
    if ($image && isset($image[0])) {
        $image[0] = sculptura_force_https($image[0]);
    }
    return $image;
}, 10, 1);
add_filter('wp_get_attachment_image_attributes', function($attr) {
    if (isset($attr['src'])) {
        $attr['src'] = sculptura_force_https($attr['src']);
    }
    if (isset($attr['srcset'])) {
        $attr['srcset'] = sculptura_force_https($attr['srcset']);
    }
    return $attr;
}, 10, 1);
add_filter('the_post_thumbnail_url', 'sculptura_force_https');
add_filter('wp_calculate_image_srcset', function($sources) {
    if (is_array($sources)) {
        foreach ($sources as &$source) {
            if (isset($source['url'])) {
                $source['url'] = sculptura_force_https($source['url']);
            }
        }
    }
    return $sources;
}, 10, 1);
add_filter('home_url', 'sculptura_force_https');
add_filter('site_url', 'sculptura_force_https');
add_filter('content_url', 'sculptura_force_https');
add_filter('plugins_url', 'sculptura_force_https');
add_filter('template_directory_uri', 'sculptura_force_https');
add_filter('stylesheet_directory_uri', 'sculptura_force_https');

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
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail'],
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
 * Добавление мета-поля "Иконка" для features
 */
function sculptura_add_feature_meta_boxes() {
    add_meta_box(
        'sculptura_feature_icon',
        'Иконка преимущества',
        'sculptura_feature_icon_callback',
        'feature',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'sculptura_add_feature_meta_boxes');

function sculptura_feature_icon_callback($post) {
    wp_nonce_field('sculptura_feature_save', 'sculptura_feature_nonce');
    $feature_icon = get_post_meta($post->ID, '_feature_icon', true);
    ?>
    <table class="form-table">
        <tr>
            <th><label for="feature_icon">URL иконки</label></th>
            <td>
                <input type="url" id="feature_icon" name="feature_icon" value="<?php echo esc_url($feature_icon); ?>" class="regular-text" />
                <button type="button" class="button sculptura-media-upload" data-target="feature_icon">Выбрать изображение</button>
                <p class="description">Укажите URL иконки (SVG или изображение). Можно использовать путь к файлу в теме: <?php echo esc_html(get_template_directory_uri()); ?>/assets/images/icon/</p>
                <?php if ($feature_icon) : ?>
                    <p><img src="<?php echo esc_url($feature_icon); ?>" style="max-width: 100px; height: auto; margin-top: 10px;" /></p>
                <?php endif; ?>
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
                if (target === 'feature_icon') {
                    $('#' + target).next('p').next('p').remove();
                    $('#' + target).after('<p><img src="' + attachment.url + '" style="max-width: 100px; height: auto; margin-top: 10px;" /></p>');
                }
            });
            frame.open();
        });
    });
    </script>
    <?php
}

function sculptura_save_feature_meta($post_id) {
    if (!isset($_POST['sculptura_feature_nonce']) || !wp_verify_nonce($_POST['sculptura_feature_nonce'], 'sculptura_feature_save')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    if (isset($_POST['feature_icon'])) {
        update_post_meta($post_id, '_feature_icon', esc_url_raw($_POST['feature_icon']));
    }
}
add_action('save_post_feature', 'sculptura_save_feature_meta');

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

/**
 * Обработка формы записи на прием
 */
function sculptura_handle_reception_form() {
    // Проверка nonce
    if (!isset($_POST['reception_nonce']) || !wp_verify_nonce($_POST['reception_nonce'], 'reception_form')) {
        wp_die('Ошибка безопасности. Пожалуйста, попробуйте еще раз.');
    }
    
    // Получение данных формы
    $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : '';
    $phone = isset($_POST['phone']) ? sanitize_text_field($_POST['phone']) : '';
    $service = isset($_POST['service']) ? sanitize_text_field($_POST['service']) : '';
    $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : '';
    $time = isset($_POST['time']) ? sanitize_text_field($_POST['time']) : '';
    $comment = isset($_POST['comment']) ? sanitize_textarea_field($_POST['comment']) : '';
    
    // Валидация обязательных полей
    if (empty($name) || empty($phone)) {
        wp_redirect(add_query_arg('reception', 'error', wp_get_referer()));
        exit;
    }
    
    // Отправка в Telegram
    $telegram_sent = sculptura_send_to_telegram($name, $phone, $service, $date, $time, $comment);
    
    if ($telegram_sent) {
        // Редирект обратно с сообщением об успехе
        wp_redirect(add_query_arg('reception', 'success', wp_get_referer()));
    } else {
        // Редирект с ошибкой отправки
        wp_redirect(add_query_arg('reception', 'error', wp_get_referer()));
    }
    exit;
}
add_action('admin_post_reception_form_submit', 'sculptura_handle_reception_form');
add_action('admin_post_nopriv_reception_form_submit', 'sculptura_handle_reception_form');

/**
 * Отправка сообщения в Telegram
 * 
 * @param string $name Имя клиента
 * @param string $phone Телефон клиента
 * @param string $service Выбранная услуга
 * @param string $date Предпочтительная дата
 * @param string $time Предпочтительное время
 * @param string $comment Комментарий
 * @return bool Успешность отправки
 */
function sculptura_send_to_telegram($name, $phone, $service = '', $date = '', $time = '', $comment = '') {
    // Получаем настройки Telegram из опций WordPress
    // Для настройки добавить в wp-config.php:
    // define('TELEGRAM_BOT_TOKEN', 'ваш_токен_бота');
    // define('TELEGRAM_CHAT_ID', 'ваш_chat_id'); // Один чат
    // или
    // define('TELEGRAM_CHAT_IDS', ['chat_id1', 'chat_id2']); // Несколько чатов
    
    $bot_token = defined('TELEGRAM_BOT_TOKEN') ? TELEGRAM_BOT_TOKEN : get_option('sculptura_telegram_bot_token', '');
    
    // Поддержка нескольких чатов
    $chat_ids = [];
    if (defined('TELEGRAM_CHAT_IDS') && is_array(TELEGRAM_CHAT_IDS)) {
        $chat_ids = TELEGRAM_CHAT_IDS;
    } elseif (defined('TELEGRAM_CHAT_ID')) {
        $chat_ids = [TELEGRAM_CHAT_ID];
    } else {
        $single_chat_id = get_option('sculptura_telegram_chat_id', '');
        if ($single_chat_id) {
            $chat_ids = [$single_chat_id];
        }
    }
    
    // Проверка наличия настроек
    if (empty($bot_token) || empty($chat_ids)) {
        error_log('Sculptura: Telegram не настроен. Укажите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID или TELEGRAM_CHAT_IDS');
        return false;
    }
    
    // Экранирование специальных символов для Markdown
    $escape_markdown = function($text) {
        return str_replace(
            ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'],
            ['\_', '\*', '\[', '\]', '\(', '\)', '\~', '\`', '\>', '\#', '\+', '\-', '\=', '\|', '\{', '\}', '\.', '\!'],
            $text
        );
    };
    
    // Формируем сообщение
    $message = "📝 *Новая заявка на запись*\n\n";
    $message .= "👤 *Имя:* " . $escape_markdown($name) . "\n";
    $message .= "📞 *Телефон:* " . $escape_markdown($phone) . "\n";
    
    if ($service) {
        $message .= "💼 *Услуга:* " . $escape_markdown($service) . "\n";
    }
    if ($date) {
        $message .= "📅 *Дата:* " . $escape_markdown($date) . "\n";
    }
    if ($time) {
        $message .= "⏰ *Время:* " . $escape_markdown($time) . "\n";
    }
    if ($comment) {
        $message .= "💬 *Комментарий:*\n" . $escape_markdown($comment) . "\n";
    }
    
    // URL для отправки сообщения через Bot API
    $url = "https://api.telegram.org/bot{$bot_token}/sendMessage";
    
    // Отправляем сообщение во все указанные чаты
    $all_success = true;
    foreach ($chat_ids as $chat_id) {
        // Параметры запроса
        $data = [
            'chat_id' => $chat_id,
            'text' => $message,
            'parse_mode' => 'Markdown'
        ];
        
        // Отправка запроса через wp_remote_post
        $response = wp_remote_post($url, [
            'body' => $data,
            'timeout' => 10,
        ]);
        
        // Проверка результата
        if (is_wp_error($response)) {
            error_log("Sculptura: Ошибка отправки в Telegram (chat_id: {$chat_id}): " . $response->get_error_message());
            $all_success = false;
            continue;
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        
        if ($response_code === 200) {
            $result = json_decode($response_body, true);
            if (!isset($result['ok']) || !$result['ok']) {
                error_log("Sculptura: Telegram API вернул ошибку (chat_id: {$chat_id}): {$response_body}");
                $all_success = false;
            }
        } else {
            error_log("Sculptura: HTTP ошибка при отправке в Telegram (chat_id: {$chat_id}): {$response_code} - {$response_body}");
            $all_success = false;
        }
    }
    
    return $all_success;
}


