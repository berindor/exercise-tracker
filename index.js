const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

//basic configuration
app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(process.env.PORT || 3300, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

//app starts here
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(urlencodedParser);

mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  username: String
});

const exerciseSchema = new mongoose.Schema({
  userid: String,
  description: String,
  duration: Number,
  date: String
});

let Users = mongoose.model('User', userSchema);

let Exercises = mongoose.model('Exercise', exerciseSchema);

app
  .route('/api/users')
  .post(urlencodedParser, async (req, res) => {
    if (!req.body.username) {
      res.json({ error: 'You should add a non-empty username.' });
    } else {
      let user = await Users.findOne({ username: req.body.username });
      if (!user) {
        await Users.create({ username: req.body.username });
        user = await Users.findOne({ username: req.body.username });
        res.json(user);
      } else {
        res.json({ 'User already exists': user });
      }
    }
  })
  .get(async (req, res) => {
    const userList = await Users.find({});
    res.json(userList);
    return userList;
  });

app.post('/api/users/:userid/exercises', urlencodedParser, async (req, res) => {
  let user = await Users.findOne({ _id: req.params.userid });
  function createDateString(dateInput) {
    const dateRegex = /\d{4}-\d{2}-\d{2}/;
    if (dateInput === '') {
      const date = new Date();
      return date.toDateString();
    } else if (!dateRegex.test(dateInput)) {
      return 'Invalid format';
    } else {
      const date = new Date(dateInput);
      if (date.toString() === 'Invalid Date') {
        return 'Invalid date';
      }
      return date.toDateString();
    }
  }

  if (!user) {
    res.json({ error: 'User does not exist.' });
  } else {
    if (!req.body.description) {
      res.json({ error: 'Description is mandatory.' });
    } else if (!req.body.duration) {
      res.json({ error: 'Duration is mandatory.' });
    } else if (createDateString(req.body.date) === 'Invalid format') {
      res.json({ error: 'Invalid time format.' });
    } else if (createDateString(req.body.date) === 'Invalid date') {
      res.json({ error: 'Invalid date.' });
    } else {
      const dateString = createDateString(req.body.date);
      await Exercises.create({ userid: req.params.userid, description: req.body.description, duration: req.body.duration, date: dateString });
    }
  }
});

//app.get('api/users/:userid/...')
//({username: '', description: '', duration: '', date: '', userid: ''});

//to remove test data
app.get('/api/remove/tests', async (req, res) => {
  const nameToRemove = /^fcc/;
  const deleted = await Users.deleteMany({ username: nameToRemove });
  res.json({ removed: `${deleted.deletedCount} users` });
});
