const functions = require("firebase-functions");
const {validateToken} = require("./validation");
const axios = require("axios");

const TEN_MILES = 16000
const YELP_PLACE_KEY = 'X7dP2JcF93aN5jY5720HwbMpkS0j3wFQeFq4egL7BagZMqD3w7MZamBCuOnxQmxsjr1oZyFc45OuhgkQSNsfeT62nDolqJPODbUiiEKfQWJbCv_gqDV16K231-JiYnYx'

const getBusinessesNearby = functions.https.onRequest(async (request, response) => {
    functions.logger.log(`getBusinessesNearby FIRED!`);
    const { latitude, longitude } = request.body;
    const url = `https://api.yelp.com/v3/businesses/search?term=bar&latitude=${latitude}&longitude=${longitude}&radius=${TEN_MILES}&sort_by=distance&limit=50`
    try {
        await validateToken();
        const {data} = await axios.get(
            url,
            {
                headers:{
                    Authorization: "Bearer " + YELP_PLACE_KEY
                }
            }
        )
        const {businesses} = data;
        response.json(businesses);
    }
    catch(error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

module.exports = {
    getBusinessesNearby
}
