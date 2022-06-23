const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;

module.exports = function server () {
    browserSync.init({
        server: {
            baseDir: "./build"
        }
    });

    gulp.watch("./build/*.html").on("change", reload);
    gulp.watch("./build/css/*.css").on("change", reload);
};