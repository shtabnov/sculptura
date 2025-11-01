<?php
/**
 * Custom Walker для меню с поддержкой логотипа в центре
 */
class Sculptura_Walker_Nav_Menu extends Walker_Nav_Menu {

    public function start_lvl(&$output, $depth = 0, $args = null) {
        // Не используем подменю в этом дизайне
    }

    public function end_lvl(&$output, $depth = 0, $args = null) {
        // Не используем подменю в этом дизайне
    }

    public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0) {
        $indent = ($depth) ? str_repeat("\t", $depth) : '';

        $classes = empty($item->classes) ? [] : (array)$item->classes;
        $classes[] = 'nav__item';

        // Определяем, является ли элемент логотипом (по title или классу)
        $is_logo = false;
        if (in_array('logo', $classes) || strpos(strtolower($item->title), 'logo') !== false) {
            $is_logo = true;
        }

        $class_names = implode(' ', apply_filters('nav_menu_css_class', array_filter($classes), $item, $args));

        if ($is_logo) {
            // Логотип в центре меню
            $output .= $indent . '<li class="' . esc_attr($class_names) . '">';
            $output .= '<a class="nav__logo" href="' . esc_url($item->url) . '">';
            if (has_custom_logo()) {
                $output .= get_custom_logo();
            } else {
                $output .= '<img src="' . esc_url(SCULPTURA_THEME_URI . '/assets/images/logo.svg') . '" alt="' . esc_attr(get_bloginfo('name')) . '">';
            }
            $output .= '</a>';
        } else {
            // Обычная ссылка
            $output .= $indent . '<li class="' . esc_attr($class_names) . '">';
            $output .= '<a class="nav__link" href="' . esc_url($item->url) . '">';
            $output .= esc_html($item->title);
            $output .= '</a>';
        }
    }

    public function end_el(&$output, $item, $depth = 0, $args = null) {
        $output .= '</li>';
    }
}

