const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const { PrismaClient } = require('@prisma/client')
const {getBusinessesNearby} = require("./fourSquare");
const prisma = new PrismaClient()



//************ */
//User Related
//************ */

const getUser = functions.https.onRequest(async (request, response) => {

    functions.logger.log(`getUser FIRED!`);
    const { email } = request.body;
    // const {uuid} = verifyToken(req.headers.authorization)
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

// eslint-disable-next-line consistent-return
const index = (req, res) => {
    switch (req.path) {
        case '/getUser':
            return  getUser(req, res)
        case '/updateUser':
            return updateUser(req, res)
        case '/getBusinessesNearby':
            return getBusinessesNearby(req, res)
        default:
            res.send('function not defined')
    }
}

module.exports = {
    index,
    getUser,
    getBusinessesNearby,
}