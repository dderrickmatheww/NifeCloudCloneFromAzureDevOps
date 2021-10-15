const functions = require('firebase-functions');
const admin = require('firebase-admin');
const geolib = require('geolib');
const { Expo } = require('expo-server-sdk')
const { user } = require('firebase-functions/lib/providers/auth');
const { object } = require('firebase-functions/lib/providers/storage');
admin.initializeApp();
const FieldValue = admin.firestore.FieldValue;
const db = admin.firestore();
const states = require('us-state-converter');

let expo = new Expo()

//Current User Schema
const userSchema = {
    'displayName': '',
    'email': '',
    'phoneNumber': '',
    'photoSource': '',
    'providerId': '',
    'uid': '',
    'friends': {},
    'gender': 'Unknown',
    'dateOfBirth': 'Unknown',
    'sexualOrientation': 'Unknown',
    'bio': 'None',
    'favoriteDrinks': [],
    'favoritePlaces': {},
    'providerData': {
        'displayName' : '',
        'email' : '',
        'phoneNumber' : '',
        'photoSource' : '',
        'providerId' : '',
        'uid': ''
    },
    'privacySettings': {
        'DOBPrivacy': false,
        'checkInPrivacy': false,
        'favoritingPrivacy': false,
        'genderPrivacy': false,
        'orientationPrivacy': false,
        'public': true,
        'searchPrivacy': false,
        'visitedPrivacy': false
    }
}

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

//******************************************************************************** */
//******************************************************************************** */
// Ctr+f to find functions
//
// Search terms:
//
//              User Related
//                  - VerifyUser();
//                  - GetUserData();
//
//              Buisness Related
//                  - getBusinessByUserFav();
//                  - sendVerificationEmail();
//                  
//              Location Related 
//                  - checkInCount();
//                  - TTL();
//                  - saveLocation();
//
//
//******************************************************************************** */
//******************************************************************************** */

//**************** */
//Location Related
//**************** */

exports.checkInCount = functions.https.onRequest(async (request, response) => {
  let body = JSON.parse(request.body);
  let buisnessUID = body.buisnessUID;
  let userLocation = body.userLocation;
  let dataObj = {};
  let userArr = [];
  let businessesArr = [];
  let checkInCount = {};
  let checkInArray = [];
  let userRef = await db.collection('feed').get();
  if(buisnessUID) {
      userRef.forEach(doc => {
          if(doc.data().checkIn) {
              if(doc.data().checkIn.buisnessUID == buisnessUID) {
                  userArr.push(doc.data().checkIn.buisnessUID = {
                      checkIn: doc.data().checkIn,
                      user: {
                          email: doc.data().username,
                          checkInTime: doc.data().checkIn.checkInTime,
                          privacy: doc.data().checkIn.privacy
                      }
                  });
              }
          }
      });
      response.json({result: userArr});
  }
  else {
    if(userRef.empty){
      response.json({result: 'No matching documents.'});
      return;
    }
    else {
        userRef.forEach(doc => {
            if(doc.data().checkIn && !doc.data().checkIn.address == "") {
                var withinRadius = (checkIn, userLocation, boolean) => {
                  var isWithinRadius;
                  let checkInLat = parseInt(checkIn.latAndLong.split(',')[0]);
                  let checkInLong = parseInt(checkIn.latAndLong.split(',')[1]);
                  let userLat = parseInt(userLocation.coords.latitude);
                  let userLong = parseInt(userLocation.coords.longitude);
                  if(boolean) {
                    isWithinRadius = geolib.isPointWithinRadius(
                          {
                              latitude: checkInLat,
                              longitude: checkInLong
                          }, 
                          {
                              latitude: userLat,
                              longitude: userLong
                          }, 
                          100
                      ); 
                      return isWithinRadius;
                  }
                  else {
                    isWithinRadius = geolib.isPointWithinRadius(
                          {
                              latitude: checkInLat,
                              longitude: checkInLong
                          }, 
                          {
                              latitude: userLat,
                              longitude: userLong
                          }, 
                          32187
                      ); 
                      return isWithinRadius;
                  }
                }
                if(withinRadius(doc.data().checkIn, userLocation, false)) {
                    userArr.push(doc.data().checkIn.buisnessUID = {
                        checkIn: doc.data().checkIn,
                        user: {
                            email: doc.data().username,
                            checkInTime: doc.data().checkIn.checkInTime,
                            privacy: doc.data().checkIn.privacy
                        }
                    });
                    if(!businessesArr.includes(doc.data().checkIn.buisnessUID)) {
                        businessesArr.push(doc.data().checkIn.buisnessUID);
                    }
                }
            }
        });
        businessesArr.forEach((element) => {
            checkInCount =  {
                checkedIn: 0,
                buisnessUID: element,
                users: [],
                buisnessData: null
            }
            userArr.forEach((element2) => {
              if(element2.checkIn.buisnessUID == element) {
                checkInCount['checkedIn']++;
                checkInCount['users'].push(element2.user);
                checkInCount['buisnessData'] = element2.checkIn;
              }
            });
            checkInArray.push(checkInCount);
        });
        
        checkInArray.sort(function innerSort(a, b) {
          let key = "checkedIn";
          let order = "desc";
          if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
            // property doesn't exist on either object
            return 0;
          }
          const varA = (typeof a[key] === 'string')
          ? a[key].toUpperCase() : a[key];
          const varB = (typeof b[key] === 'string')
          ? b[key].toUpperCase() : b[key];
      
          let comparison = 0;
          if (varA > varB) {
          comparison = 1;
          } else if (varA < varB) {
            comparison = -1;
          }
          return (
            (order === 'desc') ? (comparison * -1) : comparison
          );
      });
      dataObj['countData'] = checkInArray;
      response.json({result: dataObj});
    }
  }
});

exports.TTL =  functions.pubsub.schedule('every 1 hours').onRun(async () => {
    let DeletedObj = {};
    let DeletedOpts = {};
    await db.collection('feed').get()
    .then(async querySnapshot => {
        //Grabs all users
        querySnapshot.docs.map(async doc => {
            if (doc.data().lastVisited) {
                let updated1 = false;
                for (var prop in doc.data().lastVisited) {
                    let currentVisitedDateCheck = ((new Date().getTime() - (parseInt(doc.data().lastVisited[prop].checkInTime._seconds ? doc.data().lastVisited[prop].checkInTime._seconds : doc.data().lastVisited[prop].checkInTime.seconds) * 1000)) > (86400000 * 7))
                    //Checking lastVisited object for outdataed data. (x > 7 days)
                    if(currentVisitedDateCheck) {
                        await doc.ref.update({
                            ['lastVisited.' + prop]: FieldValue.delete()
                        });
                        updated1 = true;
                    }
                }
                DeletedOpts['lastVisited'] = updated1;
            }
            if (doc.data().checkIn) {
                let updated2 = false;
                let checkInDateCheck = ((new Date().getTime() - (parseInt(doc.data().checkIn.checkInTime._seconds ? doc.data().checkIn.checkInTime._seconds : doc.data().checkIn.checkInTime.seconds) * 1000)) > 86400000);
                //Checking checkedIn object for outdated data. (x > 1 days)
                if(checkInDateCheck) {
                    await doc.ref.update({
                        checkIn: FieldValue.delete()
                    });
                    updated2 = true;
                }
                DeletedOpts['checkIn'] = updated2;
            }
            DeletedObj = {
                user: doc.email,
                timeUpdated: new Date(),
                wasUpdated: DeletedOpts
            }
        });

        functions.logger.log(JSON.stringify(DeletedObj));
    })
    .catch((error) => {
        functions.logger.log('TTL errored out with a Firebase Error: ' +  error.message);
        functions.logger.log(JSON.stringify(DeletedObj));
    });
});

exports.saveLocation = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let email = body.email;
    let location = body.location;
    db.collection('users').doc(email)
    .set({ loginLocation: location }, {merge: true})
    .then(() => {
        response.json({ result: 'success' });
        functions.logger.log('saveLocation saved the location to the user object.');
    })
    .catch((error) => {
        response.json({ result: 'failed', error: error.message });
        functions.logger.log('saveLocation errored out with a Firebase Error: ' +  error.message);
    });
});

//************ */
//User Related
//************ */

exports.getUserData = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let email = body.email;
    try {
        let userRes = await db.collection('users').doc(email).get();
        let userData = userRes.data();
        if(userData) {
            db.collection('users').doc(email).set({ lastLoginAt: new Date().toUTCString() }, { merge: true });
            if(userData.isBusiness) {
                let businessRes = await db.collection('businesses').doc(email).get();
                let businessData = businessRes.data();
                if(businessData){
                    db.collection('businesses').doc(email).set({lastLoginAt: new Date().toUTCString()}, { merge: true});
                    userData['businessData'] = businessData;
                    response.json({ result: userData });
                }
                else {
                    response.json({ result: 'failed', error: 'No value for variable "buisnessData" (Typ. Object) found!' });
                    functions.logger.log('No value for variable "buisnessData" (Typ. Object) found!');
                }
            }
            else {
                let obj = {
                    requests: [],
                    acceptedFriends: [],
                    userFriends: userData.friends
                };
                let path = new admin.firestore.FieldPath('friends', email);
                let friendData = await db.collection('users').where(path, '==', true).get();
                friendData.forEach((doc) => {
                    if(doc.data())
                        obj.acceptedFriends.push(doc.data());
                })
                let reqPath = new admin.firestore.FieldPath('requests', email);
                let friendRequests = await db.collection('users').where(reqPath, '==', true).get();
                friendRequests.forEach((doc) =>{
                    if(doc.data())
                        obj.requests.push(doc.data());
                })
                userData['friendData'] = obj;
                functions.logger.log(userData);
                response.json({ result: userData });
            }
        }
        else {
            response.json({ result: 'failed', error: 'No value for variable "userData" (Typ. Object) found!' });
            functions.logger.log('No value for variable "userData" (Typ. Object) found!');
        }
    }
    catch(error) {
        response.json({ result: 'failed', error: error });
        functions.logger.log('No data found. Error: ' + error);
    }

});

exports.verifyUser = functions.https.onRequest(async (request, response) => { 
    let body = JSON.parse(request.body);
    let user = body.user;
    let email = body.email;
    let business = body.business;
    try {
        let userData = await db.collection('users').doc(email).get();
        if (userData.exists) {
            functions.logger.log('verifyUser() found an existing user object.');
            let userSchemaKeys = Object.keys(userSchema);
            let currentUserKeys = Object.keys(userData.data());
            let currentUserObj = userData.data();
            if(userSchemaKeys == currentUserKeys) {
                response.json({ result: currentUserObj });
            }
            else {
                for(i = 0; i < userSchemaKeys.length; i++) {
                    let key = userSchemaKeys[i];
                    if(typeof currentUserObj[key] == 'undefined') {
                        if(typeof userSchema[key] === 'object') {
                            currentUserObj[key] = {};
                        }
                        else if (userSchema[key] instanceof Array) {
                            currentUserObj[key] = [];
                        }
                        else if (typeof userSchema[key] === "string") {
                            currentUserObj[key] = null;
                        }
                    }
                }
                response.json({ result: currentUserObj });
            }
        }
        else {
            if(user !== undefined || user !== null) {
                let userObj = {};
                userObj['displayName'] = user.displayName ? user.displayName : "Unknown";
                userObj['email'] = user.email;
                userObj['phoneNumber'] = user.phoneNumber ? user.displayName : "Unknown";
                userObj['photoSource'] = user.photoURL ? user.photoURL : "Unknown";
                userObj['providerId'] = user.providerId ? user.providerId : "Unknown";
                userObj['uid'] = user.uid ? user.uid : "Unknown";
                userObj['friends'] = {};
                userObj['gender'] = 'Unknown';
                userObj['dateOfBirth'] = 'Unknown';
                userObj['sexualOrientation'] = 'Unknown';
                userObj['bio'] = 'None';
                userObj['favoriteDrinks'] = [];
                userObj['favoritePlaces'] = {};
                userObj['providerData'] = {
                    displayName : user.displayName ? user.displayName : "Unknown",
                    email : user.email,
                    phoneNumber : user.phoneNumber  ? user.photoURL : "Unknown",
                    photoSource : user.photoURL ? user.photoURL : "Unknown",
                    providerId : user.providerId ? user.providerId : "Unknown",
                    uid : user.uid ? user.uid : "Unknown",
                };
                userObj['privacySettings'] = {
                    DOBPrivacy: false,
                    checkInPrivacy: false,
                    favoritingPrivacy: false,
                    genderPrivacy: false,
                    orientationPrivacy: false,
                    public: true,
                    searchPrivacy: false,
                    visitedPrivacy: false
                 };
                if (business) {
                   let businessObj =  {
                       "Address": business.Address,
                       "City": business.City,
                       "State": business.State,
                       "businessEmail": business.businessEmail,
                       "businessId": business.businessId,
                       "businessName": business.businessName,
                       "businessPhone": business.businessPhone,
                       "coordinates": {
                            "latitude": business.coordinates.latitude,
                            "longitude": business.coordinates.longitude,
                        },
                        "displayName": business.businessName,
                        "email": business.email,
                        "ownerName": business.ownerName,
                        "zip": business.zip,
                        'events':[],
                        'specials':[],
                    }
                    userObj["businessId"] = business.businessId;
                    userObj["isBusiness"] = true;
                    await db.collection('businesses').doc(email).set(businessObj, { merge: true });
                    await db.collection('users').doc(email).set(userObj, { merge: true });
                    response.json({ result: userObj });
                    functions.logger.log('verifyUser created a new business object.');
                    functions.logger.log(businessObj);
                } else{
                    await db.collection('users').doc(email).set(userObj, { merge: true });
                    response.json({ result: userObj });
                    functions.logger.log('verifyUser created a new user object.');
                }
            }
        }
    }
    catch(error) {
        response.json({ result: 'failed', error: error });
        functions.logger.log('verifyUser errored out with a Firebase Error: ' +  error);
    }
});

exports.sendFriendRequestNotification =  functions.https.onRequest(async(request, response) => {
    let body = JSON.parse(request.body);
    let friendEmail = body.friendEmail;
    let user = body.user;
    try{
        let friend = await db.collection('users').doc(friendEmail).get();
        if(friend.exists){
            friend = friend.data();
            if(friend.expoPushToken){
                let message = [{
                    to:friend.expoPushToken,
                    sound: 'default',
                    body:'' + user + ' has requested to be your friend!',
                    data:{isFriendRequest: true}
                }]
                let chunks = expo.chunkPushNotifications(message);
                let tickets = [];
                // Send the chunks to the Expo push notification service. There are
                // different strategies you could use. A simple one is to send one chunk at a
                // time, which nicely spreads the load out over time:
                for (let chunk of chunks) {
                    try {
                        // eslint-disable-next-line no-await-in-loop
                        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                        response.json({ result: ticketChunk});
                        tickets.push(...ticketChunk);
                        // NOTE: If a ticket contains an error code in ticket.details.error, you
                        // must handle it appropriately. The error codes are listed in the Expo
                        // documentation:
                        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
                    } catch (error) {
                        response.json({ result: 'failed', error: error });
                    }
                }
            }
            else{
                response.json({ result: 'failed', error: 'No push token for this user' });
                functions.logger.log('Send Friend Request errored out with a Firebase Error: ' +  'No push token for this user');
            }

        }
    }
    catch(error){
        response.json({ result: 'failed', error: error });
        functions.logger.log('Send Friend Request errored out with a Firebase Error: ' +  error);
    }

});

exports.getUserFeed = functions.https.onRequest(async (request, response) => { 
    const body = JSON.parse(request.body);
    const email = body.email; //request.query.email; 
    const skip = parseInt(body.skip); //parseInt(request.query.skip);
    const take = parseInt(body.take); //parseInt(request.query.take) 
    try {
        const userData = (await db.collection('users').doc(email).get()).data();
        const userFriends = Object.keys(userData.friends).filter(friend => userData.friends[friend] == true);
        let friendUserFeed = [];
        let currentUserFeed = await db.collection("feed")
        .doc(email)
        .get()
        .then((doc) => { 
            if (doc && doc.data()) {
                let timeline = [];
                let feedData = doc.data();
                let checkIn = feedData.checkIn ? Object.keys(feedData.checkIn).length : 0;
                let lastVisited = feedData.lastVisited ? Object.keys(feedData.lastVisited).length : 0;
                let userTimeline = feedData.timeline ? feedData.timeline.length : 0;
                if (userTimeline > 0) {
                    timeline = [...timeline, ...feedData.timeline];
                }
                if (checkIn > 0) {
                    if (
                        (feedData.checkIn.privacy == "Public" || feedData.checkIn.privacy == "Friends") &&
                        feedData.checkIn.checkInTime
                    ) {
                        let obj = {
                            name: feedData.checkIn.username,
                            text: "Checked in " + (feedData.checkIn.name ? "at " + feedData.checkIn.name : "somewhere! No name provided!"),
                            time: feedData.checkIn.checkInTime,
                            image: userData.photoSource ? userData.photoSource : null,
                            status: false,
                            visited: false,
                            checkedIn: true,
                            businessUID: feedData.checkIn.buisnessUID
                        }
                        timeline.push(obj);
                    }
                }
                if (lastVisited > 0) {
                    let keys = Object.keys(feedData.lastVisited);
                    keys.forEach((key) => {
                        let visited = feedData.lastVisited[key];
                        if (visited.privacy == "Public" || visited.privacy == "Friends" ) {
                            let obj = {
                                name: visited.username,
                                text: "Visited " + (visited.name ? visited.name : "somewhere! No name provided!"),
                                time: visited.checkInTime,
                                image: userData.photoSource ? userData.photoSource : null,
                                status: false,
                                visited: true,
                                checkedIn: false,
                                businessUID: key
                            }
                            timeline.push(obj);
                        }
                    });
                }
                return timeline;
            }
            else {
                return [];
            }
        });
        if (userFriends.length > 0) {
            for (let i = 0; i < userFriends.length; i++) {
                let friend = userFriends[i];
                await db.collection("feed")
                .doc(friend)
                .get()
                .then((doc) =>  { 
                    if (doc && doc.data()) {
                        let friendData = doc.data();
                        let checkIn = friendData.checkIn ? Object.keys(friendData.checkIn).length : 0;
                        let lastVisited = friendData.lastVisited ? Object.keys(friendData.lastVisited).length : 0;
                        let friendTimeline = friendData.timeline ? friendData.timeline.length : 0;
                        if (friendTimeline > 0) {
                            friendUserFeed = [...friendUserFeed, ...friendData.timeline];
                        }
                        if (checkIn > 0) {
                            if (
                                (friendData.checkIn.privacy == "Public" || friendData.checkIn.privacy == "Friends") &&
                                friendData.checkIn.checkInTime
                            ) {
                                let obj = {
                                    name: friendData.checkIn.username,
                                    text: "Checked in " + (friendData.checkIn.name ? "at " + friendData.checkIn.name : "somewhere! No name provided!"),
                                    time: friendData.checkIn.checkInTime,
                                    image: friendData.image ? friendData.image : null,
                                    status: false,
                                    visited: false,
                                    checkedIn: true,
                                    businessUID: friendData.checkIn.buisnessUID
                                }
                                friendUserFeed.push(obj);
                            }
                        }
                        if (lastVisited > 0) {
                            let keys = Object.keys(friendData.lastVisited);
                            keys.forEach((key) => {
                                let visited = friendData.lastVisited[key];
                                if (visited.privacy == "Public" || visited.privacy == "Friends") {
                                    let obj = {
                                        name: visited.username,
                                        text: "Visited " + (visited.name ? visited.name : "somewhere! No name provided!"),
                                        time: visited.checkInTime,
                                        image: friendData.image ? friendData.image : null,
                                        status: false,
                                        visited: true,
                                        checkedIn: false,
                                        businessUID: key
                                    }
                                    friendUserFeed.push(obj);
                                }
                            });
                        }
                    }
                });
            }
        }
        let timeline = friendUserFeed.length > 0 ? [...currentUserFeed, ...friendUserFeed] : currentUserFeed;
        if (timeline.length > 0) {
            timeline = timeline.sort((a, b) => b.time - a.time);
            if (skip !== 0 && skip < timeline.length) {
                timeline = timeline.splice(skip, timeline.length);
            }
            if (take !== 0 && take < timeline.length) {
                timeline = timeline.splice(0, take);
            }
            response.json({ result: timeline });
        }
        else {
            response.json({ result: [] });
        }
    }
    catch (err) {
        response.json({ result: 'failed', error: err.message });
        functions.logger.log('getUserFeed errored out with a Firebase Error: ' +  err);
    }
});

//**************** */
//Buisness Related
//**************** */

exports.getBusinessByUserFav = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let favArr = body.favArr;
    let businessRef = db.collection('businesses');
    var businesses = []
    businessRef.where('businessId', 'in', favArr).get()
    .then((data)=>{
        data.forEach((business)=>{
            if(business && business.data()){
                businesses.push(business.data())
            }
        })
        response.json({ result: businesses });
    })
    .catch((error) => {
        response.json({ result: 'failed', error: error.message });
        functions.logger.log("Firebase Error: " + error.message);
    });
});

exports.sendVerificationEmail = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let email = body.email;
    let img = body.image;
    let uid = Math.random().toString(36).replace(/[^a-z]+/g, '')
    let mail = db.collection('mail').doc(uid);
    let html = '<h3> User/Business Email: '+email+'</h3></br>';
    html +='<h3> User Data Link: <a href="https://console.firebase.google.com/u/0/project/nife-75d60/firestore/data~2Fbusinesses~2F'+email+'"> User Data</a></h3></br>';
    html +='<h3> Business Data Link: <a href="https://console.firebase.google.com/u/0/project/nife-75d60/firestore/data~2Fusers~2F'+email+'"> Business Data</a></h3></br>';
    html +='<h3> Proof Image: </h3></br><img src="'+img+'" />'
    let messageObj =  {
        message:{
            subject:'' + email + " Proof of Address",
            html: html,
            text:'Proof link: '+ img,
            
        },
        to:"dev@nife.app", 
        bcc:["admin@nife.app"]
    }
    mail.set(messageObj, { merge: true })
    .then(() => {
        response.json({ result: "success" });
    })
    .catch((error) => {
        functions.logger.log('sendVerificationEmail "mail.set" function failed. Error Message: ' + error.message);
    });
});

exports.getNifeBusinessesNearby = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let user = body.user;
    let retBusinesses = [];
    try {
        const state = states(user.loginLocation.region.region);
        let path = new admin.firestore.FieldPath('data', 'location', 'state');
        let businessRef = db.collection('businesses').where(path, '==', state.usps).get();
        (await businessRef).forEach((bus)=>{
            if(bus.data()) {
                let data = bus.data().data
                data['photoSource'] = bus.data().photoSource;
                retBusinesses.push(data);
            }
        })

        response.json({result: retBusinesses});
    } catch (error) {
        response.json({result: 'failed', error: error});
        functions.logger.log('Send Friend Request errored out with a Firebase Error: ' + error);
    }

});

exports.isBusinessRegistered = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let businessId = body.businessId;
    try {
        const business = db.collection('businesses').where('businessId', '==', businessId).get();
        const ret = [];
        (await business).forEach((doc) => {
            if(doc.data()){
                ret.push(doc.data())
            }
        })
        const isBusinessRegistered =  ret.length > 0;
        response.json({result: isBusinessRegistered});
    } catch (error) {
        response.json({result: 'failed', error: error});
        functions.logger.log('isBusinessRegistered errored out with a Firebase Error: ' + error);
    }

});