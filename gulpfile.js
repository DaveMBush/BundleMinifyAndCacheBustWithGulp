/// <binding AfterBuild='default' />
var gulp = require('gulp');
var htmlmin = require('gulp-htmlmin');
var useref = require('gulp-useref');
var gulpRename = require('gulp-rename');
var cacheBuster = require('gulp-cache-bust');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
var lazypipe = require('lazypipe');
var sourcemaps = require('gulp-sourcemaps');
var gulpif = require('gulp-if');

// compressTasks is a sub process used by useRef (below) that
// compresses (takes out white space etc) the javascript and 
// css files
var compressTasks = lazypipe()
    .pipe(sourcemaps.init, { loadMaps: true })
    .pipe(function () { return gulpif('*.js', uglify()); })
    .pipe(function() {
        return gulpif('*.css', cssnano({
                zindex: false }));
    });

// useRef looks at markers in index.debug.html and combines
// all of the files into one file.  once the files are combined
// the compressTasks process is called and then
// the files are all written out to the index directory.
gulp.task('useRef', [],function() {
    return gulp.src('index.debug.html')
        .pipe(useref({}, 
            lazypipe()
            .pipe(compressTasks)
            
            ))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('index'));
});

// minIndex takes all of the whitespace out of the 
// main index file
gulp.task('minIndex', ['useRef'], function() {
    return gulp.src('index/index.debug.html')
        .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
        .pipe(gulp.dest('index'));

});

// renameIndex renames the index file and puts it
// in the root directory
gulp.task('renameIndex', ['minIndex'], function () {
    return gulp.src('index/index.debug.html')
        .pipe(gulpRename('index/index.release.html'))
        .pipe(gulp.dest('.'));
});


gulp.task('copyJs', ['useRef'], function () {
    // copy the js and map files generated from useref to 
    // the real app directory
    return gulp.src('index/app/*.*')
        .pipe(gulp.dest('app'));
});

gulp.task('copyCss', ['useRef'], function () {
    // copy the css and map files generated from useref to 
    // the real css directory
    return gulp.src('index/css/*.*')
        .pipe(gulp.dest('css'));
});

// cacheBuster looks at the css and js files and appends a hash to the
// request to cause the file to get reloaded when the file changes.
gulp.task('cacheBuster', ['copyCss', 'copyJs', 'renameIndex'], function () {
    return gulp.src('index/index.release.html')
        .pipe(cacheBuster())
        .pipe(gulp.dest('.'));
});

// This is the kickoff process.  Only one dependency.
gulp.task('default', ['cacheBuster']);
