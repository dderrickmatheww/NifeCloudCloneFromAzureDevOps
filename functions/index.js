const functions = require('firebase-functions');
const admin = require('firebase-admin');
const geolib = require('geolib');
const { user } = require('firebase-functions/lib/providers/auth');
const XMLHttpRequest = require("xhr2");
admin.initializeApp();
const FieldValue = admin.firestore.FieldValue;
const db = admin.firestore();;

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
//                  - checkInTTL();
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

//************ */
//User Related
//************ */

exports.getUserData = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let email = body.email;
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
                response.json({ result: {} });
                functions.logger.log("Firebase Error: " + error);
            }
        }
        else {
            var path = new admin.firestore.FieldPath('friends', email);
            let docRef = db.collection('users').where(path, '==', true);
            let friends = await docRef.get();
            let obj = {
                requests: [],
                acceptedFriends: [],
                friendsArr: [],
                userFriends: userData.friends
            }

            friends.forEach((friend) => {
                if(friend && friend.data()) {
                    obj.friendsArr.push(friend.data());
                }
            });

            if(obj.userFriends) {
                let keys = Object.keys(obj.userFriends);
                keys.forEach((key) => {
                    if(obj.userFriends[key] == null){
                        obj.friendsArr.forEach((user) => {
                            if(key == user.email){
                                obj.requests.push(user);
                            }
                        });
                    }
                    if(obj.userFriends[key] == true){
                        obj.friendsArr.forEach((user) => {
                            if(key == user.email){
                                obj.acceptedFriends.push(user);
                            }
                        });
                    }
                });
            }
            userData['friendData'] = obj;
            response.json({ result: userData });
        }
    }
    else {
        response.json({ result: {} });
        functions.logger.log('No data found. Error: ' + error);
    }
});

exports.verifyUser = functions.https.onRequest(async (request, response) => { 
    let body = JSON.parse(request.body);
    let user = body.user;
    let email = body.email;
    try {
        if((await db.collection('users').doc(email).get()).exists){
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
    }
    catch(err) {
        response.json({ result: 'failed', error: err });
        functions.logger.log('verifyUser errored out with a Firebase Error: ' +  err);
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
        response.json({ result: 'failed', error: error });
        functions.logger.log("Firebase Error: " + error);
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
    .catch((e) => {
        functions.logger.log('sendVerificationEmail "mail.set" function failed. Error Message: ' + e.message);
    });
})


