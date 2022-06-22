const functions = require('firebase-functions');
const { PrismaClient } = require('@prisma/client')
const { validateToken } = require("../validation");
const prisma = new PrismaClient();

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
        console.log(businessCheckInCount)
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
        console.log(businessCheckInCount.map(obj => obj.business))
        const businessDataRows = businessData.map((business) => {
            const { uuid } = business;
            const checkIn = businessCheckInCount.find(checkIn => checkIn.business == uuid);
            business["userCheckIn"] = checkIn;
            return business;
        });
        const businessPosts = businessDataRows.map(obj => obj.user_posts);
        const whatsPoppinFeed = [...businessDataRows, ...businessPosts].sort((a, b) => { 
            if(b.userCheckIn && a.userCheckIn) return b.userCheckIn - a.userCheckIn; // if a doesn't have a name and b does, then put a above b
            return b.created - a.created
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