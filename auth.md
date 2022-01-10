# Authentication Code Walk-Through

The following notes explain how to recreate this auth functionality of this app, once you have the basic routes, views, and user model set up.

---

# Sequelize Validations

**Name**
* cannot be null
* must be between 2 and 25 characters

**Email**
* cannot be null
* must be unique
* must be a legit email

**Password**
* cannot be null
* must be between 8 and 99 characters

Test it out!

```javascript
user.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 25],
          msg: 'Name must be 2-25 characters long.'
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          args: true,
          msg: 'Please enter a valid email address.'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [8,99],
          msg: 'Password must be between 8 and 99 characters.'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'user',
  });
```
---

# Bcrypt & Sequelize Hooks

## Hash the password on signup (sequelize hook + bcrypt)

### install bcrypt with 

`npm i bcrypt`

### import bcrypt into the user model

`const bcrypt = require('bcrypt')`

### create a beforeCreate hook and test it out

```javascript
  user.addHook('beforeCreate', (pendingUser, options)=>{
    console.log(`HOOK!!!! BEFORE CREATING THIS USER: ${pendingUser.name}`)
  })
```

### hash that password!!!!
```javascript
  user.addHook('beforeCreate', (pendingUser, options)=>{
    console.log(`OG password: ${pendingUser.password}`)
    let hashedPassword = bcrypt.hashSync(pendingUser.password, 10)
    console.log(`Hashed password: ${hashedPassword}`)
    pendingUser.password = hashedPassword
  })
```

---

# Express Sessions

### install it
```
npm i express-session
```

### import it in `index.js`: 

```javascript
const session = require('express-session')
```
### set up session middleware: 
```javascript
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}))
```

Check out the docs for more on the [secret](https://www.npmjs.com/package/express-session#secret), [resave](https://www.npmjs.com/package/express-session#resave), and [saveUninitialized](https://www.npmjs.com/package/express-session#saveuninitialized) options.

# Set up Passport

### Install [passport](http://www.passportjs.org/)

```
npm i passport
```

### Create a configuration file

`config/ppConfig.js` is where we'll put all of the passport-specific set up code (so we don't make `index.js` super long)

```javascript
const passport = require('passport')

// ----------------------------> SERIALIZATION SET UP <----------------------------

// ----------------------------> STRATEGY SET UP <----------------------------


module.exports = passport
```

### Import the code from the configuration file back into `index.js`:

```javascript
const passport = require('./config/ppConfig.js')
```

### Serialize

We have to tell Passport how to [serialize](https://www.npmjs.com/package/passport#sessions) the user by converting it to the id alone (this makes it easy to store):

```javascript
// tell the passport to serialize the user using the id
// by passing it into the doneCallback
passport.serializeUser((user, doneCallback) => {
    console.log("serializing user...")
    doneCallback(null, user.id)
})
```

### Deserialize

Tell passport how to deserialize the user now by looking it up in the db based on the id:

```javascript   
passport.deserializeUser((id, doneCallback) => {
    db.user.findByPk(id)
    .then(foundUser => {
        console.log("deserializing user....")
        doneCallback(null, foundUser)
    })
    .catch((err)=>{
        console.log("error deserializing user")
    })
})
```

### Set up passport middleware 

This hass to happen BELOW session middleware per [docs](https://www.npmjs.com/package/passport#middleware)

```javascript
app.use(passport.initialize())
app.use(passport.session())
```

### Install [passport local](http://www.passportjs.org/packages/passport-local/)

```
npm i passport-local
```

### Import `passport-local` into `config/ppConfig.js`
```javascript
const LocalStrategy = require('passport-local')
```

### Set up `passport-local` as the strategy in `config/ppConfig.js`

If we want to mimic the way the [docs](http://www.passportjs.org/packages/passport-local/) do it, it would look like this:
```javascript
passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    (email, password, doneCallback) => {
        console.log("passport-local is now trying to authenticate this user:", email)
        db.user.findOne({where:{email:email}})
        .then(async foundUser=>{
            let match = await bcrypt.compare(password, foundUser.password)
            if (!foundUser || !match) { 
                return doneCallback(null, false)
            } else {
                return doneCallback(null, foundUser);
            }
        })
        .catch(err=>doneCallback(err))
    }
))
```
**OR** we could assign each argument that goes into a function to its own variable so we can see each component more clearly:

```javascript
const findAndLogInUser = (email, password, doneCallback) =>{
    db.user.findOne({where:{email: email}}) // go check for a user in the db with that email
    .then(async foundUser=>{
        let match
        if(foundUser){
            match = await bcrypt.compare(password, foundUser.password)
        }
        if(!foundUser || !match){ // something funky about the user
            console.log('password was NOT validated i.e. match is false')
            return doneCallback(null, false) // send back "false"
        } else { // user was legit
            return doneCallback(null, foundUser) // send the found user object
        }
    })
    .catch(err=>doneCallback(err)) // doneCallback takes two params: error, userToBeLoggedIn
}

const fieldsToCheck = {
    usernameField: 'email',
    passwordField: 'password'
}


// Create an instance of Local Strategy
// --> constructor arg 1:
// an object that indicates how we're going refer to the two fields
// we're checking (for ex. we're using email instead of username)
// --> constructor arg 2:
// a callback that is ready to receive the two fields we're checking
// as well as a doneCallback
const strategy = new LocalStrategy(fieldsToCheck, findAndLogInUser)

passport.use(strategy)
```

### Import passport to your auth controller
```javascript
const passport = require('../config/ppConfig.js')
```

### Modify login route to use passport and check to see if loggin in works!

```javascript
router.post('/login', passport.authenticate('local', {
        failureRedirect: '/auth/login',
        successRedirect: '/'
    })
)
```

### TEST NOW!!!!

Can you login? A valid eamil & password should send you to the home page, and an invalid login should redirect back to the login page.

### Change home route to show us the logged in user:

```javascript
app.get('/', (req, res)=>{
    if(req.user){
        res.send(`req.user: ${req.user.name}`)
    } else {
        res.send("no user currently logged in")
    }
    // res.render('home')
})
```
Try refreshing the page after logging in to make sure the session persists!

### Log the new user in upon successful signup

```javascript
router.post('/signup', (req, res)=>{
    db.user.findOrCreate({
        where: {email: req.body.email},
        defaults: {
            name: req.body.name,
            password: req.body.password
        }
    })
    .then(([createdUser, wasCreated])=>{
        if(wasCreated){
            console.log(`just created the following user:`, createdUser)
            // res.send('POST form data from signup.ejs, then redirect')
            passport.authenticate('local', {
                successRedirect: '/',
            })(req, res) // IIFE
        } else {
            console.log('An account associated with that email address already exists! Did you mean to login?')
            res.redirect('/auth/login')
        }
    })
    .catch(err =>{
        console.log(err)
    })
})
```

`passport.authenticate()` returns a function designed to be used as the route callback (like we used it in the login route! It will call `res.redirect` to the indicated `successRedirect` path when it is  called, so we open parentheses and pass in the request and response objects to make this happen immediately when that line of code is read. This is called and *immediately invoked function express* (or IIFE). Since `passport.authenticate()` resolves to be a function definition, we're immediately calling (aka invoking) a function upon it's definition.


### Add a logout route!

The logout method is added to the request object by the passport middleware. See [docs](http://www.passportjs.org/docs/logout/).

```javascript
router.get('/logout', (req, res)=>{
    req.logout()
    res.redirect('/')
})
```
---

# Custom Middleware
### Make the user available to all ejs pages by attaching it to the response object

```javascript
// CUSTOM MIDDLEWARE
app.use((req, res, next)=>{
    res.locals.currentUser = req.user
    next() // move on to the next piece of middleware
})
```

### Modify `profile.ejs` to test currentUser accessibility

```html
<h1><%=currentUser.name%>'s Profile</h1>
```

### Nav Bar

Add a nav bar to the `layout.ejs` header that dynamically renders based on whether a user is logged in:

```markup
<nav>
    <ul>
        <% if (!currentUser) { %>
        <li><a href="/auth/signup">Signup</a></li>
        <li><a href="/auth/login">Login</a></li>
        <% } else { %>
        <li><a href="/auth/logout">Logout</a></li>
        <li><a href="/profile">Profile</a></li>
        <% } %>
    </ul>
    </nav>
```

---

# Flash Messages

* Install
```
npm i connect-flash
```

* Import to `index.js`
```javascript
const flash = require('connect-flash')
```

* Set up the `connect-flash` middleware **after** the session middlware (since it uses sessions to story the messages):

```javascript
app.use(flash())
```

* Add flash messages to the request object manually and via passport (look for `//!->FLASH<-!)` comments) to auth route:
```javascript
router.post('/signup', (req, res)=>{
    db.user.findOrCreate({
        where: {email: req.body.email},
        defaults: {
            name: req.body.name,
            password: req.body.password
        }
    })
    .then(([createdUser, wasCreated])=>{
        if(wasCreated){
            console.log(`just created the following user:`, createdUser)
            // res.send('POST form data from signup.ejs, then redirect')
            passport.authenticate('local', {
                successRedirect: '/', // !-> FLASH <-!
                successFlash: 'Account created and logged in!'
            })(req, res) // why does this need to be an IIFE???
        } else { // !-> FLASH <-!
            req.flash('error', 'email already exists, try logging in') 
            // console.log('An account associated with that email address already exists! Did you mean to login?')
            res.redirect('/auth/login')
        }
    })
    .catch(err =>{ // !-> FLASH <-!
        req.flash('error', err.message) 
        res.redirect('/auth/signup')
    })
})
```

### Make our flash messages available to all ejs

We want out messages always available in our ejs so we don't have to pass through `req.alerts` to our ejs manually:

```javascript
app.use((req, res, next) => {
    // before every route, attach the flash messages and current user to res.locals
    res.locals.alerts = req.flash();
    res.locals.currentUser = req.user;
    next()
})
```


## Display the flash messages in the ejs

### Create a `views/partials/alerts.ejs` file with the following:

```markup
<% if (alerts.error) { %>
    <% alerts.error.forEach(msg => { %>
      <%= msg %>
    <% }) %>
<% } %>
<% if (alerts.success) { %>
    <% alerts.success.forEach(msg => { %>
        <%= msg %>
    <% }) %>
<% } %>
```

* Include your partial in your `layout.ejs`
```markup
    <%- include('partials/alerts') %>
```

### Revert home route to show the home ejs

```javascript
app.get('/', (req, res)=>{
    res.render('home')
})
```

### Test your alert!

See if you get the appropiate alerts on signup.

### Now add flash to the login route:

```javascript
router.post('/login', passport.authenticate('local', {
        failureRedirect: '/auth/login',
        successRedirect: '/', // !-> FLASH <-!
        failureFlash: 'Invalid username and/or password.',
        successFlash: 'You are now logged in.'
    })
)
```

Test this too!!

---

# Set Up Authorization

* Create authorization middleware in a `middleware/isLoggedIn.js` file that checks if a user is logged in. We do this in a separate file so we can import it into any controller if needed.
```javascript
module.exports = (req, res, next) => {
    if (!req.user) {
        req.flash('error', 'You must be logged in to access that page.')
        res.redirect('/auth/login')
    } else {
        next()
    }
}
```

* Import the middleware in `index.js` (and anywhere else you want to use it)
```javascript
const isLoggedIn = require('./middleware/isLoggedIn')
```

* Protect your profile route by adding `isLoggedIn` as an optional middleware argument:

```javascript
app.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile');
})
```