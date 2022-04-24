const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });
admin.initializeApp();
const db = admin.firestore();
const { PrismaClient } = require('@prisma/client');
const { user } = require('firebase-functions/lib/providers/auth');
const prisma = new PrismaClient();
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

//************ */
//User Related
//************ */

const getUser = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`body: ${request.body}`);
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
    functions.logger.log(`body: ${request.body}`);
    const { email } = request.body;
    // const {uuid} = verifyToken(req.headers.authorization)
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

//************ */
//Post Related
//************ */

const getPostById = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`body: ${request.body}`);
    const { postId } = request.body;
    // const {uuid} = verifyToken(req.headers.authorization)
    try {
        const userPost = await prisma.user_posts.findUnique({
            where: {
                postId
            }
        });
        response.json(userPost);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const getPosts = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`body: ${request.body}`);
    const { userId } = request.body;
    // const {uuid} = verifyToken(req.headers.authorization)
    try {
        const userPosts = await prisma.user_posts.findMany({
            where: {
                userId,
                friendId: userId
            }
        });
        response.json(userPosts);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const updatePostById = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`body: ${request.body}`);
    const { postId } = request.body;
    // const {uuid} = verifyToken(req.headers.authorization)
    try {
        const user = await prisma.user_posts.update({
            where: {
                postId
            },
            update: request.body
        });
        response.json(user);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const deletePostById = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`body: ${request.body}`);
    const { postId } = request.body;
    // const {uuid} = verifyToken(req.headers.authorization)
    try {
        const deletedPost = await prisma.user_posts.delete({
            where: {
                postId
            }
        });
        response.json(deletedPost);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const deleteAllPosts = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`body: ${request.body}`);
    // const { postId } = request.body;
    // const {uuid} = verifyToken(req.headers.authorization)
    try {
        const deletedPost = await prisma.user_posts.deleteMany({});
        response.json(deletedPost);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

const postsThatAreFlagged = functions.pubsub.schedule('every 24 hours').onRun(() => { 
    try {
        const shouldEmail = false;
        if (shouldEmail) {
            const userPosts = await prisma.user_posts.findMany({
                where: {
                    isFlagged: true
                }
            });
            const mailOptions = {
                from: `Nife Firebase Cloud Functions <${process.env.EMAIL}>`, // Something like: Jane Doe <janedoe@gmail.com>
                to: `${process.env.TOEMAIL}`,
                subject: 'Report for Flagged Posts', // email subject
                html: `<p style="font-size: 16px;">Report for flagged posts</p>
                    <br />
                    <table>
                        <tr>
                            <th>User Id</th>
                            <th>Post Id</th>
                            <th>Description</th>
                            <th>Image</th>
                            <th>Created</th>
                        </tr>
                        ${userPosts.forEach((value, index) => {
                            return `<tr>
                                <td>${value.userId}</td>
                                <td>${value.postId}</td>
                                <td>${value.description}</td>
                                <td>${value.image}</td>
                                <td>${value.created}</td>
                            </tr>`
                        })}
                    </table>`
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    functions.logger.error(`isFlagged report email errored out: ${error.message}`);
                }
                else {
                    functions.logger.log(`isFlagged report email sent!`);
                }
            });
        }
        else {
            await prisma.user_posts.deleteMany({
                where: {
                    isFlagged: !shouldEmail
                }
            });
        }
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
    }
})

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
    getUser,
    postsThatAreFlagged
}