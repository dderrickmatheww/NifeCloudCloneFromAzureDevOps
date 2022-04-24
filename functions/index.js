const { getUser, updateUser } = require('./src/users');
const { getPostById, getPosts, updatePostById, deletePostById, postsThatAreFlagged, postsThatAreFlaggedTest } = require('./src/posts');
const { getBusinessesNearby } = require('./src/yelp');

// eslint-disable-next-line consistent-return
const index = (req, res) => {
    switch (req.path) {
        //User
        case '/getUser':
            return getUser(req, res);
        case '/updateUser':
            return updateUser(req, res);
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
        default:
            res.send('function not defined');
    }
}

module.exports = {
    index,
    getUser,
    getBusinessesNearby,
    postsThatAreFlagged
}
