const functions = require('firebase-functions');
const { PrismaClient } = require('@prisma/client')
const { validateToken } = require("../validation");
const prisma = new PrismaClient();

const testLocally = process.env.LocalTesting == "true";

// Friend requests

const createFriendRequest = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { userId, friendId } = request.body;
        let userFriendship;
        const friendship = await prisma.user_friends.findFirst({
            where: {
                userId,
                friendId
            }
        });
        if (friendship) {
            const friendshipId = friendship.id;
            userFriendship = await prisma.user_friends.update({
                where: {
                    id: friendshipId
                },
                data: { 
                    userId,
                    friendId,
                    isRequest: true,
                    isFriend: false,
                    lastModified: new Date()
                }
            });
        }
        else {
            userFriendship = await prisma.user_friends.create({
                data: {
                    userId,
                    friendId,
                    isRequest: true,
                    created: new Date()
                }
            });
        }
        response.json(userFriendship);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const acceptFriendRequest = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { userId, friendId } = request.body;
        const usersFriendship = await prisma.user_friends.findFirst({
            where: {
                userId,
                friendId,
                isRequest: true
            }
        });
        if (!usersFriendship) {
            const user = [{
                userId: `${userId} NOT FOUND`
            }];
            response.json(user);
            return;
        }
        let friend;
        const friendsFriendship = await prisma.user_friends.findFirst({
            where: {
                friendId: userId,
                userId: friendId
            }
        });
        const user = await prisma.user_friends.update({
            where: {
                id: usersFriendship.id
            },
            data: {
                isRequest: false,
                isFriend: true,
                lastModified: new Date()
            }
        });
        console.log(friendsFriendship);
        if (friendsFriendship) {
            const friendshipId = friendsFriendship.id;
            friend = await prisma.user_friends.update({
                where: {
                    id: friendshipId
                },
                data: {
                    friendId: userId,
                    userId: friendId,
                    isRequest: false,
                    isFriend: true,
                    lastModified: new Date()
                }
            });
        }
        else {
            friend = await prisma.user_friends.create({
                data: {
                    friendId: userId,
                    userId: friendId,
                    isRequest: false,
                    isFriend: true,
                    created: new Date()
                }
            });
        }
        const userFriendship = { user, friend };
        response.json(userFriendship);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const rejectFriendRequest = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { userId, friendId } = request.body;
        const usersFriendship = await prisma.user_friends.findFirst({
            where: {
                userId,
                friendId,
                isRequest: true
            }
        });
        if (!usersFriendship) {
            const user = [{
                id: `${userId} NOT FOUND`
            }];
            response.json(user);
            return;
        }
        let friend;
        const friendsFriendship = await prisma.user_friends.findFirst({
            where: {
                friendId: userId,
                userId: friendId
            }
        });
        const user = await prisma.user_friends.update({
            where: {
                id: usersFriendship.id
            },
            data: {
                isRequest: false,
                isFriend: false
            }
        });
        console.log(friendsFriendship);
        if (friendsFriendship) {
            const friendshipId = friendsFriendship.id;
            friend = await prisma.user_friends.update({
                where: {
                    id: friendshipId
                },
                data: {
                    friendId: userId,
                    userId: friendId,
                    isRequest: false,
                    isFriend: false,
                    lastModified: new Date()
                }
            });
        }
        else {
            friend = await prisma.user_friends.create({
                data: {
                    friendId: userId,
                    userId: friendId,
                    isRequest: false,
                    isFriend: false,
                    created: new Date()
                }
            });
        }
        const userFriendship = { friend, user };
        response.json(userFriendship);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const cancelFriendRequest = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { userId, friendId } = request.body;
        const usersFriendship = await prisma.user_friends.findFirst({
            where: {
                userId,
                friendId,
                isRequest: true
            }
        });
        if (!usersFriendship) {
            const user = [{
                id: `${userId} NOT FOUND`
            }];
            response.json(user);
            return;
        }
        const user = await prisma.user_friends.delete({
            where: {
                id: usersFriendship.id
            }
        });
        response.json(user);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const getUserSentFriendRequests = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { userId } = request.body;
        const sentFriendRequests = await prisma.user_friends.findMany({
            where: {
                userId,
                isRequest: true
            },
        });
        response.json(sentFriendRequests);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const getUserSentFriendRequestsPaginated = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { userId, take, skip } = request.body;
        const sentFriendRequests = await prisma.user_friends.findMany({
            take,
            skip,
            where: {
                userId,
                isRequest: true
            },
        });
        response.json(sentFriendRequests);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const getUserPendingFriendRequests = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { userId } = request.body;
        const pendingFriendRequest = await prisma.user_friends.findMany({
            where: {
                friendId: userId,
                isRequest: true
            },
        });
        response.json(pendingFriendRequest);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const getUserPendingFriendRequestsPaginated = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { userId, skip, take } = request.body;
        const pendingFriendRequest = await prisma.user_friends.findMany({
            skip,
            take,
            where: {
                friendId: userId,
                isRequest: true
            },
        });
        response.json(pendingFriendRequest);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

module.exports = {
    getUserPendingFriendRequests,
    getUserPendingFriendRequestsPaginated,
    getUserSentFriendRequests,
    getUserSentFriendRequestsPaginated,
    rejectFriendRequest,
    createFriendRequest,
    acceptFriendRequest,
    cancelFriendRequest
}