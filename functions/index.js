const functions = require('firebase-functions');
const admin = require('firebase-admin');
const geolib = require('geolib');
const { user } = require('firebase-functions/lib/providers/auth');
admin.initializeApp();
const FieldValue = admin.firestore.FieldValue;
const db = admin.firestore();;

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.checkInCount = functions.https.onRequest(async (request, response) => {
  let body = JSON.parse(request.body);
  let buisnessUID = body.buisnessUID;
  let userLocation = body.userLocation;
  let dataObj = {};
  let userArr = [];
  let businessesArr = [];
  let checkInCount = {};
  let checkInArray = [];
  let userRef = await db.collection('users').get();
  if(buisnessUID) {
      userRef.forEach(doc => {
          if(doc.data().checkIn) {
              if(doc.data().checkIn.buisnessUID == buisnessUID) {
                  userArr.push(doc.data().checkIn.buisnessUID = {
                      checkIn: doc.data().checkIn,
                      user: {
                          email: doc.data().email,
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
                            email: doc.data().email,
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

exports.checkInTTL = functions.firestore.document('users/{email}')
.onWrite(async (change, context) => { 
    if(change.before.data().checkIn && change.after.data().checkIn != change.before.data().checkIn) {
        //Setting DB and context variables
        let db = admin.firestore();
        let email = context.params.email;
        //Grabbing specific properties from user object
        let currentVisited = change.before.data().lastVisited;
        let currentCheckedIn = change.before.data().checkIn;
        //Setting reference
        let userRef = db.collection('users').doc(email);
        //Setting log object for Cloud Functions logs
        let deletedObj = {};
        deletedObj['lastVisited'];
        deletedObj['checkIn'];
        //Checking currentVisited object for outdated data
        for(var prop in currentVisited) {
            if(currentVisited && currentVisited.checkInTime) {
                let currentVisitedDateCheck = (new Date().getTime() - parseInt(currentVisited[prop].checkInTime._seconds) > 86400)
                if(currentVisitedDateCheck) {
                    await userRef.update({
                        ['lastVisited.' + prop]: FieldValue.delete()
                    });
                    deletedObj.lastVisited[prop];
                }
            }
        }
        if(currentCheckedIn && currentCheckedIn.checkInTime) {
            let checkInDateCheck = (new Date().getTime() - parseInt(currentCheckedIn.checkInTime._seconds) > 86400)
            //Checking currentCheckedIn object for outdated data
            if(checkInDateCheck) {
                await userRef.update({
                    checkIn: FieldValue.delete()
                });
                deletedObj.checkIn = {
                    updated: true
                }
            }
            else {
                deletedObj.checkIn = {
                    updated: false
                }
            }
        }
        functions.logger.log("lastVisitedTTL has deleted buisnessUID: " + deletedObj);
    }
    else {
        functions.logger.log("checkIn property of the user object, was not changed. TTL check was not ran.");
    }
});

exports.verifyUser = functions.https.onRequest(async (request, response) => { 
    let body = JSON.parse(request.body);
    let user = body.user;
    let email = body.email;
    db.collection('users').doc(email).get()
    .then(async (data) => {
        if(data.data()){
            functions.logger.log('verifyUser found a existing user object.');
            response.json({ result: data.data() });
        }
        else {
            if(user != undefined || user != null) {
                let userObj = {};
                userObj['displayName'] = user.displayName;
                userObj['email'] = user.email;
                userObj['phoneNumber'] = user.phoneNumber;
                userObj['photoSource'] = user.photoURL;
                userObj['providerId'] = user.providerId ? user.providerId : "";
                userObj['uid'] = user.uid;
                userObj['providerData'] = {
                    displayName : user.displayName,
                    email : user.email,
                    phoneNumber : user.phoneNumber,
                    photoSource : user.photoURL,
                    providerId : user.providerId ? user.providerId : "",
                    uid : user.uid,
                }
                userObj['privacySettings'] = {
                    DOBPrivacy:false,
                    checkInPrivacy:false,
                    favoritingPrivacy:false,
                    genderPrivacy:false,
                    orientationPrivacy:false,
                    public:true,
                    searchPrivacy:false,
                    visitedPrivacy:false
                 };
                db.collection('users').doc(email).set(userObj, { merge: true });
                response.json({ result: userObj });
                functions.logger.log('verifyUser created a new user object.');
            }
        }
    })
    .catch((err) => {
        response.json({ result: 'failed', error: err });
        functions.logger.log('verifyUser errored out with a Firebase Error: ' +  err);
    })
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
        response.json({ result: 'failed', error: error });
        functions.logger.log('saveLocation errored out with a Firebase Error: ' +  error);
    });
});

exports.getUserData = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let email = body.email;
    db.collection('users').doc(email).get()
    .then((data) => {
      if(data.data()){
        db.collection('users').doc(email)
        .set({ lastLoginAt: new Date().toUTCString() }, { merge: true });
        response.json({ result: data.data() });
      }
      else {
        response.json({ result: {} });
        functions.logger.log('No data found. Error: ' + error);
      }
    })
    .catch((error) => {
        response.json({ result: 'failed', error: error });
        functions.logger.log("Firebase Error: " + error);
    });
});

exports.getBusinessData = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let email = body.email;
    db.collection('businesses').doc(email).get()
   .then((data) => {
        if(data.data()){
            db.collection('businesses').doc(email).set({lastLoginAt: new Date().toUTCString()}, { merge: true});
            response.json({ result: data.data() });
        }
        else {
            response.json({ result: {} });
            functions.logger.log("Firebase Error: " + error);
        }
  })
  .catch((error) => {
    response.json({ result: 'failed', error: error });
    functions.logger.log("Firebase Error: " + error);
  });
});

exports.getFriends = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let email = body.email;
    let friendsArr = [];
    var path = new admin.firestore.FieldPath('friends', email);
    let docRef = db.collection('users').where(path, '==', true);
    docRef.get().then((friends) => {
        friends.forEach(function(friend) {
            if(friend && friend.data()) {
                friendsArr.push(friend.data());
            }
        });
        response.json({ result: friendsArr });
    })
    .catch((error) => {
        response.json({ result: 'failed', error: error });
        functions.logger.log("Firebase Error: " + error);
    });
})

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
        response.json({ result: 'failed', error: error });
        functions.logger.log("Firebase Error: " + error);
    });
})

exports.filterFriends = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let userFriends = body.userFriends;
    let usersThatRequested = body.usersThatRequested;
    let obj = {
        requests: [],
        acceptedFriends: []
    }
    if(userFriends){
        let keys = Object.keys(userFriends);
        keys.forEach(function(key){
            if(userFriends[key] == null){
            usersThatRequested.forEach((user)=>{
                if(key == user.email){
                obj.requests.push(user);
                }
            });
            }
            if(userFriends[key] == true){
            usersThatRequested.forEach((user)=>{
                if(key == user.email){
                obj.acceptedFriends.push(user);
                }
            });
            }
        });
    }
    response.json({ result: obj });
})

// exports.onFavorite = functions.firestore.document('users/{email}')
// .onWrite(async (change, context) => { 
//     if(change.before.data().favoritePlaces && change.after.data().favoritePlaces != change.before.data().favoritePlaces) {
//         //Setting DB and context variables
//         let db = admin.firestore();
//         let before = change.before.data().favoritePlaces; 
//         let after = change.after.data().favoritePlaces;
//         let beforeBarsIds = Object.keys(before);
//         let afterBarsIds = Object.keys(after);
//         //if favorited, add to bar tally
//             //if favorited first time
//             beforeBarsIds.forEach((beforeId)=>{
//                 afterBarsIds.forEach((afterId)=>{
//                     if(!before[afterId]){
//                         UpdateTally(afterId);
//                     }
//                 });
//             });
//             //if favorited previously

//         //if unfavorited, remove from bar tally
//             //if unfavorited first time
//             //if unfavorited previously
        
//     }
//     else {
//         functions.logger.log("checkIn property of the user object, was not changed. TTL check was not ran.");
//     }

//     function UpdateTally(busId){
//         let busRef = db.collection('businesses').where('')
//         let userRef = db.collection('users');
//         userFavPath =  new admin.firestore.FieldPath('favoritePlaces', busId);
//         var tally = 0;
//         userRef.where(userFavPath, '==', true).get()
//         .then((data)=>{
//             if(data){
//                 tally = data.length;
//                 busRef.where()
//             } else {
                
//             }
//         })
//     }
// });

// exports.friendRequestNotification = functions.firestore.document('users/{email}')
// .onWrite(async (change, context) => { 
//     if(change.before.data().friends && change.after.data().friends != change.before.data().friends) {
//         //Setting DB and context variables
//         let db = admin.firestore();
        
//     }
//     else {
//         functions.logger.log("checkIn property of the user object, was not changed. TTL check was not ran.");
//     }
// });

