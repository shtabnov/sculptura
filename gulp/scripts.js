const gulp = require("gulp");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const concat = require("gulp-concat");

function buildMainJs() {
    return gulp
        .src("src/scripts/*.js")
        .pipe(
            babel({
                presets: ["@babel/env"],
            })
        )
        .pipe(concat("main.js"))
        .pipe(gulp.dest("build/scripts"))
        .pipe(gulp.dest("wp-theme/assets/js"));
}

function buildMainMinJs() {
    return gulp
        .src("src/scripts/*.js")
        .pipe(
            babel({
                presets: ["@babel/env"],
            })
        )
        .pipe(uglify())
        .pipe(concat("main.min.js"))
        .pipe(gulp.dest("build/scripts"))
        .pipe(gulp.dest("wp-theme/assets/js"));
}

module.exports = gulp.parallel(buildMainJs, buildMainMinJs);
