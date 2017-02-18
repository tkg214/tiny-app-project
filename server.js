const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'development']
}));

const bcrypt = require('bcrypt');

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const randomstring = require('randomstring');

app.set('view engine', 'ejs');

let urlDatabase = {
  'b2xVn2': { shortURL: 'b2xVn2', longURL: 'http://www.google.com', user: 'UG79xq' },
  '9sm5xK': { shortURL: '9sm5xK', longURL: 'http://www.lighthouselabs.ca', user: 'UG79xq' }
};

let users = {
  UG79xq: { id: 'UG79xq', email: 'tkg214@gmail.com', password: bcrypt.hashSync('a', 10) },
  ABc90s: { id: 'ABc90s', email: 'abc@gmail.com', password: bcrypt.hashSync('b', 10) }
};

let sessions = {}

// generates random string using randomstring module
function generateRandomKey(length) {
  return randomstring.generate(length);
};

// function finds user object based on email
function findUserId(email) {
  for (user in users) {
    if (users[user]['email'] === email) {
      return users[user]['id'];
    }
  }
}

// function finds user object based on user id
function findUserEmail(id) {
  return users[id].email;
}

// function finds a users' posts and returns all instances in an object
function urlsForUser(id) {
  let userURLS = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].user) {
      userURLS[urlDatabase[url].shortURL] = {
        shortURL: urlDatabase[url].shortURL,
        longURL: urlDatabase[url].longURL
      };
    }
  }
  return userURLS;
}

// function that prepends http:// to url if it does not have a protocol
function prependProtocol(url) {
  if (url.slice(0, 7) === 'http://' || url.slice(0, 8) === 'https://') {
    return url;
  } else {
    return 'http://' + url;
  }
}

//function checks if user is authorized
function checkUserById(user_id) {
  for (let id in users) {
    if (user_id === users[id]['id'])
      return true;
  }
}

// receives request for root path, redirects to /urls
app.get('/', (req, res) => {
  let user = checkUserById(req.session.user_id)
  if (user) {
    res.redirect('/urls');
  } else {
  res.redirect('/login');
  }
});

// receives request to show list of urls page and responds with rendered urls_index.ejs
app.get('/urls', (req, res) => {
  let user = checkUserById(req.session.user_id)
  let email = findUserEmail(req.session.user_id);
  if (user) {
    res.render('urls_index', {
      urlDatabase: urlsForUser(req.session.user_id),
      user_id: req.session.user_id,
      email: email
    });
  } else {
    res.status(401).send('You do not have access. <p><a href="/login">Login here</a></p>');
  }
});

// receives request to create new url page and responds with rendered urls_new.ejs
app.get('/urls/new', (req, res) => {
  let user = checkUserById(req.session.user_id)
  let email = findUserEmail(req.session.user_id);
  if (user) {
    res.render('urls_new', {
      user_id: req.session.user_id,
      email: email
    });
  } else {
    res.status(401).send('You do not have access. <p><a href="/login">Login here</a></p>');
  }
});

// receives request to show specific url page and responds with rendered urls_show.ejs template, otherwise responds with urls_new.ejs
app.get('/urls/:shortURL', (req, res) => {
  let user = checkUserById(req.session.user_id)
  if (user) {
    let email = findUserEmail(req.session.user_id);
    if (req.params.shortURL in urlDatabase) {
      res.render('urls_show', {
        shortURL: urlDatabase[req.params.shortURL].shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL,
        user_id: req.session.user_id,
        urlUserId: urlDatabase[req.params.shortURL].user,
        email: email
      });
    } else {
      res.status(404).send('Requested page does not exist. <p><a href="/urls">Back to TinyApp</a></p>');
    }
  } else if ( user ) {
    res.status(403).send('You do not have access. <p><a href="/urls">Back to TinyApp</a></p>')
  } else {
  res.status(401).send('You do not have access. <p><a href="/login">Login here</a></p>');
  }
});

// receives request for specific short url page and responds with redirection to the corresponding website
app.get('/u/:shortURL', (req, res) => {
  if (req.params.shortURL in urlDatabase) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send('Requested page does not exist. <p><a href="/urls">Back to TinyApp</a></p>');
  }
});

// receives request for registration page and responds with registeration page
app.get('/register', (req, res) => {
  if (!req.session.user_id) {
    res.render('register');
  } else {
    res.redirect('/');
  }
});

app.get('/login', (req, res) => {
  if (!req.session.user_id) {
    res.render('login');
  } else {
    res.redirect('/');
  }
});

// receives form post request to create, generates random short url, stores long url as a value of short url, and redirects to new page created (only creates truthy values)
app.post('/urls', (req, res) => {
  let newShortURL = generateRandomKey(6);
  if (req.body.longURL) {
    urlDatabase[newShortURL] = {
      shortURL: newShortURL,
      longURL: prependProtocol(req.body.longURL),
      user: req.session.user_id
    };
    res.redirect(`/urls/${newShortURL}`);
  } else {
    res.redirect('/urls/new');
  }
});

// have login check

// receives form post request to delete, deletes associated short url property from urlDatabase, and redirects to /urls
app.delete('/urls/:shortURL', (req, res) => {
  for (let user in users) {
    if (req.session.user_id === users[user]['id'] && req.session.user_id === urlDatabase[req.params.shortURL].user) {
      delete urlDatabase[req.params.shortURL];
      res.redirect('/');
      return;
    } else {
      res.status(403).send('You do not have access. <p><a href="/urls">Back to TinyApp</a></p>')
    }
  }
  res.status(401).send('You do not have access. <p><a href="/urls">Back to TinyApp</a></p>')
});

// receives form post request to update, updates associated long url from urlDatabase, and redirects to /urls (only updates truthy values)
app.put('/urls/:shortURL', (req, res) => {
  for (let user in users) {
    if (req.session.user_id === users[user]['id'] && req.session.user_id === urlDatabase[req.params.shortURL].user) {
      if (req.body.longURL) {
        urlDatabase[req.params.shortURL].longURL = prependProtocol(req.body.longURL);
      }
      res.redirect(`/urls/${req.params.shortURL}`);
      return;
    } else {
      res.status(403).send('You do not have access. <p><a href="/urls">Back to TinyApp</a></p>')
      return;
    }
  }
  res.status(401).send('You do not have access. <p><a href="/urls">Back to TinyApp</a></p>')
});

// receives form post request to sign in, responds with cookie and redirection to /
app.post('/login', (req, res) => {
  for (let user in users) {
    if (users[user]['email'] === req.body.email) {
      if (bcrypt.compareSync(req.body.password, users[user]['password'])) {
        req.session.user_id = findUserId(req.body.email);
        res.redirect('/');
        return;
      } else {
        res.status(403).send('Your email and password do not match. <p><a href="/login">Back to Login</a></p>');
        return;
      }
    } else {
      res.status(403).send('Your email and password do not match. <p><a href="/login">Back to Login</a></p>')
      return;
    }
  }
});

// receives form post request to sign out, responds with cookie deletion and redirection to /
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

// receives form post request to register, creates user, and redirects
app.post('/register', (req, res) => {
  if (!req.body.password || !req.body.email) {
    res.status(400).send('Please enter both email and password. <p><a href="/register">Back to Register</a></p>');
    return;
  }
  for (let user in users) {
    if (users[user]['email'] === req.body.email) {
      res.status(400).send('Email already exists. <p><a href="/register">Back to Register</a></p><p><a href="/login">Back to Login</a></p>');
      return;
    }
  }
  let randomId = generateRandomKey(6);
  users[randomId] = {
    id: randomId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  }
  req.session.user_id = randomId;
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

