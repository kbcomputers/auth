const passport_ = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

module.exports = class Auth {
    constructor(router) {
        this.router = router
    }
    
    check(user, password){
        return bcrypt.compareSync(password, user.password);
    }
    
    hash(password) {
        return bcrypt.hashSync(password, 12);
    }

    commonExpressSetup(app, User) {
        this.configureSessions((passport) => {
            app.use(passport.initialize());
            
            app.use(passport.session());
        
            passport.serializeUser(function(user, done) {
              done(null, user);
            });
             
            passport.deserializeUser(function(id, done) {
              User.findById(id, function(err, user) {
                done(err, user);
              });
            });
        });
        
        
        const registerUser = (req, username, password, done) => {
            let findOrCreateUser = () => {
              // find a user in Mongo with provided username
              User.findOne({'username':username}, (err, user) => {
                // In case of any error return
                if (err){
                  console.log('Error in SignUp: '+err);
                  return done(err);
                }
                // already exists
                if (user) {
                  console.log('User already exists');
                  return done(null, false, req.flash('message','User Already Exists'));
                } 
                // if there is no user with that email
                // create the user
                var newUser = new User();
                // set the user's local credentials
                newUser.username = username;
                newUser.password = this.hash(password);
                newUser.email = req.param('email');
                newUser.created_at = moment().format('YYYY-MM-DD HH:mm:ss')
         
                // save the user
                newUser.save(function(err) {
                  if (err){
                    console.log('Error in Saving user: '+err);  
                    throw err;  
                  }
                  console.log('User Registration succesful');    
                  return done(null, newUser);
                });
              });
            };
             
            // Delay the execution of findOrCreateUser and execute 
            // the method in the next tick of the event loop
        };
    
        const loginUser = (req, username, password, done) => {
            // check in mongo if a user with username exists or not
            User.findOne({ 'username' :  username }, (err, user) => {
                // In case of any error, return using the done method
                if (err) return done(err);
                // Username does not exist, log error & redirect back
                if (!user){
                    console.log('User Not Found with username ' + username);
                    return done(null, false, req.flash('message', 'User Not found.'));                 
                }
                // User exists but wrong password, log the error 
                if (!this.check(user, password)){
                    console.log('Invalid Password');
                    return done(null, false, req.flash('message', 'Invalid Password'));
                }
                // User and password both match, return user from 
                // done method which will be treated like success
                return done(null, user);
            });
        }
        // We need the user model, a login function, and a register function.
        return {
            loginUser,
            registerUser
        }
    }
    
    // This allows this developer implementing this package 
    // to configure their sessions however they please
    configureSessions(callback){
        callback(passport_);
    }
    
    // This binds the passed loginUser and register user functions to
    // passport's respective declarations
    setup(UserModel, loginUser, registerUser) {
        passport_.use(new LocalStrategy(function(request, username, password, done) {
            loginUser(request, username, password, done);
        }));

        passport_.use('signup', new LocalStrategy({ passReqToCallback: true, failureRedirect: '/register', successRedirect: '/home' }, function(req, username, password, done) {
            let nextTicketRegisterUser = function () {
                registerUser(req, username, password, done);
            };
             
            // Delay the execution of findOrCreateUser and execute 
            // the method in the next tick of the event loop
            process.nextTick(nextTicketRegisterUser);
        }));
    }
    // This binds the routes to the router object.
    routes(config) {
        if (!config.hasOwnProperty('getLogin') && typeof config.getLogin !== 'function') {
            throw new Error ("You must declare a getLogin function in your auth router config")
        }
        
        if (!config.hasOwnProperty('getRegister') && typeof config.getRegister !== 'function') {
            throw new Error ("You must declare a getRegister function in your auth router config")
        }
        
        if (!config.hasOwnProperty('registerRedirect') && typeof config.registerRedirect !== 'string') {
            throw new Error ("You must declare a registerRedirect string in your auth router config")
        }
        
        this.router.get('/login', config.getLogin);
        
        this.router.post('/login', passport_.authenticate('local', { successRedirect: '/home', failureRedirect: '/login', failureFlash: true }), (req, res) => {
            res.redirect('/home')
        });
        
        this.router.get('/register', config.getRegister);
        
        this.router.post('/register', passport_.authenticate('signup', {
            successRedirect: config.registerRedirect,
            failureRedirect: '/register',
            failureFlash : true 
        }));
    }
    // The protect middleware binding.
    protect(callback) {
        // if the callback isn't defined default to one which just makes sure 
        // someone is logged in.
        let middleware = callback ? callback : (request, response, next) => {
            if (!request.isAuthenticated())
                return response.redirect('/login');
        
            return next();
        }
        // get local this because of fucked up scope.
        let that = this;
        return {
            get(path, method) {
                that.router.get(path, method, middleware);
            },
            post(path, method) {
                that.router.post(path, method, middleware);
            },
            put(path, method) {
                that.router.put(path, method, middleware);
            },
            delete(path, method) {
                that.router.delete(path, method, middleware);
            }
        }
    }
}
