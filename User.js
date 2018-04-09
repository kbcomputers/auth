const mongoose = require('mongoose');
 
module.exports = function(schema) {
    return mongoose.model('User', mongoose.Schema(schema));
};