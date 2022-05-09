const functions = require('firebase-functions');
const { PrismaClient } = require('@prisma/client')
const {validateToken} = require("../validation");
const states = require('us-state-converter')
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
            include:{
                business_events: true
            }
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

const getFriendCheckIns = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`getFriendCheckIns FIRED!`);
    const { friends, business } = request.body;
    try {
        await validateToken()
        const checkIns = await prisma.user_check_ins.findMany({
            where: {
                user: { in: friends },
                isPrivate: false
            },
            include:{
                users: {
                    select: {
                        displayName: true,
                        photoSource: true
                    }
                }
            }
        })
        const lastVisited = await prisma.user_last_visited.findMany({
            where: {
                user: { in: friends },
                isPrivate: false
            },
            include:{
                users: {
                    select: {
                        displayName: true,
                        photoSource: true
                    }
                }
            }
        })
        response.json({checkIns, lastVisited});
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const getNifeBusinessesByState = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`getNifeBusinessesByState FIRED!`);
    let { state } = request.body;
    state = states.abbr(state);
    try {
        await validateToken()
        const businesses = await prisma.businesses.findMany({
            where: {
                state
            },
        })
        response.json(businesses);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

module.exports = {
    getBusinessCheckIns,
    getBusiness,
    getFriendCheckIns,
    getNifeBusinessesByState
}
