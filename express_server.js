const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
const PORT = 8081; // default port 8080

app.set("view engine", "ejs");

const generateRandomString = function() {
  const length = 6;
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// checks to see if user has account.
const getUserByEmail = function(email) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

//middleware for login check
const requireLogin = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  // Set user property on req object
  req.user = users[req.session.user];
  console.log(`Req.user${req.user}`);
  next();
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca" },
  "9sm5xK": { longURL: "http://www.google.com" }
};


app.use(express.urlencoded({ extended: true }));

//log in
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  let userFound = false;
  let userID;

  for (const user in users) {
    if (users[user].email === email && users[user].password === password) {
      userFound = true;
      userID = user;
      break;
    }
  }

  if (userFound) {
    req.session.user = userID;
    res.redirect('/login');

  } else {

    res.redirect('/register');
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: req.user,
  };
  res.render("login", templateVars);
});


//user form
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty");
    return;
  }

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
    user: users[req.cookies.user_id],
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

// delete entries
app.post("/urls/:id/delete", (req, res) => {
  const id = req.body.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

// creation of new URL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
  };
  res.render("urls_new", templateVars);
});
    
// new entry confirmation
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    user: users[req.cookies.user_id],
    longURL: urlDatabase
  };
  res.render("urls_show", templateVars);
});

// tinyApp URL creator
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL };
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
  res.redirect("/urls");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});