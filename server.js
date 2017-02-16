const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser'); //cookie-session
app.use(cookieParser()); //cookiesSession({ enter name, keys})

// replace cookie with session ** req.session.user_id

// use bcrypt

const randomstring = require('randomstring');

app.set('view engine', 'ejs');

let urlDatabase = {
  'b2xVn2': { shortURL: 'b2xVn2', longURL: 'http://www.google.com', user: 'UG79xq' },
  '9sm5xK': { shortURL: '9sm5xK', longURL: 'http://www.lighthouselabs.ca', user: 'UG79xq' }
};

let users = {
  UG79xq: { id: 'UG79xq', email: 'tkg214@gmail.com', password: 'a' },
  ABc90s: { id: 'ABc90s', email: 'abc@gmail.com', password: 'a' }};

/*

let sessions = {}

*/

// function finds user object based on email or user id
function findUserId(email) {
  for (user in users) {
    if (users[user]['email'] === email) {
      return users[user]['id'];
    }
  }
}

function urlsForUser(id) {
  userURLS = {};
  for (url in urlDatabase) {
    if (id === urlDatabase[url].user) {
      userURLS[urlDatabase[url].shortURL] = {
        shortURL: urlDatabase[url].shortURL,
        longURL: urlDatabase[url].longURL
      };
    }
  }
  return userURLS;
}

// receives request for root path, redirects to /urls
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// receives request to show list of urls page and responds with rendered urls_index.ejs
app.get('/urls', (req, res) => {
  res.render('urls_index', {
    urlDatabase: urlsForUser(req.cookies.user_id),
    user_id: req.cookies.user_id// base on sessions
  });
});

// receives request to create new url page and responds with rendered urls_new.ejs
app.get('/urls/new', (req, res) => {
  for (let user in users) {
    if (req.cookies.user_id === users[user]['id']) {
      res.render('urls_new', { user_id: req.cookies.user_id });
      return;
    }
  }
  res.redirect('/login');
});

// receives request to show specific url page and responds with rendered urls_show.ejs template, otherwise responds with urls_new.ejs
app.get('/urls/:shortURL', (req, res) => {
  if (req.params.shortURL in urlDatabase) {
    res.render('urls_show', {
      shortURL: urlDatabase[req.params.shortURL].shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user_id: req.cookies.user_id
    });
  } else {
    res.status(404).send('Requested page does not exist.');
  }
});

// receives request for specific short url page and responds with redirection to the corresponding website
app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// receives request for registration page and responds with registeration page
app.get('/register', (req, res) => {
  res.render('register');
})

app.get('/login', (req, res) => {
  res.render('login');
})

// receives form post request to create, generates random short url, stores long url as a value of short url, and redirects to new page created (only creates truthy values)
app.post('/urls', (req, res) => {
  let newShortURL = generateRandomKey(6);
  if (req.body.longURL) {
    urlDatabase[newShortURL] = {
      shortURL: newShortURL,
      longURL: req.body.longURL,
      user: req.cookies.user_id
    };
    res.redirect(`/urls/${newShortURL}`);
  } else {
    res.redirect('/urls/new');
  }
});

// receives form post request to delete, deletes associated short url property from urlDatabase, and redirects to /urls
app.post('/urls/:shortURL/delete', (req, res) => {
  for (let user in users) {
    if (req.cookies.user_id === users[user]['id'] && req.cookies.user_id === urlDatabase[req.params.shortURL].user) {
      delete urlDatabase[req.params.shortURL]
      res.redirect('/urls');
      return;
    } else {
      res.status(401).send('You do not have access.')
    }
  }
});

// receives form post request to update, updates associated long url from urlDatabase, and redirects to /urls (only updates truthy values)
app.post('/urls/:shortURL', (req, res) => {
  for (let user in users) {
    if (req.cookies.user_id === users[user]['id'] && req.cookies.user_id === urlDatabase[req.params.shortURL].user) {
      if (req.body.longURL) {
        urlDatabase[req.params.shortURL].longURL = req.body.longURL;
      }
      res.redirect(`/urls/${req.params.shortURL}`);
    } else {
      res.status(401).send('You do not have access.')
    }
  }
});

// receives form post request to sign in, responds with cookie and redirection to /
app.post('/login', (req, res) => {
  for (let user in users) {
    if (users[user]['email'] === req.body.email) {
      if (users[user]['password'] === req.body.password) {
        res.cookie('user_id', findUserId(req.body.email));
        res.redirect('/');
        return;
      } else {
        res.status(403).send('Your email and password do not match.');
        return;
      }
    }
  }
  res.status(403).send('Your email and password do not match.');
});

// receives form post request to sign out, responds with cookie deletion and redirection to /
app.post('/logout', (req, res) => {
  res.clearCookie('user_id')
  res.redirect('/');
});
// CLEAR COOKIE DOESNT WORK

// receives form post request to register, creates user, and redirects
app.post('/register', (req, res) => {
  if (!req.body.password || !req.body.email) {
    res.status(400).send('Please enter both email and password.');
    return;
  }
  for (let user in users) {
    if (users[user]['email'] === req.body.email) {
      res.status(400).send('Email already exists.');
      return;
    }
  }
  let randomId = generateRandomKey(6);
  users[randomId] = {
    id: randomId,
    email: req.body.email,
    password: req.body.password
  }
  res.cookie('user_id', users[randomId]['id']);
  res.redirect('/');
});

// generates random string using randomstring module
function generateRandomKey(length) {
  return randomstring.generate(length);
};


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

