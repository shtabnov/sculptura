const gulp = require('gulp');

module.exports = function fonts () {
    return gulp.src('src/font/**/*')
      .pipe(gulp.dest('build/font'))
  }