const $ = require('gulp-load-plugins')();
const argv = require('yargs').argv;
const gulp = require('gulp');
const rimraf = require('rimraf');
const router = require('front-router');
const sequence = require('run-sequence');

let isProduction = !!(argv.production);



let paths = {
    assets: [
    './client/**/*.*',
    '!./client/templates/**/*.*',
    '!./client/assets/{scss,js}/**/*.*'
  ],

    sass: [
    'client/assets/scss',
    'bower_components/foundation-apps/scss'
  ],
    foundationJS: [
    'bower_components/fastclick/lib/fastclick.js',
    'bower_components/viewport-units-buggyfill/viewport-units-buggyfill.js',
    'bower_components/tether/tether.js',
    'bower_components/hammerjs/hammer.js',
    'bower_components/angular/angular.js',
    'bower_components/angular-animate/angular-animate.js',
    'bower_components/angular-ui-router/release/angular-ui-router.js',
    'bower_components/foundation-apps/js/vendor/**/*.js',
    'bower_components/foundation-apps/js/angular/**/*.js',
    '!bower_components/foundation-apps/js/angular/app.js'
  ],
    appJS: [
    'client/assets/js/app.js'
  ]
}


gulp.task('clean', function (cb) {
    rimraf('./build', cb);
});

gulp.task('copy', function () {
    return gulp.src(paths.assets, {
            base: './client/'
        })
        .pipe(gulp.dest('./build'));
});

gulp.task('copy:templates', function () {
    return gulp.src('./client/templates/**/*.html')
        .pipe(router({
            path: 'build/assets/js/routes.js',
            root: 'client'
        }))
        .pipe(gulp.dest('./build/templates'));
});

gulp.task('copy:foundation', function (cb) {
    gulp.src('bower_components/foundation-apps/js/angular/components/**/*.html')
        .pipe($.ngHtml2js({
            prefix: 'components/',
            moduleName: 'foundation',
            declareModule: false
        }))
        .pipe($.uglify())
        .pipe($.concat('templates.js'))
        .pipe(gulp.dest('./build/assets/js'));

    gulp.src('./bower_components/foundation-apps/iconic/**/*')
        .pipe(gulp.dest('./build/assets/img/iconic/'));

    cb();
});

gulp.task('sass', function () {
    let minifyCss = $.if(isProduction, $.minifyCss());

    return gulp.src('client/assets/scss/app.scss')
        .pipe($.sass({
            includePaths: paths.sass,
            outputStyle: (isProduction ? 'compressed' : 'nested'),
            errLogToConsole: true
        }))
        .pipe($.autoprefixer({
            browsers: ['last 2 versions', 'ie 10']
        }))
        .pipe(minifyCss)
        .pipe(gulp.dest('./build/assets/css/'));
});

gulp.task('uglify', ['uglify:foundation', 'uglify:app'])

gulp.task('uglify:foundation', function (cb) {
    let uglify = $.if(isProduction, $.uglify()
        .on('error', function (e) {
            console.log(e);
        }));

    return gulp.src(paths.foundationJS)
        .pipe(uglify)
        .pipe($.concat('foundation.js'))
        .pipe(gulp.dest('./build/assets/js/'));
});

gulp.task('uglify:app', function () {
    let uglify = $.if(isProduction, $.uglify()
        .on('error', function (e) {
            console.log(e);
        }));

    return gulp.src(paths.appJS)
        .pipe(uglify)
        .pipe($.concat('app.js'))
        .pipe(gulp.dest('./build/assets/js/'));
});

gulp.task('server', ['build'], function () {
    gulp.src('./build')
        .pipe($.webserver({
            port: 5000,
            host: 'localhost',
            fallback: 'index.html',
            livereload: true,
            open: true
        }));
});

gulp.task('build', function (cb) {
    sequence('clean', ['copy', 'copy:foundation', 'sass', 'uglify'], 'copy:templates', cb);
});

gulp.task('default', ['server'], function () {
    gulp.watch(['./client/assets/scss/**/*', './scss/**/*'], ['sass']);
    gulp.watch(['./client/assets/js/**/*', './js/**/*'], ['uglify:app']);
    gulp.watch(['./client/**/*.*', '!./client/templates/**/*.*', '!./client/assets/{scss,js}/**/*.*'], ['copy']);
    gulp.watch(['./client/templates/**/*.html'], ['copy:templates']);
});