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
                user_posts: true
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
    const { user, business, isAdding, id } = request.body;
    functions.logger.log(`updateOrDeleteFavorites FIRED!`);
    try {
        await validateToken()
        if(isAdding) {
            const res = await prisma.user_favorite_places.create({
                data:{
                    business,
                    user,
                    created: new Date()
                },
                include:{
                    users: true
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




module.exports = {
    getUser,
    updateUser,
    updateOrDeleteFavorites,
}
