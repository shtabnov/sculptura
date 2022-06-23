const gulp = require('gulp');
const pug = require('gulp-pug');

module.exports = function pug2html () {
  return gulp.src('src/pug/*.pug')
    .pipe(pug({pretty: '\t'}))
    .pipe(gulp.dest('build'))
};