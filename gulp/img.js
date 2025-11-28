const gulp = require("gulp");
const imagemin = require("gulp-imagemin");
const imageminSvgo = require("imagemin-svgo");
const { parallel, series } = require("gulp");

// Оптимизируем JPEG и PNG файлы
function optimizeJpegPng() {
    return gulp
        .src(
            [
                "src/images/**/*.jpg",
                "src/images/**/*.jpeg",
                "src/images/**/*.png",
            ],
            {
                base: "src/images",
                encoding: false, // Важно! Не кодируем бинарные файлы как текст
            }
        )
        .pipe(
            imagemin(
                [
                    // JPEG оптимизация (мягкие настройки, чтобы не портить файлы)
                    imagemin.mozjpeg({
                        quality: 90, // Высокое качество
                        progressive: true,
                    }),
                    // PNG оптимизация (мягкие настройки)
                    imagemin.optipng({
                        optimizationLevel: 3, // Средний уровень (не максимальный)
                    }),
                ],
                {
                    verbose: true,
                }
            )
        )
        .pipe(gulp.dest("build/images"))
        .pipe(gulp.dest("wp-theme/assets/images"));
}

// Копируем остальные файлы (gif и т.д.) БЕЗ обработки
function copyOther() {
    return gulp
        .src(
            [
                "src/images/**/*",
                "!src/images/**/*.jpg",
                "!src/images/**/*.jpeg",
                "!src/images/**/*.png",
                "!src/images/**/*.svg",
            ],
            {
                base: "src/images",
                encoding: false,
            }
        )
        .pipe(gulp.dest("build/images"))
        .pipe(gulp.dest("wp-theme/assets/images"));
}

// Оптимизируем только SVG файлы
function optimizeSvg() {
    return gulp
        .src("src/images/**/*.svg", {
            base: "src/images",
        })
        .pipe(
            imagemin(
                [
                    imageminSvgo({
                        plugins: [
                            {
                                removeViewBox: false,
                            },
                            {
                                cleanupIDs: false,
                            },
                        ],
                    }),
                ],
                {
                    verbose: true,
                }
            )
        )
        .pipe(gulp.dest("build/images"))
        .pipe(gulp.dest("wp-theme/assets/images"));
}

// Сначала оптимизируем JPEG/PNG и копируем остальные, потом оптимизируем SVG
module.exports = series(parallel(optimizeJpegPng, copyOther), optimizeSvg);
