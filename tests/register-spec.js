var request = require('supertest');
var chai = require('chai');

var assert = chai.assert;

describe('loading express', () => {
    var server;
    beforeEach(function () {
        server = require('./test-server');
        user = new User({
            username: "austinkregel@gmail.com",
            password: require('bcryptjs').hashSync('password', 12),
            email:  "austinkregel@gmail.com",
            created_at: new Date()
        });
        user.save()
    });
    
    afterEach(function () {
        User.remove().exec();
        server.close();
    });
    
    it('responds to /login', (done) => {
        request(server)
            .get('/login')
            .expect(200, done)

    });
    it('responds to /register', (done) => {
        request(server)
            .get('/register')
            .expect(200, done);
    });
    it('registers a new user', (done) => {
        request(server)
            .post('/register', {
                username: 'austinkregel',
                password: 'password',
                email: 'austinkregel@gmail.com'
            })
            .expect(302)
            // .then(response => (console.log(response)))
        request(server)
            .post('/login', {
                email: 'austinkregel@gmail.com',
                password: 'password'
            })
            .expect(302, done)
    });
    
    it('has middleware intercept a desired route', (done) => {
        request(server)
            .get('/home')
            .expect(302, done)
    });
    
    it('allows authenticated users to access resources', (done) => {
        
        request(server)
            .post('/register', {
                username: 'austinkregel',
                password: 'password',
                password_confirmation: 'password',
                email: 'austinkregel@gmail.com'
            })
            .expect(302)

        request(server)
            .post('/login', {
                email: 'austinkregel@gmail.com',
                password: 'password'
            })
            .then(res => {
                assert.equal(res.text, 'Found. Redirecting to /home')
                done();
            })
            .catch(err => console.log('login', JSON.stringify(err, null, 2)))
    });
});
