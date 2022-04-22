const axios = require('axios')
const functions = require('firebase-functions');

const BASE_URI = ''
const TEN_MILES = 16000 // IN METERS
const DINING_CATEGORY_INT = '13000,10000' // the id for the Dining & Drinks category on FourSquare

const getBusinessesNearby = functions.https.onRequest(async (request, response) => {
    const {latitude, longitude} = request.body;
    functions.logger.log(`getBusinessesNearby FIRED!`);
    try {
        const {data: {results}} = await axios.get(
            `https://api.foursquare.com/v3/places/search?ll=${latitude},${longitude}&radius=${TEN_MILES}&categories=${DINING_CATEGORY_INT}&limit=50&sort=DISTANCE&exclude_all_chains=true`,
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: 'fsq3pvMlE2W7XJ7PJmVBWrx9m0nkKpCq1QTQypYOql5rnnk='
                }
            }
        )
        response.json(results);
    } catch (error) {
        functions.logger.error(`Error: ${error.message}`);
        response.json(error);
    }
});

module.exports = {
    getBusinessesNearby
}