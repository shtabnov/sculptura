const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

module.exports = function scripts () {
    return gulp.src('src/scripts/*.js')
      .pipe(babel({
        presets: ['@babel/env']
      }))
      .pipe(concat('main.js'))
      .pipe(gulp.dest('build/scripts'))
      .pipe(uglify())
      .pipe(concat('main.min.js'))
      .pipe(gulp.dest('build/scripts'))
  };