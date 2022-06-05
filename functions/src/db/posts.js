const functions = require('firebase-functions');
const { PrismaClient } = require('@prisma/client')
const { validateToken } = require("../validation");
const prisma = new PrismaClient();
const { postEmailTemplate, sendEmail } = require("../util");

const testLocally = process.env.LocalTesting == "true";

const getPostById = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { postId } = JSON.parse(request.body);
        const userPost = await prisma.user_posts.findUnique({
            where: {
                postId
            }
        });
        response.json(userPost);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const getPosts = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        //Need to add favorited businesses statues/events/specials into my feed
        const { userId } = request.body;
        //Grab user data
        const user = await prisma.users.findUnique({
            where: {
                id: userId
            },
            include: {
                user_posts: true,
                user_check_ins: true,
                user_last_visited: true
            }
        });
        // Set basic userInfo
        const userInfo = {
            name: user.name,
            photoSource: user.photoSource,
            displayName: user.displayName
        }
        //Grab user posts if user has posts
        const userPosts = user.user_posts.length > 0 ? user.user_posts.map((post) => {
            return {
                ...post,
                ...userInfo
            }
        }) : [];
        //Grab user last visited if user has last visited
        const userLastVisited = user.user_last_visited.length > 0 ? user.user_last_visited.map((lastVisited) => {
            return {
                ...lastVisited,
                ...userInfo,
                type: "LASTVISITED"
            }
        }) : [];
        //Grab user checkIns if user has checkins
        const userCheckIn = user.user_check_ins ? [{
            ...user.user_check_ins, 
            ...userInfo,
            type: "CHECKIN"
        }] : [];
        //Combined into an array of objects
        const userDataRows = [...userPosts, ...userLastVisited, ...userCheckIn];
        //Grab friend data
        const userFriends = await prisma.user_friends.findMany({
            where: {
                friendId: userId
            },
            include: {
                users: {
                    include: {
                        user_posts: true,
                        user_check_ins: true,
                        user_last_visited: true
                    }
                }
            }
        });
        //Combined into an array of objects
        const friendDataRows = userFriends.map(obj => obj.users).map(friend => {
            //Stores common user information
            const friendInfo = {
                name: friend.name,
                photoSource: friend.photoSource,
                displayName: friend.displayName,
            };
            //Stores friend posts if friend has posts
            const posts = friend.user_posts.length > 0 ? friend.user_posts.map((post) => {
                return {
                    ...post,
                    ...friendInfo
                }
            }) : [];
            //Stores friend last visited if friend has last visited
            const lastVisited = friend.user_last_visited.length ? friend.user_last_visited.map((lastVisited) => {
                return {
                    ...lastVisited,
                    ...friendInfo,
                    type: "LASTVISITED"
                }
            }) : [];
            //Stores friend current checkin if friend is checked in
            const checkIn = friend.user_check_ins ? [{
                ...friend.user_check_ins, 
                ...friendInfo,
                type: "CHECKIN"
            }] : [];
            //Combined into a data row
            const dataRow = [...posts, ...lastVisited, ...checkIn];
            return dataRow;
        });
        const posts = [...userDataRows, ...friendDataRows].flat().sort((a, b) => b.created - a.created);
        response.json(posts);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const getPostsPaginated = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { userId, take, skip } = request.body;
        const userFriends = await prisma.user_friends.findMany({
            where: {
                OR: [
                    {
                        userId,
                        isFriend: true,
                        isRequest: false
                    },
                    {
                        friendId: userId,
                        isFriend: true,
                        isRequest: false
                    }
                ]
            },
            include: {
                users_user_friends_friendIdTousers: {
                    include: {
                        user_posts: {
                            take,
                            skip
                        }
                    }
                }
            }
        });
        const posts = userFriends.map(obj => obj.users_user_friends_friendIdTousers).map(obj => obj.user_posts).flat().sort((a, b) => b.created - a.created);
        response.json(posts);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const updatePostById = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { postId, description, image, isFlagged } = request.body;
        const user = await prisma.user_posts.update({
            where: {
                id: postId
            },
            data: {
                description,
                image,
                isFlagged 
            }
        });
        response.json(user);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const deletePostById = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const queryParam = Object.keys(request.body).length === 0;
        let { postId } = queryParam ? request.query : request.body;
        postId = queryParam ? parseInt(postId) : postId;
        const deletedPost = await prisma.user_posts.delete({
            where: {
                id: postId
            }
        });
        if (queryParam) {
            response.json('<h1 style="text-align: center; color: green; -webkit-text-stroke: 1px black;">Post Deleted</h1>');
        }
        else {
            response.json(deletedPost);
        }
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const createPost = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { 
            description, 
            type, 
            image, 
            businessId, 
            latitude, 
            longitude, 
            userId ,
            created
        } = request.body;
        const createdPost = await prisma.user_posts.create({
            data: {
                description,
                type, 
                image, 
                businessId, 
                latitude, 
                longitude, 
                userId,
                created
            }
        });
        response.json(createdPost);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

// Cloud function that deletes all posts in the user_posts table
// const deleteAllPosts = functions.https.onRequest(async (request, response) => {
//     functions.logger.log(`body: ${request.body}`);
//     // const { postId } = request.body;
//     // const {uuid} = validateToken(req.headers.authorization)
//     try {
//         const deletedPost = await prisma.user_posts.deleteMany({});
//         response.json(deletedPost);
//     }
//     catch(error) {
//         functions.logger.error(`Error: ${error.message}`);
//         response.json(error);
//     }
// });

const postsThatAreFlaggedTest = functions.https.onRequest(async (request, response) => {
    try {
        const shouldEmail = true;
        if (shouldEmail) {
            const userPosts = await prisma.user_posts.findMany({
                where: {
                    isFlagged: '1'
                }
            });
            if (userPosts.length > 0) {
                const columns = [
                    'User Id',
                    'Post Id',
                    'Description',
                    'Image',
                    'Created',
                    'Delete Posts'
                ];
                const mailOptions = postEmailTemplate({ columns, values: userPosts });
                sendEmail({ mailOptions });
            }
            functions.logger.log(`isFlagged report email ran successfully!`);
            response.json({ result: 'success' });
        }
        else {
            await prisma.user_posts.deleteMany({
                where: {
                    isFlagged: !shouldEmail
                }
            });
        }
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json({ 
            result: {
                error: error.message
            }
        });
    }
});

const postsThatAreFlagged = functions.pubsub.schedule('every 24 hours').onRun(async () => { 
    try {
        const shouldEmail = true;
        if (shouldEmail) {
            const userPosts = await prisma.user_posts.findMany({
                where: {
                    isFlagged: '1'
                }
            });
            if (userPosts.length > 0) {
                const columns = [
                    'User Id',
                    'Post Id',
                    'Description',
                    'Image',
                    'Created',
                    'Delete Posts'
                ];
                const mailOptions = postEmailTemplate({ columns, values: userPosts });
                sendEmail({ mailOptions });
            }
            functions.logger.log(`isFlagged report email ran successfully!`);
            response.json({ result: 'success' });
        }
        else {
            await prisma.user_posts.deleteMany({
                where: {
                    isFlagged: !shouldEmail
                }
            });
        }
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json({ 
            result: {
                error: error.message
            }
        });
    }
});

module.exports = {
    getPostById,
    getPosts,
    updatePostById,
    deletePostById,
    //deleteAllPosts,
    postsThatAreFlagged,
    postsThatAreFlaggedTest,
    createPost,
    getPostsPaginated
}