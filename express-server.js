const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const randomstring = require('randomstring')

app.set('view engine', 'ejs')

let urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/', (req, res) => {
  res.end('Hello!');
});

// receives request to show specific url page and responds with .ejs template
app.get('/urls', (req, res) => {
  res.render('urls-index', { urls: urlDatabase });
});

// receives request to show specific url page and responds with .ejs template, otherwise responds with form
app.get('/urls/:id', (req, res) => {
  if (req.params.id in urlDatabase) {
    res.render('urls-show', {
      key: req.params.id,
      url: urlDatabase[req.params.id]
    });
    } else {
      res.render('urls-new');
    }
});

// redirects to long URL
app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// receives form post and redirects to new page created
app.post('/urls', (req, res) => {
  let newShortURL = generateRandomString(6);
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

// generates random string using randomstring module
function generateRandomString(length) {
  return randomstring.generate(length);
};


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

