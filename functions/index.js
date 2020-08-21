const functions = require('firebase-functions');
const admin = require('firebase-admin');
const geolib = require('geolib');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.checkInCount = functions.https.onRequest(async (request, response) => {
  let body = JSON.parse(request.body);
  let buisnessUID = body.buisnessUID;
  let userLocation = body.userLocation;
  let db = admin.firestore();
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
                  let withinRadius;
                  let checkInLat = parseInt(checkIn.latAndLong.split(',')[0]);
                  let checkInLong = parseInt(checkIn.latAndLong.split(',')[1]);
                  let userLat = parseInt(userLocation.coords.latitude);
                  let userLong = parseInt(userLocation.coords.longitude);
                  if(boolean) {
                      return withinRadius = geolib.isPointWithinRadius(
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
                  }
                  else {
                      return withinRadius = geolib.isPointWithinRadius(
                          {
                              latitude: checkInLat,
                              longitude: checkInLong
                          }, 
                          {
                              latitude: userLat,
                              longitude: userLong
                          }, 
                          32000
                      ); 
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

exports.lastVisitedTTL = functions.firestore.document('users/{email}')
.onWrite((snap, context) => { 
    var currentData = snap.after.get('lastVisted');
    let db = admin.firestore();
    let email = context.params.email;
    for(var prop in currentData) {
        if(new Date(currentData[prop].checkInTime).getTime() < new Date().getTime() - 86400000) {
            db.collection("users").doc(email+'/lastVisited/'+prop).delete();
        }
    }
});