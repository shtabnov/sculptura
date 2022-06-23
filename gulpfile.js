const gulp = require('gulp');
const pug = require('./gulp/pug');
const scss = require('./gulp/scss');
const scripts = require('./gulp/scripts');
const clean = require('./gulp/clean')
const img = require('./gulp/img');
const server = require('./gulp/server')

const watch = () => {
  gulp.watch('src/pug/**/*.pug', pug)
  gulp.watch('src/styles/**/*.scss', scss)
  gulp.watch('src/scripts/**/*.js', scripts)
}

// const dev = gulp.parallel(pug, style, move, babel);
// const img = gulp.parallel(image);
// module.exports.start = gulp.series(pug2html, style, move, babel);
// module.exports.img = gulp.series(image);
const { series, parallel } = gulp
exports.dev = series(
    clean,
    parallel(pug, scss, scripts, img),
    parallel(watch, server)
)