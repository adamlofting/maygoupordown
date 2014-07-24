var express = require("express");
var logfmt = require("logfmt");
var helmet = require('helmet');
// var async = require('async');

var app = express();

var cspPolicy = {
  'default-src': ["'self'", 'https://login.persona.org'],
  'script-src': ["'self'", 'https://login.persona.org'],
};

// set up handlebars view engine
var handlebars = require('express3-handlebars').create({
  defaultLayout: 'main'
});
handlebars.loadPartials();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(logfmt.requestLogger());
app.use(express.favicon());
app.use(express.urlencoded());
app.use(express.cookieParser(process.env.COOKIE_SECRET));
app.use(express.session({
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true
  },
}));
app.use(express.csrf());
app.use(function (req, res, next) {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  res.locals.token = req.csrfToken();
  next();
});
app.use(helmet.hsts()); // HTTP Strict Transport Security
app.use(helmet.xframe('deny')); // X-Frame-Options
app.use(helmet.csp(cspPolicy));
app.use(helmet.iexss());
app.use(helmet.contentTypeOptions());
app.use(helmet.hidePoweredBy());
app.use(app.router);
app.use(express.static(__dirname + '/public'));
app.use('/bower', express.static(__dirname + '/bower_components'));

// middleware to restrict access to internal routes
function restrict(req, res, next) {
  if (req.session.authorized) {
    next();
  } else {
    req.session.targetURL = req.url;
    res.redirect('/');
  }
}

// persona
require("express-persona")(app, {
  audience: process.env.HOST + ":" + process.env.PORT, // Must match your browser's address bar
  verifyResponse: function (err, req, res, email) {
    req.session.authorized = true;
    res.json({
      status: "okay",
      email: email
    });
    return;
  },
  logoutResponse: function (err, req, res) {
    if (req.session.authorized) {
      req.session.authorized = null;
    }
    res.json({
      status: "okay"
    });
  }
});

// routes
app.get('/', function (req, res) {
  var email = req.session.email;
  res.render('home', {
    currentUser: email,
    authorized: (req.session.authorized),
    message: 'home page'
  });
});

app.get('/testpage', restrict, function (req, res) {
  var email = req.session.email;
  res.render('home', {
    currentUser: email,
    authorized: (req.session.authorized),
    message: 'logged in page'
  });
});

var port = Number(process.env.PORT || 5000);

app.listen(port, function () {
  console.log("Listening on " + port);
});
