const { getPostById, getPosts, updatePostById, deletePostById, postsThatAreFlagged, postsThatAreFlaggedTest } = require('./src/db/posts');
const admin = require('firebase-admin');
admin.initializeApp();
const {getUser, updateUser, updateOrDeleteFavorites, createCheckIn, deleteCheckIn} = require('./src/db/users')
const {getBusinessCheckIns, getBusiness} = require("./src/db/businesses");
const {getBusinessesNearby, searchBusinesses} = require('./src/yelp')


// eslint-disable-next-line consistent-return
const index = (req, res) => {
    switch (req.path) {
        //User
        case '/getUser':
            return getUser(req, res);
        case '/updateUser':
            return updateUser(req, res);
        case '/updateOrDeleteFavorites':
            return updateOrDeleteFavorites(req, res)
        case '/createCheckIn':
            return createCheckIn(req, res)
        case '/deleteCheckIn':
            return deleteCheckIn(req, res)
        //Post
        case '/getPostById':
            return  getPostById(req, res);
        case '/getPosts':
            return getPosts(req, res);
        case '/updatePostById':
            return updatePostById(req, res);
        case '/deletePostById':
            return deletePostById(req, res);
        case '/postsThatAreFlaggedTest':
            return postsThatAreFlaggedTest(req, res);
        //Business
        case '/getBusinessesNearby':
            return getBusinessesNearby(req, res);
        case '/searchBusinesses':
            return searchBusinesses(req, res);
        case '/getBusiness':
            return getBusiness(req, res)
        case '/getBusinessCheckIns':
            return getBusinessCheckIns(req, res)
        default:
            res.send('function not defined');
    }
}

module.exports = {
    index,
    getUser,
    updateUser,
    getBusinessesNearby,
    postsThatAreFlagged,
    getBusinessCheckIns,
    getBusiness,
    updateOrDeleteFavorites,
    createCheckIn,
    deleteCheckIn,
    getPostById,
    getPosts,
    updatePostById,
    deletePostById,
    postsThatAreFlaggedTest,
    searchBusinesses
}
