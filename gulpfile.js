const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

const path =

gulp.task("default", function () {
  return gulp.src("src/**/**.js")
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.', {
      includeContent: false,
      sourceRoot: function () {
        return __dirname + '/src';
      }
    }))
    .pipe(gulp.dest("dist"));
});
