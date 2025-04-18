const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const passport = require('passport');
const authenticate = require('./authenticate');
const config = require('./config');


const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const campsiteRouter = require('./routes/campsiteRouter');
const reviewRouter = require('./routes/reviews');
const uploadRouter = require('./routes/uploadRouter');

// Mongoose Connection
const mongoose = require('mongoose');

const url = config.mongoUrl;
const connect = mongoose.connect(url, {});
connect.then(() => console.log('Connected correctly to server'),
  err => console.log(err)
);

const app = express();

app.all('*', (req, res, next) => {
  if (req.secure) {
    return next();
  } else {
    console.log(`Redirecting to: https://${req.hostname}:${app.get('secPort')}${req.url}`);
    res.redirect(301, `https://${req.hostname}:${app.get('secPort')}${req.url}`);
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/campsites', campsiteRouter);
app.use('/reviews', reviewRouter);
app.use('/imageUpload', uploadRouter);

// Passport Initialize Authentication
app.use(passport.initialize());
app.use(passport.session());

function auth(req, res, next) {
  console.log(req.user);

  if (!req.user) {
    const err = new Error('You are not Authorized!');
    err.status = 401;
    return next(err);
  } else {
    return next();
  }
}

app.use(auth);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
