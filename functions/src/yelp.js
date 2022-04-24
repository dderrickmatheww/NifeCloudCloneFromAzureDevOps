const functions = require("firebase-functions");
const { validateToken } = require("./validation");

const getBusinessesNearby = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`getBusinessesNearby FIRED!`);
    const { email } = request.body;
    // const {uuid} = verifyToken(req.headers.authorization)
    try {
        await validateToken();
        const user = await prisma.users.findUnique({
            where: {
                email
            },
            include:{
                user_favorite_places: true,
                user_friends: true,
            }
        });
        response.json(user);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

module.exports = {
    getBusinessesNearby
}
