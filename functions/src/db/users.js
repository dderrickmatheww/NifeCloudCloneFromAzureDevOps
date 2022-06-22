const functions = require('firebase-functions');
const { PrismaClient } = require('@prisma/client')

const {validateToken} = require("../validation");
const prisma = new PrismaClient()


const getUser = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`getUser FIRED!`);
    const { email } = request.body;
    // const {uuid} = verifyToken(req.headers.authorization)
    try {
        await validateToken()
        const user = await prisma.users.findUnique({
            where: {
                email
            },
            include:{
                user_favorite_places: true,
                user_friends: true,
                user_check_ins: true,
                user_posts: {
                    take: 50,
                },
                user_last_visited: true,
                user_favorite_drinks: true,
                user_friends_user_friends_friendIdTousers: {
                    include:{
                        users: {
                            select:{
                                displayName: true,
                                photoSource: true
                            }
                        }
                    }
                },
            }
        })
        response.json(user);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const searchUsers = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`getUser FIRED!`);
    const { query } = request.body;
    // const {uuid} = verifyToken(req.headers.authorization)
    try {
        await validateToken()
        const users = await prisma.users.findMany({
            where: {
                OR:[
                    {
                        email:{
                            contains: query,
                            mode: 'insensitive',
                        }
                    },
                    {
                        displayName:{
                            contains: query,
                            mode: 'insensitive',
                        }
                    },
                ]

            },
        })
        response.json(users);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const getUserById = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`getUser FIRED!`);
    const { email } = request.body;
    // const {uuid} = verifyToken(req.headers.authorization)
    try {
        await validateToken()
        const user = await prisma.users.findUnique({
            where: {
                email
            },
            include:{
                user_favorite_places: true,
                user_friends: true,
                user_check_ins: true,
                user_posts: true
            }
        })
        response.json(user);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const updateUser = functions.https.onRequest(async (request, response) => {
    const { user } = request.body;
    functions.logger.log(`updateUser FIRED!`);
    try {
        await validateToken()
        const res = await prisma.users.upsert({
            where: {
                email: user.email
            },
            update: {
                ...user
            },
            create: {
                ...user
            },
            include:{
                user_favorite_places: true,
                user_friends: true,
                user_check_ins: true,
                user_posts: {
                    take: 50,
                },
                user_last_visited: true,
                user_favorite_drinks: true,
                user_friends_user_friends_friendIdTousers: {
                    include:{
                        users: {
                            select:{
                                displayName: true,
                                photoSource: true
                            }
                        }
                    }
                },
            }
        })
        response.json(res);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const updateOrDeleteFavorites = functions.https.onRequest(async (request, response) => {
    const { user, business, isAdding, id, businessName } = request.body;
    functions.logger.log(`updateOrDeleteFavorites FIRED!`);
    try {
        await validateToken()
        if(isAdding) {
            const res = await prisma.user_favorite_places.create({
                data:{
                    business,
                    businessName,
                    user,
                    created: new Date()
                }
            })
            response.json(res);
        } else {
            const res = await prisma.user_favorite_places.delete({
                where: {
                    id
                },
            })
            response.json(res);
        }
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const createCheckIn  = functions.https.onRequest(async (request, response) => {
    const { user, business, isPrivate, businessName } = request.body;
    functions.logger.log(`createCheckIn FIRED!`);
    try {
        await validateToken()
            const res = await prisma.user_check_ins.create({
                data:{
                    business,
                    user,
                    isPrivate,
                    businessName,
                    created: new Date()
                },
            })
            response.json(res);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});


const deleteCheckIn  = functions.https.onRequest(async (request, response) => {
    const { id } = request.body;
    functions.logger.log(`deleteCheckIn FIRED!`);
    try {
        await validateToken()
        const deleted = await prisma.user_check_ins.delete({
            where:{
                id
            }
        })
        const lastVisited = await prisma.user_last_visited.create({
            data:{
                business: deleted.business,
                user: deleted.user,
                isPrivate: deleted.isPrivate,
                businessName: deleted.businessName,
                created: new Date()
            },
        })
        response.json({deleted, lastVisited});
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const removeFavoriteDrink  = functions.https.onRequest(async (request, response) => {
    const { id } = request.body;
    functions.logger.log(`removeFavoriteDrink FIRED!`);
    try {
        await validateToken()
        const deleted = await prisma.user_favorite_drinks.delete({
            where:{
                id
            }
        })
        response.json({deleted});
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const addFavoriteDrink  = functions.https.onRequest(async (request, response) => {
    const { description, user } = request.body;
    functions.logger.log(`addFavoriteDrink FIRED!`);
    try {
        await validateToken()
        const drink = await prisma.user_favorite_drinks.create({
            data:{
                description, user, created: new Date()
            }
        })
        response.json({drink});
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});


module.exports = {
    getUser,
    updateUser,
    updateOrDeleteFavorites,
    addFavoriteDrink,
    removeFavoriteDrink,
    createCheckIn,
    deleteCheckIn,
    searchUsers
}
