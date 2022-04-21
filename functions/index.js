const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()



//************ */
//User Related
//************ */

const getUser = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`body: ${request.body}`);
    const { email } = request.body;
    try {
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
        return user
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const updateUser = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`body: ${request.body}`);
    const { email } = request.body;
    try {
        const user = await prisma.users.upsert({
            where: {
                email
            },
            update: request.body,
            create: request.body,
        })
        response.json(user);
        return user
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

// eslint-disable-next-line consistent-return
const index = (req, res) => {
    switch (req.path) {
        case '/getUser':
            return getUser(req, res)
        case '/updateUser':
            return updateUser(req, res)
        default:
            res.send('function not defined')
    }
}

module.exports = {
    index,
    getUser
}