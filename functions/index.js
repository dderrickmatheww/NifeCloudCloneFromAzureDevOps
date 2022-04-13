const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()



//************ */
//User Related
//************ */

exports.getUserData = functions.https.onRequest(async (request, response) => {
    functions.logger.error(`body: ${JSON.stringify(request.body)}`);
    let { email } = request.body;
    functions.logger.error(`Email: ${email}`);
    try {
        const user = await prisma.users.findUnique({
            where: {
                userId: 1
            }
        })
        response.json(user);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});
