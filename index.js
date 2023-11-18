const express = require('express');
const app = express();
const cors = require('cors');
const bodyparser = require("body-parser") 
const mongoose = require('mongoose');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Connect to MongoDB
mongoose.connect("mongodb+srv://alexindevs:fWadHD8eaCE0BDIh@exercisetracker.kd1amdm.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Mongoose Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

// Define Mongoose Models
const UserModel = mongoose.model('User', userSchema);
const ExerciseModel = mongoose.model('Exercise', exerciseSchema);

// Routes

// Create a new user
app.post('/api/users', bodyparser.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { username } = req.body;
    const user = await UserModel.create({ username });
    res.json(user);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a list of all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await UserModel.find({}, '_id username');
    res.json(users);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add an exercise for a user
app.post('/api/users/:_id/exercises', bodyparser.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const { _id } = req.params;

    // Validate if the user exists
    const user = await UserModel.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exercise = await ExerciseModel.create({
      userId: _id,
      description,
      duration,
      date,
    });

    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get the exercise log of a user
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
      const user = await UserModel.findById(req.params._id);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      let search = { userId: req.params._id };

      if (req.query.from || req.query.to) {
          search.date = {};
          if (req.query.from) search.date["$gt"] = new Date(req.query.from);
          if (req.query.to) search.date["$lt"] = new Date(req.query.to);
      }

      let exercises;

      if (req.query.limit) {
          const limit = parseInt(req.query.limit, 10);
          console.log(limit)
          exercises = await ExerciseModel.find(search).limit(limit);
      } else {
          exercises = await ExerciseModel.find(search);
      }

      const log = exercises.map(exercise => ({
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString()
      }));
      console.log(user.username, log.length, req.params._id, log)
      res.json({
          username: user.username,
          count: log.length,
          _id: req.params._id,
          log: log
      });
  } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
