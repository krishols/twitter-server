// using https://www.freecodecamp.org/news/how-to-create-a-react-app-with-a-node-backend-the-complete-guide/
// server/index.js


const multer = require("multer");
const express = require("express");
const fbasadmin = require("firebase-admin/app");
var firebase = require('firebase-admin');
const path = require("path");

const { initializeApp } = require("firebase/app");
const cors = require("cors");
var serviceAccount = require("./serviceAccountKey.json");
var axios = require("axios");
const e = require("express");
const {
  ref,
  uploadBytes,
  listAll,
  deleteObject,
  getStorage,
  getDownloadURL
} = require("firebase/storage");



firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://nd-twitter-ccd8b-default-rtdb.firebaseio.com"
});

const firebaseConfig = {
  apiKey: "AIzaSyDsTwpF6i8DkPg9OOSYqRmoxkZ8wWQMqUA",
  authDomain: "nd-twitter-ccd8b.firebaseapp.com",
  databaseURL: "https://nd-twitter-ccd8b-default-rtdb.firebaseio.com",
  projectId: "nd-twitter-ccd8b",
  storageBucket: "nd-twitter-ccd8b.appspot.com",
  messagingSenderId: "538925359851",
  appId: "1:538925359851:web:b4fbf71999f9890ae514ae"
};

// Initialize Firebase
 //axios.defaults.baseURL = 'https://cpeg-1.herokuapp.com/';
const fb = initializeApp(firebaseConfig);

let myStorage = getStorage(fb);
// multer
const memoStorage = multer.memoryStorage();
const upload = multer({ memoStorage });

let database = firebase.database();
//let myStorage = firebase.storage();
const PORT = process.env.PORT || 3001;

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
a//pp.use(express.static(path.join(__dirname, 'client/build')));
//use cors to allow cross origin resource sharing
/*
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested, Content-Type, Accept Authorization"
  )
  if (req.method === "OPTIONS") {
    res.header(
      "Access-Control-Allow-Methods",
      "POST, PUT, PATCH, GET, DELETE"
    )
    return res.status(200).json({})
  }
  next()
})
*/
app.use(cors());
//app.options('*', cors());

app.get("/api", (req, res) => {
  res.json({ message: "Uwu from server!" });
});

app.get('/users', (req, res) => {
  var dbRef = firebase.database().ref();
  dbRef.child('users').get().then((snapshot) => {
    if (snapshot.exists()) {
      res.json(snapshot);
      res.end();
    }
  })
});

app.get('/users/:id', (req, res) => {
  var dbRef = firebase.database().ref();
  console.log(req.params.id);
  dbRef.child('users').child(req.params.id).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.json(snapshot);
      //  const path = '/users/' + req.params.id;
      //   res.redirect(path);
      res.end();
    };
  });
});



app.get("/users/:id/following", (req, res) => {
  // at some point i need to do this consistently lol
  var user = req.params.id;
  var dbRef = firebase.database().ref();
  
  console.log("Trying");
  //get list of accounts user is following
  var tweets = [];
  dbRef.child('users').child(user).child('following').get().then((snapshot) => {
    if (snapshot.exists()) {
      var following = (Object.keys(snapshot.val()));


      res.json(following);
      res.end();
    }})
    .catch((error) => console.log(error.message));

  });

app.get("/users/:id/tweets", (req, res) => {
  var user = req.params.id;
  var dbRef = firebase.database().ref();
  dbRef.child('users').child(user).child('tweets').get().then((snapshot) => {
    if (snapshot.exists())
 {
    res.json(snapshot.val());
    res.end();
 }  });
});




/*
      for (const account of following) {
        dbRef.child('users').child(account).child('tweets').get().then((mysnapshot) => {
          ;
          var gotTweets = mysnapshot.val();

          for (const time in gotTweets) {
            const tweetData = { [time]: gotTweets[time] }

            tweets.push(tweetData);
            
           console.log(tweets);
          }
        })
      }
  //  console.log(tweets);
  */
    




app.post('/users/:id/add-tweet', (req, res) => {

  var currentUsername = req.body.username;

  var nowSec = req.body.time;
  var draftContent = req.body.content;
  var userpfp = req.body.pfp;

  var dbRef = firebase.database().ref();
  var tweetBody = {
    username: currentUsername,
    content: draftContent,
    pfp: userpfp,
    likes: 0
  };
  dbRef.child('users').child(currentUsername).get().then((snapshot) => {
    if (snapshot.exists()) {

      database.ref("users/" + currentUsername + "/tweets/" + nowSec).set(tweetBody, function (error) {
        if (error) {
          console.log("Failed to send tweet with error: " + error);
        }
        else {
          console.log("Successfully sent tweet.");
          res.end();
        }
      })
    }
  });
});


app.post('/newuser', (req, res) => {


  var username = req.body.username;
  var dbRef = firebase.database().ref();
  dbRef.child('users').child(username).get().then((snapshot) => {
    if (snapshot.exists()) {
      console.log("Username already exists");
    } else {
      database.ref("users/" + username).set(req.body, function (error) {
        if (error) {
          console.log("Failed with error: " + error);
        }
        else {
          console.log("success");
          res.redirect("users/" + username); // check if this line is doing anything
          res.end();
        };
      })
    }
  });
});

app.get("/users/:id/profile-pic", (req, res) => {
  const localStorage = firebase.storage();
  const mypath = '/profile-pics/' + req.params.id;
  console.log(mypath);
  //console.log(req);
  const imageRef = ref(myStorage, mypath);
  getDownloadURL(imageRef)
    .then((url) => {
      console.log(url);
      res.send(url);
    })
    .catch((error) => console.log((error.message)));
});



app.post("/:id/change-profile-pic", upload.single("pic"),  (req, res) => {
  const file = req.file;

  // const user = localStorage.getItem('currentUser');
  const user = req.params.id;
  console.log(user);
  const imageRef = ref(myStorage, '/profile-pics/' + user);
  const metatype = { name: user };
  if (listAll(myStorage, '/profile-pics/' + user) != null) {
    deleteObject(imageRef).then((() => { console.log("Success") }));
  }
   uploadBytes(imageRef, file.buffer, metatype)
    .then((snapshot) => {
      res.send("uploaded!");
    })
    .catch((error) => console.log(error.message));
});

app.post('/login-attempt', (req, res) => {
  var username = req.body.username;
  var pw = req.body.pw;
  var dbRef = firebase.database().ref();
  dbRef.child('users').child(username).get().then((snapshot) => {
    if (snapshot.exists()) {

      const pwAttempt = snapshot.val().pw;

      if (!pwAttempt.localeCompare(pw)) {
        console.log("success");

        res.end();

      };
    }
  });
})


app.post('/click-follow', (req, res) => {
  const user = req.body.username;
  const toFollow = req.body.toFollow;
  const time = req.body.timestamp;
  const userData = { toFollow: [time] };
  const followData = { user: [toFollow] };

  var dbRef = firebase.database().ref();
  dbRef.child('users').child(user).get().then((snapshot) => {
    if (snapshot.exists()) {
      dbRef.child('users').child(user).child('following').child(toFollow).get().then((secSnapshot) => {
        if (secSnapshot.exists()) {
          console.log("Already following.");
        }
        else {

          database.ref("users/" + user + '/following/' + toFollow).set(time, function (error) {
            if (error) {
              console.log("Following failed with error: " + error);
            }
            else {
              database.ref("users/" + toFollow + '/followers/' + user).set(time, function (error) {
                if (error) {
                  console.log("Following failed with error: " + error);

                }
                else {
                  console.log("success");
                  res.end();
                }
              });
            }
          });
        }
      }
      )
    }
  })
});


app.post('/click-unfollow', (req, res) => {
  const user = req.body.username;
  const toUnfollow = req.body.toUnfollow;
  const time = req.body.timestamp;

  var dbRef = firebase.database().ref();
  dbRef.child('users').child(user).get().then((snapshot) => {
    if (snapshot.exists()) {
      dbRef.child('users').child(user).child('following').child(toUnfollow).get().then((secSnapshot) => {
        if (!secSnapshot.exists()) {
          console.log("You are not following this user.");
        }
        else {

          database.ref("users/" + user + '/following/' + toUnfollow).remove(function (error) {
            if (error) {
              console.log("Following failed with error: " + error);
            }
            else {
              database.ref("users/" + toUnfollow + '/followers/' + user).remove(function (error) {
                if (error) {
                  console.log("Following failed with error: " + error);

                }
                else {
                  console.log("success");
                  res.end();
                }
              });
            }
          });
        }
      }
      )
    }
  })
});

app.use(express.static(path.resolve(__dirname, "../client/build", 'index.html')));



app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

//module.exports = getStorage(fb);
