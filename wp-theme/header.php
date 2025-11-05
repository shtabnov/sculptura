<!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="header">
    <div class="header__container">
        <nav class="header_nav nav">
            <div class="nav__menu">
                <input id="menu__toggle" type="checkbox">
                <label class="nav__btn" for="menu__toggle">
                    <span></span>
                </label>
            </div>

            <?php
            // Проверяем, назначено ли меню
            $has_menu = has_nav_menu('primary');
            
            if ($has_menu) {
                // Получаем элементы меню
                $menu_items = wp_get_nav_menu_items(wp_get_nav_menu_object(get_nav_menu_locations()['primary']));
                
                if ($menu_items && !is_wp_error($menu_items)) {
                    // Разделяем меню на две части для вставки логотипа в центр
                    $menu_count = count($menu_items);
                    $middle_index = floor($menu_count / 2);
                    
                    echo '<ul class="nav__list">';
                    
                    // Первая половина меню
                    for ($i = 0; $i < $middle_index; $i++) {
                        $item = $menu_items[$i];
                        echo '<li class="nav__item">';
                        echo '<a class="nav__link" href="' . esc_url($item->url) . '">' . esc_html($item->title) . '</a>';
                        echo '</li>';
                    }
                    
                    // Логотип в центре
                    echo '<li class="nav__item">';
                    echo '<a class="nav__logo" href="' . esc_url(home_url('/')) . '">';
                    if (has_custom_logo()) {
                        echo get_custom_logo();
                    } else {
                        echo '<img class="header__img" src="' . esc_url(get_template_directory_uri() . '/assets/images/logo.svg') . '" alt="' . esc_attr(get_bloginfo('name')) . '">';
                    }
                    echo '</a>';
                    echo '</li>';
                    
                    // Вторая половина меню
                    for ($i = $middle_index; $i < $menu_count; $i++) {
                        $item = $menu_items[$i];
                        echo '<li class="nav__item">';
                        echo '<a class="nav__link" href="' . esc_url($item->url) . '">' . esc_html($item->title) . '</a>';
                        echo '</li>';
                    }
                    
                    // Название сайта в конце
                    echo '<li class="nav__item nav__item_title"><span class="nav__title">' . esc_html(get_bloginfo('name')) . '</span></li>';
                    echo '</ul>';
                } else {
                    // Если ошибка получения меню, используем fallback
                    echo '<ul class="nav__list">';
                    echo '<li class="nav__item"><a class="nav__logo" href="' . esc_url(home_url('/')) . '">';
                    if (has_custom_logo()) {
                        echo get_custom_logo();
                    } else {
                        echo '<img class="header__img" src="' . esc_url(get_template_directory_uri() . '/assets/images/logo.svg') . '" alt="' . esc_attr(get_bloginfo('name')) . '">';
                    }
                    echo '</a></li>';
                    echo '<li class="nav__item nav__item_title"><span class="nav__title">' . esc_html(get_bloginfo('name')) . '</span></li>';
                    echo '</ul>';
                }
            } else {
                // Если меню не назначено, показываем базовую структуру
                echo '<ul class="nav__list">';
                echo '<li class="nav__item"><a class="nav__logo" href="' . esc_url(home_url('/')) . '">';
                if (has_custom_logo()) {
                    echo get_custom_logo();
                } else {
                    echo '<img class="header__img" src="' . esc_url(get_template_directory_uri() . '/assets/images/logo.svg') . '" alt="' . esc_attr(get_bloginfo('name')) . '">';
                }
                echo '</a></li>';
                echo '<li class="nav__item nav__item_title"><span class="nav__title">' . esc_html(get_bloginfo('name')) . '</span></li>';
                echo '</ul>';
            }
            ?>
        </nav>
    </div>
</header>

