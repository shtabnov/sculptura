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
            // Добавляем название сайта в конец меню
            $menu_output = '<li class="nav__item nav__item_title"><span class="nav__title">' . esc_html(get_bloginfo('name')) . '</span></li>';
            
            wp_nav_menu([
                'theme_location' => 'primary',
                'menu_class' => 'nav__list',
                'container' => false,
                'items_wrap' => '<ul class="%2$s">%3$s' . $menu_output . '</ul>',
                'walker' => new Sculptura_Walker_Nav_Menu(),
            ]);
            ?>
        </nav>
    </div>
</header>

