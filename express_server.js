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


//log in
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  let user = getUserByEmail(email);

  if (!user) {
    res.status(400).send("No user");
    return;
  }

  for (const userId in users) {
    if (users[userId].email === email && users[userId].password === password) {
      userFound = true;
      res.cookie('user_id', userId);
      // console.log("line 82", res.cookie);
      break; // Exit the loop if user is found
    }
  }
  
  if (userFound) {
    const templateVars = {
      user: users[req.cookies.user_id],
    };
    res.redirect('/urls');
  } 
    res.redirect('/register');
});


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


// edit entries
app.post("/urls/:id", (req, res) => {
  
  const id = req.params.id;
  const urlObj = { ...urlDatabase[id] };
  urlObj.longURL = req.body.editURL;
  urlDatabase[id] = urlObj;

  res.redirect("/urls");
});

// render login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: req.user,
    password: req.user,
  };
  res.render("login", templateVars);
});

// delete entries
app.post("/urls/:id/delete", (req, res) => {
  const id = req.body.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

// creation of new URL
app.get("/urls/new", requireLogin, (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[req.cookies.user_id],
  };
  res.render("urls_new", templateVars);
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
app.post("/urls", requireLogin, (req, res) => {
  if (!req.body.longURL) {
    return res.status(400).send("Error: longURL parameter is missing.");
  }
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const userID = req.user.id  // **** possible error in labelling.
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect("/urls/" + shortURL);
});


//cookies for Username
app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
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