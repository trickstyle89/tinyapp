const express = require("express");
const bcrypt = require("bcryptjs");
const cookieParser = require('cookie-parser'); // take out after bcrypt?
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
  user3RandomID: {
    id: "88999",
    email: "chewsstory@gmail.com",
    password: "111",
  },
};

//encyption
const hashThePassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

//encrypt the user in object. **only once
const hashPasswords = (users) => {
  for (const userId in users) {
    const user = users[userId];
    user.password = hashThePassword(user.password);
  }
};
hashPasswords(users);

console.log('line 67 hash', users);  // <------- console.log test
/*  OLD
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca" },
  "9sm5xK": { longURL: "http://www.google.com" }
};
*/

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

app.use(express.urlencoded({ extended: true }));

/* Helper function refactor in later starting at 252
const urlsForUser = (id) => {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};
*/

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
  let userFound = false;

  for (const userId in users) {
    const user = users[userId];
    if (user.email === email && bcrypt.compareSync(password, user.password)) {
      userFound = true;
      res.cookie('user_id', userId);
      break; // Exit the loop if user is found
    }
  }
  if (userFound) {
   /*  const templateVars = {     *** unnessesary?
      user: users[req.cookies.user_id],
    };
    */
    res.redirect('/urls');
  } else {
    res.status(403).send('Invalid email or password');
  }
});


//new user registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  

  if (getUserByEmail(email)) {
    res.status(400).send("Email is already registered");
    return;
  }

  const userId = generateRandomString();
  const hashedPassword = hashThePassword(password); // Hash the password via helper function
  const newUser = {
    id: userId,
    email,
    password: hashedPassword
  };
  console.log('line 152', newUser);  // <------- console.log test
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
  const id = req.params.id;
  const urlObj = urlDatabase[id];
  if (!urlObj) {
    // Render an error page if the id does not exist
    const templateVars = {
      message: `URL with id ${id} does not exist.`,
      user: req.user
    };
    return res.status(404).send("You are not authorized to delete this URL");
  }
  if (urlObj.id !== req.user) {
    // Render an error page if the user does not own the URL
    const templateVars = {
      message: `You are not authorized to delete this URL.`,
      user: req.user
    };
    return res.status(400).send("You are not authorized to delete this URL.");
  }
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
    
// Route for displaying individual shortened URLs
app.get("/urls/:id", requireLogin, (req, res) => {
  const id = req.params.id;
  const urlObj = urlDatabase[id];
  if (!urlObj) {
    const templateVars = {
      message: `URL with id ${id} does not exist.`,
      user: req.user
    };
    return res.status(400).send("You are not authorized to access this URL.");
  }
  const templateVars = {
    id: id,
    user: req.user,
    longURL: urlObj.longURL
  };
  res.render("urls_show", templateVars);
});

// Route for redirecting to the long URL associated with a shortened URL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const urlObj = urlDatabase[id];
  if (!urlObj) {
    const templateVars = {
      message: `URL with id ${id} does not exist.`,
      user: req.user
    };
    return res.status(400).send("error",);
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
  const userID = req.user.id;
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect("/urls/" + shortURL);
});


//cookies for Username
app.get("/urls", requireLogin, (req, res) => {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === req.user.id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  const templateVars = {
    user: users[req.cookies.user_id],
    urls: userUrls,
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


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});