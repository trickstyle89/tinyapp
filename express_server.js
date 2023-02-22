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


const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca" },
  "9sm5xK": { longURL: "http://www.google.com" }
};


app.use(express.urlencoded({ extended: true }));


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
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});
    
// new entry confirmation
app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    username: req.cookies["username"],
    urls: urlDatabase,
    longURL: urlDatabase
  };
  res.render("urls_show", templateVars);
});

// tinyApp URL creator
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls/" + shortURL);
});


//log in
app.post('/login', (req, res) => {
  const { username } = req.body;
  res.cookie('username', username);
  res.redirect('/urls');
});

//cookies for Username
app.get("/urls", (req, res) => {
  console.log(req.cookies);
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});