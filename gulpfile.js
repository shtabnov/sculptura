const gulp = require("gulp");
const { exec } = require("child_process");
const { promisify } = require("util");
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
const execPromise = promisify(exec);

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

// ============================================================================
// Полный деплой через scripts/deploy.js
// ============================================================================
function fullDeploy() {
    return new Promise((resolve, reject) => {
        console.log("🚀 Запуск полного деплоя через scripts/deploy.js...\n");
        const deployProcess = exec(
            "node scripts/deploy.js",
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Ошибка деплоя: ${error.message}`);
                    reject(error);
                    return;
                }
                if (stderr) {
                    console.error(stderr);
                }
                console.log(stdout);
                resolve();
            }
        );

        // Прокидываем вывод в реальном времени
        deployProcess.stdout.pipe(process.stdout);
        deployProcess.stderr.pipe(process.stderr);
    });
}

exports.deploy = fullDeploy;

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
