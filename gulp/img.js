const gulp = require("gulp");
const imagemin = require("gulp-imagemin");

module.exports = function minImg() {
    return gulp
        .src("src/images/**/*")
        .pipe(imagemin())
        .pipe(gulp.dest("build/images"))
        .pipe(gulp.dest("wp-theme/assets/images"));
};
