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


// receives request for root path, redirects to /urls
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// receives request to show list of urls page and responds with rendered urls_index.ejs
app.get('/urls', (req, res) => {
  res.render('urls_index', {
    urls: urlDatabase,
    username: req.cookies.username
  });
});

// receives request to show specific url page and responds with rendered urls_show.ejs template, otherwise responds with urls_new.ejs
app.get('/urls/:shortURL', (req, res) => {
  if (req.params.shortURL in urlDatabase) {
    res.render('urls_show', {
      key: req.params.shortURL,
      url: urlDatabase[req.params.shortURL],
      username: req.cookies.username
    });
    } else {
      res.render('urls_new', { username: req.cookies.username });
    }
});

// receives request for specific short url page and responds with redirection to the corresponding website
app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// receives form post request to create, generates random short url, stores long url as a value of short url, and redirects to new page created
app.post('/urls', (req, res) => {
  let newShortURL = generateRandomKey(6);
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

// receives form post request to delete, deletes associated short url property from urlDatabase, and redirects to /urls
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect('/urls');
});

// receives form post request to update, updates associated long url from urlDatabase, and redirects to /urls
app.post('/urls/:shortURL', (req, res) => {
  if (req.params.shortURL in urlDatabase) {
    urlDatabase[req.params.shortURL] = req.body.longURL;
  }
  res.redirect('/urls');
});

// receives form post request to sign in, responds with cookie and redirection to /
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/');
});

// receives form post request to sign out, responds with cookie deletion and redirection to /
app.post('/logout', (req, res) => {
  res.clearCookie('username')
  res.redirect('/');
});


// generates random string using randomstring module
function generateRandomKey(length) {
  return randomstring.generate(length);
};


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

