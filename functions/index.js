const admin = require('firebase-admin');
admin.initializeApp();
const { getUser, updateUser, updateOrDeleteFavorites, createCheckIn, deleteCheckIn, removeFavoriteDrink, addFavoriteDrink } = require('./src/db/users');
const { getBusinessesNearby, searchBusinesses, getBusinessesByPhoneNumber } = require('./src/yelp');
const { 
    getBusinessCheckIns, 
    getBusiness, 
    getFriendCheckIns, 
    getNifeBusinessesByState, 
    updateBusiness, 
    businessesThatAreNotVerified, 
    businessesThatAreNotVerifiedTest, 
    verifyBusiness  
} = require("./src/db/businesses");
const { 
    getUserFriendById, 
    deleteUserFriendship, 
    getUserFriends, 
    getUserFriendsPaginated
} = require('./src/db/friends');
const { 
    getUserPendingFriendRequests, 
    getUserPendingFriendRequestsPaginated,
    getUserSentFriendRequests, 
    getUserSentFriendRequestsPaginated, 
    rejectFriendRequest, 
    createFriendRequest,
    acceptFriendRequest,
    cancelFriendRequest
} = require('./src/db/friend.requests');
const { 
    getPostById, 
    getPosts, 
    updatePostById, 
    deletePostById, 
    postsThatAreFlagged, 
    postsThatAreFlaggedTest, 
    getPostsPaginated,
    createPost
} = require('./src/db/posts');
const { 
    getWhatsPoppinFeed,
} = require('./src/db/whatsPoppin');

// eslint-disable-next-line consistent-return
// const index = (req, res) => {
//     switch (req.path) {

//         //User
//         case '/getUser':
//             return getUser(req, res);
//         case '/updateUser':
//             return updateUser(req, res);
//         case '/updateOrDeleteFavorites':
//             return updateOrDeleteFavorites(req, res);
//         case '/createCheckIn':
//             return createCheckIn(req, res);
//         case '/deleteCheckIn':
//             return deleteCheckIn(req, res);
//         case '/removeFavoriteDrink':
//             return removeFavoriteDrink(req, res)
//         case '/addFavoriteDrink':
//             return addFavoriteDrink(req, res)
//         //Post
//         case '/getPostById':
//             return  getPostById(req, res);
//         case '/getPosts':
//             return getPosts(req, res);
//         case '/getPostsPaginated':
//             return getPostsPaginated(req, res);
//         case '/updatePostById':
//             return updatePostById(req, res);
//         case '/deletePostById':
//             return deletePostById(req, res);
//         case '/postsThatAreFlaggedTest':
//             return postsThatAreFlaggedTest(req, res);
//         case '/createPost':
//             return createPost(req, res);

//         //Whats Poppin
//         case '/getWhatsPoppinFeed':
//             return getWhatsPoppinFeed(req, res);

//         //Friends
//         case '/getUserFriendById':
//             return getUserFriendById(req, res);
//         case '/getUserFriends':
//             return getUserFriends(req, res);
//         case '/getUserFriendsPaginated':
//             return getUserFriendsPaginated(req, res);
//         case '/deleteUserFriendship':
//             return deleteUserFriendship(req, res);
        
//         //Friend Requests
//         case '/getUserPendingFriendRequests':
//             return getUserPendingFriendRequests(req, res);
//         case '/getUserPendingFriendRequestsPaginated':
//             return getUserPendingFriendRequestsPaginated(req, res);
//         case '/getUserSentFriendRequests':
//             return getUserSentFriendRequests(req, res);
//         case '/getUserSentFriendRequestsPaginated':
//             return getUserSentFriendRequestsPaginated(req, res);
//         case '/rejectFriendRequest':
//             return rejectFriendRequest(req, res);
//         case '/createFriendRequest':
//             return createFriendRequest(req, res);
//         case '/acceptFriendRequest':
//                 return acceptFriendRequest(req, res);
//         case '/cancelFriendRequest':
//                 return cancelFriendRequest(req, res);

//         //Business
//         case '/getBusinessesNearby':
//             return getBusinessesNearby(req, res);
//         case '/getBusinessesByPhoneNumber':
//             return getBusinessesByPhoneNumber(req, res);
//         case '/searchBusinesses':
//             return searchBusinesses(req, res);
//         case '/getBusiness':
//             return getBusiness(req, res);
//         case '/updateBusiness':
//             return updateBusiness(req, res);
//         case '/businessesThatAreNotVerifiedTest':
//             return businessesThatAreNotVerifiedTest(req, res);
//         case '/getBusinessCheckIns':
//             return getBusinessCheckIns(req, res);
//         case '/getFriendCheckIns':
//             return getFriendCheckIns(req, res);
//         case '/getNifeBusinessesByState':
//             return getNifeBusinessesByState(req, res);
//         case '/verifyBusiness':
//             return verifyBusiness(req, res);

//         //Default 
//         default:
//             res.send('function not defined');
//     }
// }

module.exports = {
    //index,
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
    searchBusinesses,
    getFriendCheckIns,
    getPostsPaginated,
    getNifeBusinessesByState,
    getUserFriendById, 
    deleteUserFriendship, 
    getUserFriends, 
    getUserFriendsPaginated,
    getUserPendingFriendRequests, 
    getUserPendingFriendRequestsPaginated,
    getUserSentFriendRequests, 
    getUserSentFriendRequestsPaginated, 
    rejectFriendRequest, 
    createFriendRequest,
    acceptFriendRequest,
    cancelFriendRequest,
    updateBusiness, 
    businessesThatAreNotVerified, 
    businessesThatAreNotVerifiedTest, 
    verifyBusiness,
    getBusinessesByPhoneNumber,
    getWhatsPoppinFeed,
    removeFavoriteDrink, 
    addFavoriteDrink,
    createPost
}
