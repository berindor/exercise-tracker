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

app.post('/api/users', urlencodedParser, async (req, res) => {
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
});
