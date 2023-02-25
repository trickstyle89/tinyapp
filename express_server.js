const { urlsForUser, createUser, getUserByEmail, idMatched, generateRandomId, hashThePassword, hashUserObjPasswords } = require('./helpers');
const cookieSession = require('cookie-session');
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8081; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Kariya', 'McDavid', 'Bure'],
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
    longURL: "https:/s/www.google.ca",
    userID: "aJ42lW"
  }
};

//empty users object for storing user information
const users = {
};

// This would hash their users passwords in USERS Object.
hashUserObjPasswords(users);

//redirection of homepage to login or urls index
app.get("/", (req, res) => {
  
  const userId = req.session.user_id;
  const loggedInUser = users[userId];
  
  if (loggedInUser) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

//verifies the cookie to display the user name in every page if logged in
app.get("/urls", (req, res) => {
  
  const userId = req.session.user_id;
  const loggedInUser = users[userId];
  const shortUrlFound = urlsForUser(userId, urlDatabase);
  const templateVars = {
    user: loggedInUser,
    filteredUrls: shortUrlFound,
  };
  
  res.render("urls_index", templateVars);
});

//random SHORTURL generator
app.post("/urls", (req, res) => {
  
  let shortURL = generateRandomId();
  const userId = req.session.user_id;
  
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userId,
  };

  res.redirect(`/urls/${shortURL}`);
});

//creation of new urls
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

// creation of short URL save page with cookies enables
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

//short URL database checker
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

//delete urls post
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

//Update the long URL
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

//This request to log out if logged in
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

//register GET render
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
  const hashedPassword = hashThePassword(password);

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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});