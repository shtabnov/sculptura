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
    
    // Добавляем defer для некритичных скриптов
    add_filter('script_loader_tag', function($tag, $handle) {
        // Добавляем defer для всех скриптов кроме критичных
        $defer_scripts = ['sculptura-main', 'ymaps'];
        if (in_array($handle, $defer_scripts)) {
            // Проверяем, что defer еще не добавлен
            if (strpos($tag, 'defer') === false) {
                $tag = str_replace('></script>', ' defer></script>', $tag);
            }
        }
        return $tag;
    }, 10, 2);

    // Глобальная переменная с URI темы для обращений из JS к ассетам
    wp_add_inline_script(
        'sculptura-main',
        'window.SCL_THEME_URI = ' . json_encode(SCULPTURA_THEME_URI) . ';',
        'before'
    );
}
add_action('wp_enqueue_scripts', 'sculptura_enqueue_assets');

/**
 * Настройка кеширования статических ресурсов
 */
function sculptura_set_cache_headers() {
    // Устанавливаем заголовки кеширования для статических ресурсов
    if (!is_admin()) {
        // Кеширование для CSS и JS - 1 год
        if (preg_match('/\.(css|js)(\?|$)/', $_SERVER['REQUEST_URI'])) {
            header('Cache-Control: public, max-age=31536000, immutable');
            header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
        }
        // Кеширование для изображений - 1 месяц
        elseif (preg_match('/\.(jpg|jpeg|png|gif|webp|svg|ico)(\?|$)/', $_SERVER['REQUEST_URI'])) {
            header('Cache-Control: public, max-age=2592000');
            header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 2592000) . ' GMT');
        }
        // Кеширование для шрифтов - 1 год
        elseif (preg_match('/\.(woff|woff2|ttf|otf|eot)(\?|$)/', $_SERVER['REQUEST_URI'])) {
            header('Cache-Control: public, max-age=31536000, immutable');
            header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
        }
    }
}
add_action('init', 'sculptura_set_cache_headers');


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
 * Добавление Favicon с поддержкой разных размеров
 */
function sculptura_add_favicon() {
    $theme_uri = SCULPTURA_THEME_URI;
    
    // Основная фавиконка - используем PNG для лучшей видимости
    $favicon_32 = $theme_uri . '/assets/images/logo.png';
    $favicon_16 = $theme_uri . '/assets/images/logo.png';
    
    // SVG для современных браузеров (если нужна векторная версия)
    $favicon_svg = $theme_uri . '/assets/images/logo.svg';
    
    // Apple Touch Icon (для iOS) - нужен размер 180x180
    $apple_touch_icon = $theme_uri . '/assets/images/logo.png';
    
    // Android Chrome Icons
    $android_192 = $theme_uri . '/assets/images/logo.png';
    $android_512 = $theme_uri . '/assets/images/logo.png';
    
    // Основная фавиконка (32x32) - приоритет для большинства браузеров
    echo '<link rel="icon" type="image/png" sizes="32x32" href="' . esc_url($favicon_32) . '">' . "\n";
    echo '<link rel="icon" type="image/png" sizes="16x16" href="' . esc_url($favicon_16) . '">' . "\n";
    
    // SVG для современных браузеров (опционально, если SVG хорошо виден)
    // echo '<link rel="icon" type="image/svg+xml" href="' . esc_url($favicon_svg) . '">' . "\n";
    
    // Стандартная фавиконка (fallback для старых браузеров)
    echo '<link rel="shortcut icon" href="' . esc_url($favicon_32) . '">' . "\n";
    
    // Apple Touch Icon (для iOS устройств)
    echo '<link rel="apple-touch-icon" sizes="180x180" href="' . esc_url($apple_touch_icon) . '">' . "\n";
    
    // Android Chrome Icons
    echo '<link rel="icon" type="image/png" sizes="192x192" href="' . esc_url($android_192) . '">' . "\n";
    echo '<link rel="icon" type="image/png" sizes="512x512" href="' . esc_url($android_512) . '">' . "\n";
    
    // Manifest для PWA (опционально)
    // echo '<link rel="manifest" href="' . esc_url($theme_uri . '/manifest.json') . '">' . "\n";
    
    // Цвет темы для браузеров
    echo '<meta name="theme-color" content="#ffffff">' . "\n";
}
add_action('wp_head', 'sculptura_add_favicon', 1);

/**
 * Добавление мета-тега верификации Google Search Console
 */
function sculptura_add_google_verification() {
    echo '<meta name="google-site-verification" content="3wtKbPCgLODXD1tz1DtsJFgaQd1DiTRWJQP6p_yn2cI" />' . "\n";
}
add_action('wp_head', 'sculptura_add_google_verification', 1);


/**
 * Обрезает title до оптимальной длины для SEO
 * Google: 50-60 символов, Яндекс: до 70 символов
 */
function sculptura_trim_title($title, $max_length = 60) {
    if (mb_strlen($title) <= $max_length) {
        return $title;
    }
    // Обрезаем по последнему пробелу перед лимитом
    $trimmed = mb_substr($title, 0, $max_length);
    $last_space = mb_strrpos($trimmed, ' ');
    if ($last_space !== false) {
        $trimmed = mb_substr($trimmed, 0, $last_space);
    }
    return $trimmed . '...';
}

/**
 * Обрезает description до оптимальной длины для SEO
 * Google: 150-160 символов, Яндекс: до 200 символов
 */
function sculptura_trim_description($description, $max_length = 160) {
    if (mb_strlen($description) <= $max_length) {
        return $description;
    }
    // Обрезаем по последнему пробелу перед лимитом
    $trimmed = mb_substr($description, 0, $max_length);
    $last_space = mb_strrpos($trimmed, ' ');
    if ($last_space !== false) {
        $trimmed = mb_substr($trimmed, 0, $last_space);
    }
    return $trimmed . '...';
}

function sculptura_add_seo_meta_tags() {
    // Базовые значения по умолчанию (оптимизированы для запросов "массаж лица пермь" и "скульптура пермь ру")
    // Description оптимизирован: содержит ключевые слова и призыв к действию
    $default_description = 'Скульптура Пермь — студия красоты Sculptura. Массаж лица в Перми, буккальный массаж, косметология. Профессиональный уход за лицом. Кондратово. Запись онлайн.';
    $default_keywords = 'массаж лица пермь, массаж лица, массаж лица в перми, массаж лица скульптура, косметология пермь, буккальный массаж пермь, студия красоты пермь, уход за лицом пермь, лифтинг лица пермь, скульптура пермь ру, кондратово';
    
    $description = $default_description;
    $keywords = $default_keywords;
    $title = get_bloginfo('name');
    $site_url = home_url('/');
    $image_url = SCULPTURA_THEME_URI . '/assets/images/logo.png';
    
    // Для отдельных страниц и постов
    if (is_singular()) {
        $post_id = get_queried_object_id();
        $post_type = get_post_type($post_id);
        
        // Проверяем, есть ли кастомные мета-поля
        $meta_description = get_post_meta($post_id, '_seo_description', true);
        $meta_keywords = get_post_meta($post_id, '_seo_keywords', true);
        
        // Специальная обработка для услуг (service)
        if ($post_type === 'service') {
            $service_title = get_the_title($post_id);
            
            // Если это услуга "Массаж лица", добавляем ключевые слова
            if (stripos($service_title, 'массаж лица') !== false || stripos($service_title, 'массаж') !== false) {
                if (!$meta_description) {
                    // Оптимизированный description для услуг массажа: 152 символа
                    $meta_description = 'Массаж лица в Перми в студии Sculptura. Профессиональный буккальный массаж для омоложения и улучшения тонуса кожи. Запись онлайн. Кондратово.';
                }
                if (!$meta_keywords) {
                    $meta_keywords = 'массаж лица пермь, массаж лица, массаж лица в перми, массаж лица скульптура, косметология пермь, уход за лицом пермь, лифтинг лица пермь, скульптура пермь ру';
                }
            } else {
                // Для других услуг создаем description на основе названия
                if (!$meta_description) {
                    $meta_description = $service_title . ' в Перми в студии красоты Sculptura. Профессиональные услуги красоты и косметологии. Запись онлайн. Кондратово.';
                }
            }
        }
        
        if ($meta_description) {
            $description = $meta_description;
        } elseif (has_excerpt($post_id)) {
            $description = wp_trim_words(get_the_excerpt($post_id), 25);
        } elseif (get_the_content($post_id)) {
            $description = wp_trim_words(strip_tags(get_the_content($post_id)), 25);
        }
        
        // Обрезаем description до оптимальной длины
        $description = sculptura_trim_description($description, 160);
        
        if ($meta_keywords) {
            $keywords = $meta_keywords;
        }
        
        // Формируем title с учетом длины
        $post_title = get_the_title($post_id);
        $site_name = get_bloginfo('name');
        $title = $post_title . ' — ' . $site_name;
        
        // Если title слишком длинный, обрезаем его
        if (mb_strlen($title) > 60) {
            // Пытаемся сохранить название поста полностью, обрезая только если очень длинное
            if (mb_strlen($post_title) > 45) {
                $title = sculptura_trim_title($post_title, 45) . ' — ' . $site_name;
            } else {
                $title = $post_title . ' — ' . sculptura_trim_title($site_name, 15);
            }
        }
        
        // Изображение для соцсетей
        if (has_post_thumbnail($post_id)) {
            $image_url = get_the_post_thumbnail_url($post_id, 'large');
        }
    } elseif (is_home() || is_front_page()) {
        // Для главной страницы - оптимизируем под ключевой запрос "скульптура пермь ру"
        // Title: включает ключевые слова для лучшей индексации
        $title = 'Скульптура Пермь — Массаж лица в студии красоты';
        // Description с ключевыми словами "скульптура пермь ру"
        $description = 'Скульптура Пермь — студия красоты Sculptura. Массаж лица в Перми, буккальный массаж, косметология. Профессиональный уход за лицом. Кондратово. Запись онлайн.';
        $keywords = $default_keywords;
    } elseif (is_category()) {
        $category = get_queried_object();
        $description = $category->description ?: $default_description;
        $description = sculptura_trim_description($description, 160);
        $keywords = $category->name . ', ' . $default_keywords;
        $title = $category->name . ' — ' . get_bloginfo('name');
        $title = sculptura_trim_title($title, 60);
    } elseif (is_tag()) {
        $tag = get_queried_object();
        $description = $tag->description ?: $default_description;
        $description = sculptura_trim_description($description, 160);
        $keywords = $tag->name . ', ' . $default_keywords;
        $title = $tag->name . ' — ' . get_bloginfo('name');
        $title = sculptura_trim_title($title, 60);
    }
    
    // Очищаем и экранируем значения
    $description = esc_attr(wp_strip_all_tags($description));
    $keywords = esc_attr($keywords);
    $title = esc_attr($title);
    $image_url = esc_url($image_url);
    
    // Мета-тег Description (важно для SEO)
    if ($description) {
        echo '<meta name="description" content="' . $description . '">' . "\n";
    }
    
    // Мета-тег Keywords (менее важен, но все еще используется)
    if ($keywords) {
        echo '<meta name="keywords" content="' . $keywords . '">' . "\n";
    }
    
    // Open Graph теги для социальных сетей (Facebook, VK и т.д.)
    $og_url = is_singular() ? get_permalink() : home_url('/');
    echo '<meta property="og:type" content="' . (is_singular() ? 'article' : 'website') . '">' . "\n";
    echo '<meta property="og:title" content="' . $title . '">' . "\n";
    echo '<meta property="og:description" content="' . $description . '">' . "\n";
    echo '<meta property="og:url" content="' . esc_url($og_url) . '">' . "\n";
    echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";
    echo '<meta property="og:image" content="' . $image_url . '">' . "\n";
    echo '<meta property="og:locale" content="ru_RU">' . "\n";
    
    // Twitter Card теги
    echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
    echo '<meta name="twitter:title" content="' . $title . '">' . "\n";
    echo '<meta name="twitter:description" content="' . $description . '">' . "\n";
    echo '<meta name="twitter:image" content="' . $image_url . '">' . "\n";
}
add_action('wp_head', 'sculptura_add_seo_meta_tags', 2);

/**
 * Добавление структурированных данных Schema.org (JSON-LD)
 * Улучшает SEO и отображение в результатах поиска
 */
function sculptura_add_schema_org() {
    $site_url = home_url('/');
    $site_name = get_bloginfo('name');
    $site_description = get_bloginfo('description');
    
    // Основная информация о бизнесе (LocalBusiness)
    $business_schema = [
        '@context' => 'https://schema.org',
        '@type' => 'BeautySalon',
        'name' => $site_name,
        'description' => 'Студия естественной красоты Sculptura в Перми. Профессиональный массаж лица, буккальный массаж, косметология.',
        'url' => $site_url,
        'telephone' => '+79638816267',
        'address' => [
            '@type' => 'PostalAddress',
            'streetAddress' => 'ул. Садовое кольцо 14, вход с торца здания',
            'addressLocality' => 'Кондратово',
            'addressRegion' => 'Пермский край',
            'addressCountry' => 'RU'
        ],
        'geo' => [
            '@type' => 'GeoCoordinates',
            'latitude' => '57.9833',
            'longitude' => '56.1167'
        ],
        'openingHoursSpecification' => [
            [
                '@type' => 'OpeningHoursSpecification',
                'dayOfWeek' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                'opens' => '09:00',
                'closes' => '21:00'
            ]
        ],
        'priceRange' => '$$',
        'image' => SCULPTURA_THEME_URI . '/assets/images/logo.png',
        'sameAs' => [
            'https://vk.com/buccal59'
        ]
    ];
    
    // Для главной страницы
    if (is_front_page() || is_home()) {
        echo '<script type="application/ld+json">' . "\n";
        echo wp_json_encode($business_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        echo "\n" . '</script>' . "\n";
        
        // Добавляем Service schema для главной страницы
        $service_schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Service',
            'serviceType' => 'Массаж лица',
            'provider' => [
                '@type' => 'BeautySalon',
                'name' => $site_name,
                'address' => $business_schema['address']
            ],
            'areaServed' => [
                '@type' => 'City',
                'name' => 'Пермь'
            ],
            'description' => 'Профессиональный массаж лица в Перми. Омоложение и улучшение тонуса кожи лица. Косметология, лифтинг, уход за лицом.'
        ];
        
        echo '<script type="application/ld+json">' . "\n";
        echo wp_json_encode($service_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        echo "\n" . '</script>' . "\n";
    }
    
    // Для страниц услуг (service post type)
    if (is_singular('service')) {
        $post_id = get_queried_object_id();
        $service_title = get_the_title($post_id);
        $service_description = has_excerpt($post_id) ? get_the_excerpt($post_id) : wp_trim_words(strip_tags(get_the_content($post_id)), 30);
        $service_url = get_permalink($post_id);
        $service_image = has_post_thumbnail($post_id) ? get_the_post_thumbnail_url($post_id, 'large') : SCULPTURA_THEME_URI . '/assets/images/logo.png';
        
        $service_schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Service',
            'name' => $service_title,
            'description' => $service_description,
            'provider' => [
                '@type' => 'BeautySalon',
                'name' => $site_name,
                'telephone' => '+79638816267',
                'address' => $business_schema['address']
            ],
            'areaServed' => [
                '@type' => 'City',
                'name' => 'Пермь'
            ],
            'url' => $service_url,
            'image' => $service_image
        ];
        
        // Если это массаж лица, добавляем дополнительные данные
        if (stripos($service_title, 'массаж лица') !== false) {
        $service_schema['serviceType'] = 'Массаж лица';
        $service_schema['keywords'] = 'массаж лица пермь, массаж лица, косметология пермь, уход за лицом пермь, скульптура пермь ру';
        }
        
        echo '<script type="application/ld+json">' . "\n";
        echo wp_json_encode($service_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        echo "\n" . '</script>' . "\n";
        
        // Также добавляем LocalBusiness на страницу услуги
        echo '<script type="application/ld+json">' . "\n";
        echo wp_json_encode($business_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        echo "\n" . '</script>' . "\n";
    }
    
    // Для отзывов (review post type)
    if (is_singular('review')) {
        $post_id = get_queried_object_id();
        $review_author = get_the_title($post_id);
        $review_text = get_the_content($post_id);
        $review_date = get_post_meta($post_id, '_review_date', true) ?: get_the_date('c', $post_id);
        $review_rating = get_post_meta($post_id, '_review_rating', true) ?: 5;
        
        $review_schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Review',
            'itemReviewed' => [
                '@type' => 'BeautySalon',
                'name' => $site_name,
                'address' => $business_schema['address']
            ],
            'author' => [
                '@type' => 'Person',
                'name' => $review_author
            ],
            'reviewBody' => wp_strip_all_tags($review_text),
            'datePublished' => $review_date,
            'reviewRating' => [
                '@type' => 'Rating',
                'ratingValue' => $review_rating,
                'bestRating' => 5
            ]
        ];
        
        echo '<script type="application/ld+json">' . "\n";
        echo wp_json_encode($review_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        echo "\n" . '</script>' . "\n";
    }
}
add_action('wp_head', 'sculptura_add_schema_org', 3);

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
        // Для SVG удаляем width и height (они не нужны)
        unset($attr['width']);
        unset($attr['height']);
    } else {
        // Для всех остальных изображений гарантируем наличие width и height
        if (!isset($attr['width']) || !isset($attr['height'])) {
            $attachment_id = is_object($attachment) ? $attachment->ID : $attachment;
            if ($attachment_id) {
                $image_meta = wp_get_attachment_image_src($attachment_id, $size);
                if ($image_meta) {
                    if (!isset($attr['width'])) {
                        $attr['width'] = $image_meta[1];
                    }
                    if (!isset($attr['height'])) {
                        $attr['height'] = $image_meta[2];
                    }
                } else {
                    // Если не удалось получить размеры, пробуем из метаданных
                    $metadata = wp_get_attachment_metadata($attachment_id);
                    if ($metadata && isset($metadata['width']) && isset($metadata['height'])) {
                        if (!isset($attr['width'])) {
                            $attr['width'] = $metadata['width'];
                        }
                        if (!isset($attr['height'])) {
                            $attr['height'] = $metadata['height'];
                        }
                    }
                }
            }
        }
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
 * Заменяет якорные ссылки #price на ссылку на страницу прайс-листа
 */
function sculptura_fix_price_menu_link($items, $args) {
    // Ищем страницу прайс-листа по slug
    $price_page = get_page_by_path('price');
    if (!$price_page) {
        // Пробуем кириллический slug
        $price_page = get_page_by_path('прайс-лист');
    }
    
    if ($price_page) {
        $price_url = get_permalink($price_page->ID);
        
        foreach ($items as $item) {
            // Проверяем, содержит ли ссылка якорь #price
            if (strpos($item->url, '#price') !== false || 
                $item->url === home_url('/#price') || 
                $item->url === '#price') {
                $item->url = $price_url;
            }
        }
    }
    
    return $items;
}
add_filter('wp_nav_menu_objects', 'sculptura_fix_price_menu_link', 10, 2);

/**
 * Регистрация всех Custom Post Types
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
        'publicly_queryable' => true, // Явно разрешаем публичные запросы
        'show_ui' => true,
        'show_in_menu' => true,
        'show_in_nav_menus' => true,
        'show_in_admin_bar' => true,
        'show_in_rest' => true,
        'exclude_from_search' => false, // Включаем в поиск
        'has_archive' => false,
        'menu_icon' => 'dashicons-businessman',
        'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
        'rewrite' => ['slug' => 'services', 'with_front' => false],
        'capability_type' => 'post',
        'hierarchical' => false,
        'query_var' => true, // Разрешаем использование в запросах
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
add_action('init', 'sculptura_register_post_types');

/**
 * Общая функция для вывода JavaScript кода media upload
 */
function sculptura_media_upload_script($preview_targets = []) {
    ?>
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
                <?php if (!empty($preview_targets)) : ?>
                if (<?php echo json_encode($preview_targets); ?>.includes(target)) {
                    $('#' + target).next('p').remove();
                    $('#' + target).after('<p><img src="' + attachment.url + '" style="max-width: 200px; height: auto; margin-top: 10px;" /></p>');
                }
                <?php endif; ?>
            });
            frame.open();
        });
    });
    </script>
    <?php
}

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
    <?php sculptura_media_upload_script(); ?>
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
 * Добавление мета-боксов для SEO (description и keywords)
 */
function sculptura_add_seo_meta_boxes() {
    // Добавляем для всех типов постов и страниц
    $post_types = ['post', 'page', 'service', 'sale'];
    foreach ($post_types as $post_type) {
        add_meta_box(
            'sculptura_seo_meta',
            'SEO настройки',
            'sculptura_seo_meta_box_callback',
            $post_type,
            'normal',
            'high'
        );
    }
}
add_action('add_meta_boxes', 'sculptura_add_seo_meta_boxes');

/**
 * Callback для SEO мета-бокса
 */
function sculptura_seo_meta_box_callback($post) {
    wp_nonce_field('sculptura_seo_save', 'sculptura_seo_nonce');
    
    $seo_description = get_post_meta($post->ID, '_seo_description', true);
    $seo_keywords = get_post_meta($post->ID, '_seo_keywords', true);
    
    ?>
    <table class="form-table">
        <tr>
            <th scope="row">
                <label for="seo_description">Мета-описание (Description)</label>
            </th>
            <td>
                <textarea 
                    id="seo_description" 
                    name="seo_description" 
                    rows="3" 
                    style="width: 100%;"
                    placeholder="Краткое описание страницы (150-160 символов, отображается в результатах поиска)"
                ><?php echo esc_textarea($seo_description); ?></textarea>
                <p class="description">
                    Рекомендуемая длина: 150-160 символов. Если не указано, будет использовано автоматическое описание из текста страницы.
                </p>
            </td>
        </tr>
        <tr>
            <th scope="row">
                <label for="seo_keywords">Ключевые слова (Keywords)</label>
            </th>
            <td>
                <input 
                    type="text" 
                    id="seo_keywords" 
                    name="seo_keywords" 
                    value="<?php echo esc_attr($seo_keywords); ?>" 
                    style="width: 100%;"
                    placeholder="ключевое слово 1, ключевое слово 2, ключевое слово 3"
                />
                <p class="description">
                    Ключевые слова через запятую. Например: "массаж лица, косметология, Пермь"
                </p>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * Сохранение SEO мета-полей
 */
function sculptura_save_seo_meta($post_id) {
    // Проверка nonce
    if (!isset($_POST['sculptura_seo_nonce']) || !wp_verify_nonce($_POST['sculptura_seo_nonce'], 'sculptura_seo_save')) {
        return;
    }
    
    // Проверка автосохранения
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    // Проверка прав
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    // Сохранение description
    if (isset($_POST['seo_description'])) {
        update_post_meta($post_id, '_seo_description', sanitize_textarea_field($_POST['seo_description']));
    } else {
        delete_post_meta($post_id, '_seo_description');
    }
    
    // Сохранение keywords
    if (isset($_POST['seo_keywords'])) {
        update_post_meta($post_id, '_seo_keywords', sanitize_text_field($_POST['seo_keywords']));
    } else {
        delete_post_meta($post_id, '_seo_keywords');
    }
}
add_action('save_post', 'sculptura_save_seo_meta');

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
    <?php sculptura_media_upload_script(['service_hero_image']); ?>
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
 * Добавление мета-боксов для отзывов
 */
function sculptura_add_review_meta_boxes() {
    add_meta_box(
        'sculptura_review_details',
        'Детали отзыва',
        'sculptura_review_details_callback',
        'review',
        'normal',
        'high'
    );
    
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

/**
 * Callback для мета-бокса "Детали отзыва"
 */
function sculptura_review_details_callback($post) {
    wp_nonce_field('sculptura_review_save', 'sculptura_review_nonce');
    
    $review_service = get_post_meta($post->ID, '_review_service', true);
    ?>
    <table class="form-table">
        <tr>
            <th scope="row">
                <label for="review_service">Услуга:</label>
            </th>
            <td>
                <input 
                    type="text" 
                    id="review_service" 
                    name="review_service" 
                    value="<?php echo esc_attr($review_service); ?>" 
                    class="regular-text" 
                    placeholder="Например: Массаж лица, Буккальный массаж, Маникюр"
                />
                <p class="description">Название услуги, о которой оставлен отзыв</p>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * Callback для мета-бокса "Дата отзыва"
 */
function sculptura_review_date_callback($post) {
    wp_nonce_field('sculptura_review_save', 'sculptura_review_nonce');
    $review_date = get_post_meta($post->ID, '_review_date', true);
    ?>
    <p>
        <label for="review_date">Дата отзыва:</label><br>
        <input type="date" id="review_date" name="review_date" value="<?php echo esc_attr($review_date); ?>" class="regular-text" />
    </p>
    <p class="description">Дата, когда был оставлен отзыв</p>
    <?php
}

/**
 * Сохранение мета-полей отзыва
 */
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
    
    // Сохраняем услугу
    if (isset($_POST['review_service'])) {
        update_post_meta($post_id, '_review_service', sanitize_text_field($_POST['review_service']));
    }
    
    // Сохраняем дату
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
    <?php sculptura_media_upload_script(['feature_icon']); ?>
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
 * Получает адаптивное изображение из URL с оптимизацией для PageSpeed
 * 
 * @param string $image_url URL изображения
 * @param string $size Размер изображения (по умолчанию 'full')
 * @param array $attr Дополнительные атрибуты для img тега
 * @return string HTML код изображения с srcset и sizes
 */
function sculptura_get_responsive_image($image_url, $size = 'full', $attr = []) {
    if (empty($image_url)) {
        return '';
    }
    
    // Получаем attachment_id из URL
    $attachment_id = attachment_url_to_postid($image_url);
    
    if (!$attachment_id) {
        // Если не удалось найти attachment, возвращаем обычный img с оптимизацией
        $default_attr = [
            'src' => $image_url,
            'alt' => isset($attr['alt']) ? $attr['alt'] : '',
            'loading' => isset($attr['loading']) ? $attr['loading'] : 'lazy',
            'decoding' => 'async',
            'fetchpriority' => isset($attr['fetchpriority']) ? $attr['fetchpriority'] : 'auto',
        ];
        
        // Добавляем width и height если указаны
        if (isset($attr['width'])) {
            $default_attr['width'] = $attr['width'];
        }
        if (isset($attr['height'])) {
            $default_attr['height'] = $attr['height'];
        }
        
        $attributes = '';
        foreach ($default_attr as $key => $value) {
            if (!empty($value)) {
                $attributes .= ' ' . esc_attr($key) . '="' . esc_attr($value) . '"';
            }
        }
        
        return '<img' . $attributes . '>';
    }
    
    // Получаем размеры изображения для указанного размера
    $image_meta = wp_get_attachment_image_src($attachment_id, $size);
    $width = $image_meta ? $image_meta[1] : null;
    $height = $image_meta ? $image_meta[2] : null;
    
    // Если размеры не получены, пробуем получить из метаданных
    if (!$width || !$height) {
        $metadata = wp_get_attachment_metadata($attachment_id);
        if ($metadata && isset($metadata['width']) && isset($metadata['height'])) {
            // Для hero изображений используем пропорциональные размеры
            // Hero занимает 100vw x 100vh, но для предотвращения CLS используем реальные размеры
            if (isset($attr['sizes']) && strpos($attr['sizes'], '100vw') !== false) {
                // Вычисляем пропорциональную высоту для hero (обычно соотношение 16:9 или подобное)
                $aspect_ratio = $metadata['height'] / $metadata['width'];
                $width = 1920; // Стандартная ширина для hero
                $height = round($width * $aspect_ratio);
            } else {
                $width = $metadata['width'];
                $height = $metadata['height'];
            }
        }
    }
    
    // Используем WordPress функцию для получения адаптивного изображения
    $default_attr = [
        'alt' => isset($attr['alt']) ? $attr['alt'] : get_post_meta($attachment_id, '_wp_attachment_image_alt', true),
        'loading' => isset($attr['loading']) ? $attr['loading'] : 'lazy',
        'decoding' => 'async',
        'fetchpriority' => isset($attr['fetchpriority']) ? $attr['fetchpriority'] : 'auto',
    ];
    
    // Добавляем width и height для предотвращения CLS
    if ($width && $height) {
        $default_attr['width'] = $width;
        $default_attr['height'] = $height;
    }
    
    // Добавляем sizes для адаптивности
    // Hero изображения занимают 100vw на всех экранах
    // Для других изображений используем более точные значения
    if (!isset($attr['sizes'])) {
        // Проверяем, является ли это hero изображением (по контексту использования)
        // Hero изображения обычно используются в full размере и занимают весь экран
        $default_attr['sizes'] = '(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw';
    }
    
    // Для hero изображений используем специальные размеры
    // WordPress автоматически создаст srcset с разными размерами
    if ($size === 'full') {
        // Используем большой размер, но не оригинал для оптимизации
        $size = 'large'; // 1024px по умолчанию в WordPress
    }
    
    // Объединяем с переданными атрибутами (переданные имеют приоритет)
    $img_attr = array_merge($default_attr, $attr);
    
    return wp_get_attachment_image($attachment_id, $size, false, $img_attr);
}

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
    
    // Валидация формата телефона: +7 (9**) ***-**-**
    $phone_clean = preg_replace('/\s+/', '', $phone); // Убираем пробелы
    if (!preg_match('/^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/', $phone_clean)) {
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
    
    // Форматирование даты: 2025-11-14 -> 14.11.2025
    $format_date = function($date) {
        // Проверяем формат YYYY-MM-DD
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $matches)) {
            return $matches[3] . '.' . $matches[2] . '.' . $matches[1];
        }
        // Если формат другой, возвращаем как есть
        return $date;
    };
    
    // Формируем сообщение
    $message = "📝 *Новая заявка на запись*\n\n";
    $message .= "👤 *Имя:* " . $escape_markdown($name) . "\n";
    // Телефон не экранируем, чтобы убрать обратные слэши и сохранить кликабельность
    $message .= "📞 *Телефон:* " . $phone . "\n";
    
    if ($service) {
        $message .= "💼 *Услуга:* " . $escape_markdown($service) . "\n";
    }
    if ($date) {
        $message .= "📅 *Дата:* " . $escape_markdown($format_date($date)) . "\n";
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

/**
 * Включение Sitemap в WordPress (если еще не включен)
 */
function sculptura_enable_sitemap() {
    // WordPress 5.5+ автоматически включает sitemap, но убедимся, что он не отключен
    add_filter('wp_sitemaps_enabled', '__return_true');
}
add_action('init', 'sculptura_enable_sitemap');

/**
 * Добавление кастомных post types в Sitemap WordPress
 * Это критично для индексации услуг поисковыми системами
 * 
 * WordPress 5.5+ автоматически включает публичные post types в sitemap,
 * но мы явно убеждаемся, что наши кастомные типы включены
 */
function sculptura_add_post_types_to_sitemap($post_types) {
    // Добавляем наши кастомные типы постов, если они еще не добавлены
    $service_type = get_post_type_object('service');
    $sale_type = get_post_type_object('sale');
    
    if ($service_type && $service_type->public) {
        $post_types['service'] = $service_type;
    }
    if ($sale_type && $sale_type->public) {
        $post_types['sale'] = $sale_type;
    }
    
    return $post_types;
}
add_filter('wp_sitemaps_post_types', 'sculptura_add_post_types_to_sitemap');

/**
 * Добавление ссылки на Sitemap в robots.txt
 */
function sculptura_add_sitemap_to_robots($output, $public) {
    // WordPress 5.5+ автоматически создает sitemap по адресу /wp-sitemap.xml
    $sitemap_url = home_url('/wp-sitemap.xml');
    
    // Добавляем ссылку на sitemap в конец robots.txt
    $output .= "\n# Sitemap\n";
    $output .= "Sitemap: " . esc_url($sitemap_url) . "\n";
    
    return $output;
}
add_filter('robots_txt', 'sculptura_add_sitemap_to_robots', 10, 2);


