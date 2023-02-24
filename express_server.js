const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const PORT = 8081; // default port 8080

app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

const {generateRandomString, userfinder, urlsForUser, redirectLoggedInUsersToUrls} = require('./helpers');

const requireLogin = (req, res, next) => {
  const user = users[req.cookies.user_id];
  if (!user) {
    return res.redirect('/login');
  }
  req.user = user;
  next();
};


//new user registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  

  if (getUserByEmail(email)) {
    res.status(400).send("Email is already registered");
    return;
  }

  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email,
    password
  };
  users[userId] = newUser;
  res.cookie('user_id', userId);
  res.redirect("/urls");
});

//user Registration
app.get("/register", (req, res) => {
  const templateVars = {
    user: req.user,
    password: req.user,
  };
  res.render('register', templateVars);
});


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

// edit short URL entries
app.get("/urls/:ids", (req, res) => {
  // Display url
  const {user_id} = req.session;
  const templateVars = {
    username : user_id
  };
  const inId = req.params.ids;

  // Not logged in
  if (user_id === undefined) {
    templateVars.cond = 'Not logged in';
  } else if (!Object.keys(urlDatabase).includes(inId)) {
  // Doesn't exist
    templateVars.cond = 'URL does not exist';
  } else if (urlDatabase[inId].userID !== user_id) {
  // Doesn't own
    templateVars.cond = "Can't edit unowned urls";
  } else {
  // Reg
    templateVars.username = users[user_id].email;
    templateVars.shortURL = req.params.ids;
    templateVars.longURL = urlDatabase[req.params.ids].longURL;
    templateVars.cond = false;
  }
  res.render('urls_show', templateVars);
  return;
});

// render login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: req.user,
    password: req.user,
  };
  res.render("login", templateVars);
});

// delete URL entries
app.delete("/urls/:shortURL", (req, res) => {
  const {user_id} = req.session;
  const currShort = req.params.shortURL;
  // not logged in
  const templateVars = {
    username: undefined,
    cond: 'Must Own Url to delete'
  };
  if (!user_id) {
    templateVars.cond = 'Must be logged in to delete urls';
  }
  console.log(urlDatabase[currShort]);
  console.log([currShort]);
  // Logged in own
  if (urlDatabase[currShort].userID === user_id) {
    delete urlDatabase[currShort];
    res.redirect("/urls");
    return;
  }
  res.render('urls_index', templateVars);
  return;
});

// creation of new URL
app.get("/urls/new", (req, res) => {
  // if not logged in
  const {user_id} = req.session;
  if (!user_id) {
    res.status(403).redirect('/login');
    return;
  }
  const templateVars = {};
  templateVars.username = users[user_id].email || undefined;
  res.render("urls_new", templateVars);
  return;
});
    
// new entry confirmation
app.post("/urls/:id", requireLogin, (req, res) => {
  const id = req.params.id;
  const urlObj = urlDatabase[id];
  if (!urlObj || urlObj.userID !== req.user.id) {
    const templateVars = {
      message: `URL with id ${id} does not exist or you are not authorized to edit it.`,
      user: req.user
    };
    return res.status(400).send("You are not authorized to edit this URL.");
  }
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    const templateVars = {
      message: `URL with id ${shortURL} does not exist.`,
      user: req.user
    };
    return res.status(404).render("error", templateVars);
  }
  res.redirect(urlObj.longURL);
});


// tinyApp URL creator
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



// list of URLs
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



// delete cookie
app.delete('/logout', (req, res) => {
  // if logged in
  req.session = null;
  res.redirect('/urls');
  return;
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// if 404 err
if (app.status === 404) {
  return '404 error';
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});