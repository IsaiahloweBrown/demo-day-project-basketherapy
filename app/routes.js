const axios = require('axios');



// set up the request parameters
const params = {
  api_key: "B52F793A4A924FE49B90955F80199554",
  search_type: "places",
  q: "basketball court",
  location: 'Philadelphia,PA,United States'
}

// make the http GET request to Scale SERP
axios.get('https://api.scaleserp.com/search', { params })
  .then(response => {

    // print the JSON response from Scale SERP
    
    console.log(JSON.stringify(response.data.places_results, 0, 2));
    let results = JSON.stringify(response.data.places_results)
    let titles = []
    let addresses = [] 
    for(i=0; i<18; i++) {
      let itemTitle = JSON.stringify(response.data.places_results[i].title)
      let itemAddress = JSON.stringify(response.data.places_results[i].address)
      if(itemTitle !== "Baketball Court") {
        titles.push(itemTitle)
        addresses.push(itemAddress)
      }
    }
    console.log(JSON.stringify(response.data.places_results[0].title))
    // console.log(address)
    console.log(results.length)
    console.log(titles)

  }).catch(error => {
    // catch and print the error
    console.log(error);

     
  })

module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('games').find().toArray((err, result) => {
          if (err) return console.log(err)
          //change ejs page to All Games 
          res.render('profile.ejs', {
            user : req.user,
            games: result
          })
          
        })
    });
    //if games === "user"
    // LOGOUT ==============================
    // app.get('/logout', function(req, res) {
    //     req.logout();
    //     res.redirect('/');
    // });


      app.get('/logout', function(req, res, next) {
        req.logout(function(err) {
          if (err) { return next(err); }
          res.redirect('/');
        });
      });

// message board routes ===============================================================

    app.post('/create', (req, res) => {
   
  
      db.collection('games').save({name: req.body.name, location: req.body.location, dateAndTime: req.body.dateAndTime, gameType: req.body.gameType, participants: null}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.render('allGames.ejs')
      })
    })

    app.put('/games', (req, res) => {
      db.collection('games')
      .findOneAndUpdate({name: req.body.name, location: req.body.location, dateAndTime: req.body.dateAndTime, gameType: req.body.gameType}, {
        $set: {
          participants: +1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })
    //api that gives back response
    app.put('/dislikes', (req, res) => {
      db.collection('games')
      .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
        $set: {
          thumbUp:req.body.thumbUp - 1,
          
        }
      }, {
        //sorts descending
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)

        res.send(result)
      })
    })

    app.delete('/games', (req, res) => {
      db.collection('games').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash games
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash games
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
