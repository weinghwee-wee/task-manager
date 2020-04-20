const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const Task = require('../models/task')

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  })

  try {
    await task.save()
    res.status(201).send(task)
  } catch (e) {
    res.status(400).send(e)
  }
})

router.get('/tasks', auth, async (req, res) => {
  try {
    const {completed, limit, skip, sortBy} = req.query
    const match = {}
    const sort = {}

    if (completed) {
      match.completed = completed === 'true'
    }

    if (sortBy) {
      const [criteria, arrangement] = sortBy.split(':')
      sort[criteria] = arrangement === 'desc' ? -1 : 1
    }
    // const tasks = await Task.find({owner: req.user._id})
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        sort
      }
    }).execPopulate()
    
    res.send(req.user.tasks)
  } catch (e) {
    res.status(500).send(e)
  }
})

router.get('/tasks/:id', auth, async (req, res) => {
  const {id} = req.params

  try {
    const task = await Task.findOne({ _id: id, 'owner': req.user._id})

    if (!task) {
      return res.status(404).send()
    }

    res.send(task)
  } catch (e) {
    res.status(500).send(e)
  }
})

router.patch('/tasks/:id', auth, async (req, res) => {
  const {id} = req.params
  const updates = Object.keys(req.body)
  const allowedUpdates = ['completed']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
    return res.status(400).send({'error': 'Invalid Update'})
  }

  try {
    const task = await Task.findOne({ _id: id, owner: req.user._id})

    if (!task) {
      return res.status(404).send()
    }

    updates.forEach((update) => {
      task[update] = req.body[update]
    })

    await task.save()

    res.send(task)
  } catch (e) {
    res.status(400).send(e)
  }
})



router.delete('/tasks/:id', auth, async (req, res) => {
  const {id} = req.params

  try {
    const task = await Task.findOneAndDelete({_id: id, owner: req.user._id})

    if (!task) {
      return res.status(404).send()
    }
    
    res.send(task)
  } catch (e) {
    res.status(500).send()
  }
})

module.exports = router