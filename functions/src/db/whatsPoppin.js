const functions = require('firebase-functions');
const { PrismaClient } = require('@prisma/client')
const { validateToken } = require("../validation");
const prisma = new PrismaClient();

const testLocally = process.env.LocalTesting == "true";

const getWhatsPoppinFeed = functions.https.onRequest(async (request, response) => {
    try {
        // const {uuid} = validateToken(req.headers.authorization)
        const { latitude, longitude } = request.body;
        //Need to add location based query
        //Based off the latitude and longitude of the user
        const businessCheckInCount = await prisma.user_check_ins.groupBy({
            by: ['business'],
            _count: {
                user: true
            },
            orderBy: {
                _count: {
                    user: 'desc',
                },
            },
        });
        const businessData = await prisma.businesses.findMany({
            where: {
                uuid: {
                    in: businessCheckInCount.map(obj => obj.business)
                }
            },
            include: {
                business_events: true,
                user_posts: true
            }
        });
        const whatsPoppinFeed = businessData.map((business) => {
            const { uuid } = business;
            const checkIn = businessCheckInCount.find(checkIn => checkIn.business == uuid);
            business["userCheckIn"] = checkIn;
            return business;
        });
        response.json(whatsPoppinFeed);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

module.exports = {
    getWhatsPoppinFeed
}