<footer class="footer">
    <div class="footer__container">
        <div class="footer__content">
            <div class="footer__brand">
                <a class="footer__logo" href="<?php echo esc_url(home_url('/')); ?>">
                    <?php
                    if (has_custom_logo()) {
                        the_custom_logo();
                    } else {
                        echo '<img src="' . esc_url(SCULPTURA_THEME_URI . '/assets/images/logo.svg') . '" alt="' . esc_attr(get_bloginfo('name')) . '">';
                    }
                    ?>
                </a>
                <p class="footer__tagline">Студия Вашей красоты</p>
            </div>
            <div class="footer__info">
                <h3 class="footer__title">Контакты</h3>
                <div class="footer__address">
                    <address>д. Кондратово</address>
                    <address>ул. Садовое кольцо 14</address>
                    <em>вход с торца здания</em>
                </div>
            </div>
            <div class="footer__schedule">
                <h3 class="footer__title">Режим работы</h3>
                <p>с 9:00 до 21:00</p>
                <p>последняя запись до 19:00</p>
            </div>
            <div class="footer__contact">
                <h3 class="footer__title">Связаться с нами</h3>
                <a class="footer__phone" href="tel:+79638816267">+7 (963) 881-62-67</a>
                <div class="footer__social">
                    <a class="footer__social-link" href="https://vk.com/buccal59" target="_blank" rel="noopener noreferrer">
                        <img src="<?php echo esc_url(SCULPTURA_THEME_URI . '/assets/images/icon/vk-icon.svg'); ?>" alt="VK">
                        <span>Наша группа в контакте</span>
                    </a>
                </div>
            </div>
        </div>
        <div class="footer__bottom">
            <p class="footer__copyright">© <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. Все права защищены.</p>
        </div>
    </div>
</footer>

<!-- Кнопка Scroll Up -->
<div class="scroll-up">
    <svg class="scroll-up__svg" viewBox="-2 -2 52 52">
        <path class="scroll-up__path" d="M24,0 a24,24 0 0,1 0,48 a24,24 0 0,1 0,-48"></path>
    </svg>
</div>

<?php wp_footer(); ?>
</body>
</html>

