const functions = require('firebase-functions');
const { PrismaClient } = require('@prisma/client');
const {validateToken} = require("../validation");
const states = require('us-state-converter');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();
const { businessEmailTemplate } = require("../util");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

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

const updateBusiness = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`updateBusiness FIRED!`);
    const { business } = request.body;
    try {
        await validateToken()
        const res = await prisma.businesses.upsert({
            where: {
                uuid: business.uuid
            },
            update: {
                ...business
            },
            create: {
                ...business
            },
            include:{
                users: true
            }
        })
        response.json(res);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const businessesThatAreNotVerified = functions.pubsub.schedule('every 24 hours').onRun(async () => { 
    try {
        const shouldEmail = true;
        if (shouldEmail) {
            const businesses = await prisma.businesses.findMany({
                where: {
                    verified: false
                }
            });
            const columns = [
                'User Id',
                'uuid',
                'Last Modified',
                'Created',
                'Email',
                'Display Name',
                'Phone Number',
                'Latitude',
                'Longitude',
                'Owner Name',
                'Photo',
                'Last Login',
                'Business Id',
                'Address',
                'City',
                'State',
                'Zip',
                'Country',
                'Proof Of Address',
                'Business Verification Status',
                'Verification button'
            ]
            const mailOptions = businessEmailTemplate({ columns, values: businesses });
            const { error, info } = await transporter.sendMail(mailOptions);
            if (error) {
                functions.logger.error(`Business verification report email failed: ${error.message}`);
            }
            else {
                functions.logger.log(`Business verification report email sent successfully: ${info}`);
            }
        }
        else {
            await prisma.user_posts.deleteMany({
                where: {
                    verified: false
                }
            });
        }
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
    }
});

const businessesThatAreNotVerifiedTest = functions.https.onRequest(async (request, response) => { 
    try {
        const shouldEmail = true;
        if (shouldEmail) {
            const businesses = await prisma.businesses.findMany({
                where: {
                    verified: false
                }
            });
            const columns = [
                'User Id',
                'uuid',
                'Last Modified',
                'Created',
                'Email',
                'Display Name',
                'Phone Number',
                'Latitude',
                'Longitude',
                'Owner Name',
                'Photo',
                'Last Login',
                'Business Id',
                'Address',
                'City',
                'State',
                'Zip',
                'Country',
                'Proof Of Address',
                'Business Verification Status',
                'Verification button'
            ]
            const mailOptions = businessEmailTemplate({ columns, values: businesses });
            const { error, info } = await transporter.sendMail(mailOptions);
            if (error) {
                functions.logger.error(`Business verification report email failed: ${error.message}`);
                response.json(error.message);
            }
            else {
                functions.logger.log(`Business verification report email sent successfully: ${info}`);
                response.json(info);
            }
        }
        else {
            await prisma.user_posts.deleteMany({
                where: {
                    verified: false
                }
            });
        }
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
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
    updateBusiness,
    getFriendCheckIns,
    getNifeBusinessesByState,
    businessesThatAreNotVerified,
    businessesThatAreNotVerifiedTest
}
