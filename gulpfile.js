const gulp = require("gulp");
const pug = require("./gulp/pug");
const scss = require("./gulp/scss");
const scripts = require("./gulp/scripts");
const clean = require("./gulp/clean");
const img = require("./gulp/img");
const server = require("./gulp/server");
const deployCSS = require("./gulp/deploy-css");
const deployJS = require("./gulp/deploy-js");

// const dev = gulp.parallel(pug, style, move, babel);
// const img = gulp.parallel(image);
// module.exports.start = gulp.series(pug2html, style, move, babel);
// module.exports.img = gulp.series(image);
const { series, parallel } = gulp;

// Отдельные задачи для scripts, css и images
exports.pug = pug;
exports.scripts = series(scripts, deployJS); // Автоматический деплой после сборки
exports.css = series(scss, deployCSS); // Автоматический деплой после сборки
exports.images = img;

// Задачи только сборки (без деплоя) - если нужны
exports.cssBuild = scss;
exports.jsBuild = scripts;

// Задачи с автоматическим деплоем (дубликаты для ясности)
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
