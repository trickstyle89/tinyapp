const bcrypt = require('bcryptjs');
const uuid = require('uuid');
// function userfinder returns the user object if the given email and
// password correspond with a user in the user dataset,
// or the string "only email" if only the email is correct
// or false if user doesn't exist.
const userfinder = (user, password, searchData) => {
  for (let elem in searchData) {
    let {email, pass} = searchData[elem];
    // if both user and pass
    if (email === user) {
      // return true;
      if (bcrypt.compareSync(password, pass)) {
        return searchData[elem];
      }
      return 'onlyemail';
    }
  }
  return false;
};

// function generateRandomString returns
// a random length 6 string.
const generateRandomString = () => uuid.v4().substr(0,6);


// function urlsForUser returns object containing url object
// where userID === id or an empty object if no urls belong
// to the user
const urlsForUser = (id, searchData) => {
  const ansObj = {};
  for (let elem in searchData) {
    if (searchData[elem].userID === id) {
      ansObj[elem] = searchData[elem];
    }
  }
  return ansObj;
};

module.exports = {userfinder, urlsForUser, generateRandomString};