var express = require("express");
var logfmt = require("logfmt");
var helmet = require('helmet');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var csrf = require('csurf');
var db = require('./models');

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
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true
  },
  resave: true,
  saveUninitialized: true
}));
app.use(csrf({
  "cookie": true
}));
app.use(function (req, res, next) {
  res.locals.token = req.csrfToken();
  next();
});
app.use(helmet.hsts()); // HTTP Strict Transport Security
app.use(helmet.xframe('deny')); // X-Frame-Options
app.use(helmet.csp(cspPolicy));
app.use(helmet.iexss());
app.use(helmet.contentTypeOptions());
app.use(helmet.hidePoweredBy());

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

// more middleware to exiecute after routes
app.use(express.static(__dirname + '/public'));
app.use('/bower', express.static(__dirname + '/bower_components'));

var port = Number(process.env.PORT || 5000);

db.sequelize.sync().complete(function (err) {
  if (err) {
    throw err[0];
  } else {
    app.listen(port, function () {
      console.log("Listening on " + port);
    });
  }
});
