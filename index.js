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
  username: String,
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
    const userList = await Users.find({}, '-__v');
    res.json(userList);
    return userList;
  });

function createDateString(dateInput) {
  const dateRegex = /\d{4}-\d{2}-\d{2}/;
  if (dateInput === '' || dateInput === undefined) {
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

function dateFormatChecker(dateInput, fieldName) {
  if (dateInput === '' || dateInput === undefined) {
    return '';
  }
  if (createDateString(dateInput) === 'Invalid format') {
    return { error: `Invalid date format in ${fieldName} field.` };
  }
  if (createDateString(dateInput) === 'Invalid date') {
    return { error: `Invalid date in ${fieldName} field.` };
  }
  return '';
}

app.post('/api/users/:userid/exercises', urlencodedParser, async (req, res) => {
  try {
    const isValidIdFormat = mongoose.Types.ObjectId.isValid(req.params.userid);
    if (!isValidIdFormat) {
      res.json({ error: 'Invalid user id format.' });
      return;
    }
    const user = await Users.findById(req.params.userid);
    if (!user) {
      res.json({ error: 'User does not exist.' });
    } else {
      if (!req.body.description) {
        res.json({ error: 'Description is mandatory.' });
        return;
      }
      if (!req.body.duration) {
        res.json({ error: 'Duration is mandatory.' });
        return;
      }
      if (dateFormatChecker(req.body.date, 'date') !== '') {
        res.json(dateFormatChecker(req.body.date, 'date'));
      }
      const dateString = createDateString(req.body.date);
      const exerciseData = {
        description: req.body.description,
        duration: Number(req.body.duration),
        date: dateString
      };
      await Exercises.create({ userid: user._id, username: user.username, ...exerciseData });
      const responseObject = { _id: user._id, username: user.username, ...exerciseData };
      res.json(responseObject);
    }
  } catch {
    res.sendStatus(500);
  }
});

app.get('/api/users/:userid/logs', async (req, res) => {
  try {
    const isValidIdFormat = mongoose.Types.ObjectId.isValid(req.params.userid);
    if (!isValidIdFormat) {
      res.json({ error: 'Invalid user id format.' });
      return;
    }
    const user = await Users.findById(req.params.userid);
    if (!user) {
      res.json({ error: 'User does not exist.' });
      return;
    }
    const allExerciseList = await Exercises.find({ userid: user._id }, '-_id description duration date').lean();
    const from = req.query.from;
    const to = req.query.to;
    const limit = req.query.limit;
    console.log('limit: ', limit, 'number: ', Number(limit), 'string: ', Number(limit).toString(), 'true? ', limit === Number(limit).toString());
    if (dateFormatChecker(from, 'from') !== '') {
      res.json(dateFormatChecker(from, 'from'));
      return;
    }
    if (dateFormatChecker(to, 'to') !== '') {
      res.json(dateFormatChecker(to, 'to'));
      return;
    }
    if (limit === 'NaN' || (limit !== Number(limit).toString() && limit !== '' && limit !== undefined)) {
      res.json({ error: 'The limit must be a number or empty.' });
      return;
    }
    let dateFilteredList = allExerciseList;
    let exerciseList = dateFilteredList;
    if (limit === Number(limit).toString() && limit !== 'NaN') {
      exerciseList = dateFilteredList.slice(0, Number(limit));
    }
    res.json({ username: user.username, _id: user._id, count: exerciseList.length, log: exerciseList });
  } catch {
    res.sendStatus(500);
  }
});

//to remove test data
app.get('/api/remove/testuser', async (req, res) => {
  const nameToRemove = /^fcc/;
  const deleted = await Users.deleteMany({ username: nameToRemove });
  res.json({ removed: `${deleted.deletedCount} users` });
});
app.get('/api/remove/testexercise', async (req, res) => {
  const nameToRemove = /^test/;
  const deleted = await Exercises.deleteMany({ description: nameToRemove });
  res.json({ removed: `${deleted.deletedCount} exercises` });
});
