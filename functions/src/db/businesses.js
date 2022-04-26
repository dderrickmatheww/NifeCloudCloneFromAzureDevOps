const functions = require('firebase-functions');
const { PrismaClient } = require('@prisma/client')
const {validateToken} = require("../validation");
const prisma = new PrismaClient()

const getBusiness = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`getBusiness FIRED!`);
    const { uuid } = request.body;
    try {
        await validateToken()
        const data = await prisma.businesses.findUnique({
            where: {
                uuid
            },
        })
        response.json(data);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

//TODO right TTL for checkins
const getBusinessCheckIns = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`getBusinessCheckIns FIRED!`);
    const { uuid } = request.body;
    try {
        await validateToken()
        const data = await prisma.user_check_ins.findMany({
            where: {
                business: uuid
            },
        })
        response.json(data);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

module.exports = {
    getBusinessCheckIns,
    getBusiness
}
