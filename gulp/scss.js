const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));

module.exports = function scss2css() {
    return gulp
        .src("src/styles/*.scss")
        .pipe(sass())
        .pipe(gulp.dest("build/css"))
        .pipe(gulp.dest("wp-theme/assets/css"));
};
