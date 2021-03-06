const functions = require('firebase-functions');
const { PrismaClient } = require('@prisma/client')
const { validateToken } = require("../validation");
const prisma = new PrismaClient();

// User Friends
const getUserFriendById = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        functions.logger.log(`body: ${request.body}`);
        const { userId, friendId } = request.body;
        const userFriend = await prisma.user_friends.findMany({
            where: {
                userId,
                friendId
            },
            include: {
                users_user_friends_friendIdTousers: true
            }
        });
        console.log(userFriend);
        const friend = userFriend.map(obj => obj.users_user_friends_friendIdTousers);
        response.json(friend);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const getUserFriends = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        functions.logger.log(`body: ${request.body}`);
        const { userId } = request.body;
        const userFriends = await prisma.user_friends.findMany({
            where: {
                userId,
                isFriend: true
            },
            include: {
                users_user_friends_friendIdTousers: true
            }
        });
        const friends = userFriends.map(obj => obj.users_user_friends_friendIdTousers);
        response.json(friends);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const getUserFriendsPaginated = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        functions.logger.log(`body: ${request.body}`);
        const { userId, take, skip } = request.body;
        const userFriends = await prisma.user_friends.findMany({
            take,
            skip,
            where: {
                userId,
                isFriend: true
            },
            include: {
                users_user_friends_friendIdTousers: true
            }
        });
        const friends = userFriends.map(obj => obj.users_user_friends_friendIdTousers);
        response.json(friends);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const deleteUserFriendship = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { userId, friendId } = request.body;
        const usersFriendship = await prisma.user_friends.deleteMany({
            where: {
                OR: [
                    {
                        userId,
                        friendId
                    },
                    {
                        friendId: userId,
                        userId: friendId
                    }
                ]
            }
        });
        response.json(usersFriendship);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

module.exports = {
    getUserFriendById,
    deleteUserFriendship,
    getUserFriends,
    getUserFriendsPaginated
}