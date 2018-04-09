const express = require('express')

const app = express()

const bodyParser = require("body-parser");

const passport = require('passport');

app.use(require('cookie-session')({
  name: 'session',
  keys: ["SEKRIT3", "SEKRIT2", "SEKRIT1"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
})); // Express cookie session middleware 

app.use(passport.initialize());   // passport initialize middleware

app.use(passport.session());      // passport session middleware 

app.use(require('express-flash')())

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const router = require('@kbco/router')(app);

const AuthPackage = require('../index');

const Auth = new AuthPackage(router);

const moment = require('moment')

global.User = require('../User')({
    username: String,
    password: String,
    email: {type: String, unique: true},
    created_at: Date
});

let {loginUser, registerUser} = Auth.commonExpressSetup(app, User);

Auth.setup(User, loginUser, registerUser)

Auth.routes({
    getLogin(request, response, next) {
        return 'Get Login';
    },
    getRegister(request, response, next) {
        return 'Get Register';
    },

    registerRedirect: '/login'
});

Auth.protect().get('/home', () => {
    return 'Home';
});

module.exports = app.listen(3000, () => console.log('Example app listening on port 3000!'))

