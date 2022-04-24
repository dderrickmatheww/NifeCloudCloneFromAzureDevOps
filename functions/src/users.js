const functions = require('firebase-functions');
const { PrismaClient } = require('@prisma/client')
const { validateToken } = require("./validation");
const prisma = new PrismaClient();


//************ */
//User Related
//************ */

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
        })
        response.json(res);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});



module.exports = {
    getUser,
    updateUser,
}
