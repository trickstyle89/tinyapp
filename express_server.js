const cookieSession = require('cookie-session');
const express = require("express");
const { urlsForUser, createUser, getUserByEmail, idMatched, generateRandomId } = require('./helpers');
const bcrypt = require('bcryptjs');
const app = express();
const bodyParser = require("body-parser");
const PORT = 8081; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key', 'lime', 'pie'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  i3DoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ42lW"
  }
};

const password = "red";
const hashedPassword = bcrypt.hashSync(password, 10);

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: hashedPassword,
  }
};

// Logged in check
// if cookie doesn't exist go back to login page.
app.use((req, res, next) => {
  const {user_id} = req.session;
  const path = req.path;
  if (
    user_id === undefined &&
    path !== '/login' &&
    path !== '/register' &&
    path !== '/urls' &&
    path.slice(0,4) !== '/url' &&
    path.slice(0,2) !== '/u'
  ) {
    res.status(403).redirect('/login');
    return;
  }
  next();
});

app.get("/", (req, res) => {
  const userId = req.session.user_id;
  const loggedInUser = users[userId];
  if (loggedInUser) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});;

app.get("/urls", (req, res) => {
  //verifies the cookie to remain set on multiple pages
  //and to display the user name in every page if logged in
  const userId = req.session.user_id;
  const loggedInUser = users[userId];
  const shortUrlFound = urlsForUser(userId, urlDatabase);
  const templateVars = {
    user: loggedInUser,
    filteredUrls: shortUrlFound,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const loggedInUser = users[userId];
  const templateVars = {
    user: loggedInUser,
  };
  if (loggedInUser) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const loggedInUser = users[userId];

  if (!urlDatabase[req.params.shortURL]) {
    res.send("Id does not exist in user database!!");
    return;
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const templateVars = {
    user: loggedInUser,
    shortURL: req.params.shortURL,
    longURL: longURL,
  };
  if (urlDatabase[req.params.shortURL].userID !== users[userId].id) {
    res.send("Sorry, you dont have permission to edit other user's url");
    return;
  }
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
  const loggedInUser = users[userId];
  const templateVars = {
    user: loggedInUser,
  };
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.render('error.ejs', templateVars);
  }
});

app.post("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  let idMatchedVar = 0;
  idMatchedVar = idMatched(shortURL, users, urlDatabase);
  if (!idMatchedVar) {
    res.send("Sorry, you dont have permission to delete other user's url");
    return;
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.get("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  let idMatchedVar = 0;
  idMatchedVar = idMatched(shortURL, users, urlDatabase);
  if (!idMatchedVar) {
    res.send("Sorry, you dont have permission to delete other user's url");
    return;
  }
});

//Update(CRUD) the long URL
app.post("/urls/:id", (req,res) => {
  const id = req.params.id;
  urlDatabase[id].longURL = req.body.quoteContent;
  res.redirect("/urls");
});

//Implementing Cookies
app.post("/login", (req,res) => {
  const { email, password } = req.body;
  const userFoundByEmail = getUserByEmail(email, users);
  if (!userFoundByEmail) {
    res.status(403).send("User cannot be found");
  } else {
    if (bcrypt.compareSync(password, userFoundByEmail.password)) {
      req.session.user_id = userFoundByEmail.id;
      res.redirect("/urls");
    } else {
      res.status(403).send("User's email is found but the password does not match");
    }
  }
});

//This request helps user to log out if logged in
app.post("/logout", (req,res) => {
  req.session = null;
  res.redirect("/urls");
});

//Implement User Registration and Login
app.get('/login', (req, res) => {
  const userId = req.session.user_id;
  const loggedInUser = users[userId];
  const templateVars = {
    user: loggedInUser};
  if (loggedInUser) {
    res.redirect("/urls");
  } else {
    res.render('login', templateVars);
  }
});

app.get('/register',(req,res) => {
  const userId = req.session.user_id;
  const loggedInUser = users[userId];
  const templateVars = {
    user: loggedInUser};
  if (loggedInUser) {
    res.redirect("/urls");
  } else {
    res.render('register', templateVars);
  }
  
});

//Registering new users and checking for Errors
app.post('/register',(req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if ((email === "") || (password === "")) {
    res.status(400).send("Email or Password is not entered");
  }

  const userFound = getUserByEmail(email, users);
  if (userFound) {
    res.status(400).send("User already exists!");
  }

  const userID = createUser(email, hashedPassword, users);
  req.session.user_id = userID;
  res.redirect("/urls");
});

// Update an individual page for an id
app.put("/urls/:id", (req, res) => {
  // if not logged in
  const {user_id} = req.session;
  const templateVars = {
    username : user_id
  };
  const inId = req.params.id;
  // Not logged in
  console.log(urlDatabase[inId]);
  if (user_id === undefined) {
    templateVars.cond = 'Not logged in';
    res.render('urls_show', templateVars);
    return;
  }
  // Can update
  if (urlDatabase[inId].userID === user_id) {
    urlDatabase[inId].longURL = req.body.updateURL;
    res.redirect(`/urls`);
    return;
  }
  // Doesn't own
  templateVars.cond = "Can't edit unowned urls";
  res.render('urls_show', templateVars);
  return;
});

// see url LIST
app.get("/urls", (req, res) => {
  // not logged in
  const user_id = req.session.user_id;
  const usersUrls = urlsForUser(user_id, urlDatabase);

  const templateVars = {
    username: undefined,
    urls: usersUrls,
    cond: 'Must be logged in to see urls'
  };
  if (user_id) {
    templateVars.username = users[user_id].email;
    templateVars.cond = undefined;
  }
  // Display urls
  res.render('urls_index', templateVars);
  return;
});


// add a url
app.post("/urls", (req, res) => {
  const currShort = generateRandomString();
  const {user_id} = req.session;
  let currLong = req.body.longURL;
  // if not logged in
  if (!user_id) {
    let templateVars = {
      username : undefined,
      cond :'Not logged in'
    };
    res.render('urls_show', templateVars);
    return;
  }

  urlDatabase[currShort] = {
    longURL: currLong,
    userID: user_id,
  };
  res.redirect(`/urls/${currShort}`);
  return;
});


// Redirect based on short address.
app.get("/u/:id", (req, res) => {
  // no url for id
  let currUrl = urlDatabase[req.params.id];
  if (!currUrl) {
    let templateVars = {
      username : undefined,
      cond :'URL does not exist'
    };
    res.render('urls_show', templateVars);
    return;
  }
  let currLong = currUrl.longURL;
  if (currLong !== undefined) {
    res.redirect(`${currLong}`);
    return;
  }
});

// redirect to appropriate start page
app.get("/", (req, res) => {
  if (req.session.user_id !== undefined) {
    res.redirect('/urls');
    return;
  }
  // if not logged in
  res.redirect('/login');
  return;
});

// Log in and Register
// just login
app.get('/login', (req, res) => {
  let loginstatus = {};
  loginstatus.cond = req.params.login;
  loginstatus.username = req.session.user_id;
  if (req.status === 403) {
    loginstatus.code = 'must be logged in';
  }
  if (loginstatus.username === undefined) {
    res.render('urls_login', loginstatus);
    return;
  }
  res.redirect('/urls');
  return;
});

// Actually logging in.
app.post('/login', (req, res) => {
  const {username, pass} = req.body;
  // if user and pass are correct
  const currUser = userfinder(username, pass, users);
  if (typeof  currUser === 'object') {
    req.session.user_id = currUser.id;
    res.redirect('/urls');
    return;
  }
  // If Something Wrong
  const loginstatus = {
    cond:'wrong username or password',
    username: undefined
    
  };
  res.status(403).render('urls_login',loginstatus);
  return;
});

// reg new user
app.get('/register', (req, res) => {
  let loginstatus = {
    cond: undefined,
    username: undefined,
  };
  if (req.session.user_id === undefined) {
    res.render('urls_register', loginstatus);
    return;
  }
  res.redirect('/urls');
  return;
});

// register post
app.post('/register', (req, res) => {
  const loginstatus = {
    cond:'Existing User',
    username: undefined
  };
  let {username, pass} = req.body;

  const existing = userfinder(username, pass, users);
  let curruid = generateRandomString();

  if (existing) {
    res.render('urls_register',loginstatus);
    return;
  }
  if (username.length < 1) {
    loginstatus.cond = 'Email is empty';
    res.status(400).render('urls_register',loginstatus);
    return;
  }
  if (pass.length < 1) {
    loginstatus.cond = 'Password is empty';
    res.status(400).render('urls_register',loginstatus);
    return;
  }
  users[curruid] = {
    id: curruid,
    pass : bcrypt.hashSync(pass, 10),
    email: username,
  };
  req.session.user_id = curruid;
  res.redirect('/urls');
  return;
});

// delete cookie
app.delete('/logout', (req, res) => {
  // if logged in
  req.session = null;
  res.redirect('/urls');
  return;
});

// if 404 err
if (app.status === 404) {
  return '404 error';
}

// Server listening;
app.listen(PORT);