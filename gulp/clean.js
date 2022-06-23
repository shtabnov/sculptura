const gulp = require('gulp');
const clean = require('gulp-clean');

module.exports = function buildClean () {
  return gulp.src('./build', {read: false})
  .pipe(clean())
};