const gulp = require("gulp");
const pug = require("./gulp/pug");
const scss = require("./gulp/scss");
const scripts = require("./gulp/scripts");
const clean = require("./gulp/clean");
const img = require("./gulp/img");
// const fonts = require("./gulp/font");
const server = require("./gulp/server");
const deployCSS = require("./gulp/deploy-css");
const deployJS = require("./gulp/deploy-js");
const deployImages = require("./gulp/deploy-images");

const { series, parallel } = gulp;

// ============================================================================
// Основные задачи сборки
// ============================================================================
exports.pug = pug;
exports.scripts = series(scripts, deployJS);
exports.css = series(scss, deployCSS);
exports.images = series(img, deployImages);
// exports.fonts = fonts;

// ============================================================================
// Задачи только сборки (без деплоя)
// ============================================================================
exports.cssBuild = scss;
exports.jsBuild = scripts;

// ============================================================================
// Задачи с автоматическим деплоем (алиасы для ясности)
// ============================================================================
exports.cssDeploy = series(scss, deployCSS);
exports.jsDeploy = series(scripts, deployJS);
exports.pugDeploy = pug; // PUG не деплоится на WordPress, только локально

const watch = () => {
    gulp.watch("src/pug/**/*.pug", gulp.series(pug));
    gulp.watch("src/styles/**/*.scss", exports.css); // Использует задачу с деплоем
    gulp.watch("src/scripts/**/*.js", exports.scripts); // Использует задачу с деплоем
};

exports.dev = series(
    clean,
    parallel(pug, scss, scripts, img),
    parallel(watch, server)
);
