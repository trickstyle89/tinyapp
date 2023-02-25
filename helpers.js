const bcrypt = require('bcryptjs');

//This function gives filtered lists of URLs for a specific user
const urlsForUser = function(id, urlData) {
  const filteredUrls = {};
  const keys  = Object.keys(urlData);
  for (const key of keys) {
    
    if (urlData[key]['userID'] === id) {
      filteredUrls[key] = urlData[key];
    }
  }
  return filteredUrls;
};

//This function create and stores user's credentials for a new user
const createUser = function(email, hashedPassword, users) {
  const userID = generateRandomId();
  
  users[userID] = {
    id: userID,
    email,
    password: hashedPassword,
  };
  return userID;
};

//This function fetches user by comparing email id from database and provided in browser
const getUserByEmail = function(email, users) {
  for (let userKey in users) {
    const user = users[userKey];
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
};

//This function enables editing/deleting capabilities only if generated ID belongs to a specific user
const idMatched = function(shortURL, users, urlDatabase) {
  const ID = Object.keys(users);
  let idMatchedVar = 0;
  for (const id of ID) {
    if (urlDatabase[shortURL].userID === id) {
      idMatchedVar = 1;
    }
  }
  return idMatchedVar;
};

//This function generate ID of 6 characters randomly
const generateRandomId = function() {
  return Math.random().toString(36).substring(2,8);
};

//encyption
const hashThePassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

//encrypt the user in object. **only once
const hashUserObjPasswords = (users) => {
  for (const userId in users) {
    const user = users[userId];
    user.password = hashThePassword(user.password);
  }
};


module.exports = { urlsForUser, createUser, getUserByEmail, idMatched, generateRandomId, hashUserObjPasswords, hashThePassword };