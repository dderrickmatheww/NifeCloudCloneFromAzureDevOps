const admin = require('firebase-admin');
admin.initializeApp();
const {getUser, updateUser} = require('./src/users')
const {getBusinessesNearby} = require('./src/yelp')


// eslint-disable-next-line consistent-return
const index = (req, res) => {
    switch (req.path) {
        case '/getUser':
            return  getUser(req, res)
        case '/updateUser':
            return updateUser(req, res)
        case '/getBusinessesNearby':
            return getBusinessesNearby(req, res)
        default:
            res.send('function not defined')
    }
}

module.exports = {
    index,
    getUser,
    getBusinessesNearby,
}
