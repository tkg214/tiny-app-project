const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const randomstring = require('randomstring');

app.set('view engine', 'ejs');

let urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

let users = { UG79xq: { id: 'UG79xq', email: 'tkg214@gmail.com', password: 'a' } };

// function finds user object based on email or user id
function findUser(email) {
  for (user in users) {
    if (users[user]['email'] === email) {
      return users[user]['id'];
    }
  }
}

// receives request for root path, redirects to /urls
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// receives request to show list of urls page and responds with rendered urls_index.ejs
app.get('/urls', (req, res) => {
  res.render('urls_index', {
    urls: urlDatabase,
    user_id: findUser(req.cookies.email)
  });
});

// receives request to show specific url page and responds with rendered urls_show.ejs template, otherwise responds with urls_new.ejs
app.get('/urls/:shortURL', (req, res) => {
  if (req.params.shortURL in urlDatabase) {
    res.render('urls_show', {
      key: req.params.shortURL,
      url: urlDatabase[req.params.shortURL],
      user_id: findUser(req.cookies.email)
    });
    } else {
      res.render('urls_new', { user_id: findUser(req.cookies.email) });
    }
});

// receives request for specific short url page and responds with redirection to the corresponding website
app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// receives request for registration page and responds with registeration page
app.get('/register', (req, res) => {
  res.render('register');
})

// receives form post request to create, generates random short url, stores long url as a value of short url, and redirects to new page created (only creates truthy values)
app.post('/urls', (req, res) => {
  let newShortURL = generateRandomKey(6);
  if (req.body.longURL) {
    urlDatabase[newShortURL] = req.body.longURL;
    res.redirect(`/urls/${newShortURL}`);
  } else {
    res.redirect('/urls/new');
  }
});

// receives form post request to delete, deletes associated short url property from urlDatabase, and redirects to /urls
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect('/urls');
});

// receives form post request to update, updates associated long url from urlDatabase, and redirects to /urls (only updates truthy values)
app.post('/urls/:shortURL', (req, res) => {
  if (req.body.longURL) {
    if (req.params.shortURL in urlDatabase) {
      urlDatabase[req.params.shortURL] = req.body.longURL;
    } else {
      res.redirect(`/urls/${req.params.shortURL}`);
    }
  }
  res.redirect('/urls');
});

// receives form post request to sign in, responds with cookie and redirection to /
app.post('/login', (req, res) => {
  for (let user in users) {
    if (users[user]['email'] === req.body.email && users[user]['password'] === req.body.password) {
      res.cookie('user_id', findUser(req.body.email));
      res.redirect('/');
      return;
    } else if (users[user]['email'] === req.body.email) {
      res.status(403).send('Your email and password do not match.');
    }
  }
  res.status(403).send('Your email is not associated with an account.');
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

