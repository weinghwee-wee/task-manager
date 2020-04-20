const express = require('express')
const router = new express.Router()
const sharp = require('sharp')
const auth = require('../middlewares/auth')
const multer = require('multer')
const [sendWelcomeEmail, sendCancelEmail] = require('../emails/accounts')
const User = require('../models/user')

router.post('/users', async (req, res) => {
  const user = new User(req.body)

  try {
    await user.save()
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken()

    res.status(201).send({user, token})
  } catch (e) {
    res.status(400).send(e)
  }
})

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
    return res.status(400).send({'error': 'Invalid Update'})
  }

  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update]
    })

    await req.user.save()

    res.send(req.user)
  } catch (e) {
    res.status(400).send(e)
  }
})

router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove()
    sendCancelEmail(req.user.email, req.user.name)
    
    res.send(req.user)
  } catch (e) {
    res.status(500).send()
  }
})

router.post('/users/login', async (req, res) => {
  try {
    const {email, password} = req.body
    const user = await User.findByCredentials(email, password)
    const token = await user.generateAuthToken()

    res.send({user, token})
  } catch (e) {
    console.log(e)
    res.status(400).send()
  }
})

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })

    await req.user.save()

    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

router.post('/users/logoutall', auth, async (req, res) => {
  try {
    req.user.tokens = []

    await req.user.save()

    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter (req, file ,cb) {
    if (!file.originalname.match(/\.(jpg|jpeg)$/)) {
      return cb(new Error('Please upload an image'))
    }

    cb(null, true)
  }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).png().resize({ width: 250, height: 250}).toBuffer()

  req.user.avatar = buffer
  console.log(buffer)
  await req.user.save()

  res.status(200).send()
}, (error, req, res, next) => {
  res.status(404).send({ 'error': error.message })

})

router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  
  res.status(200).send()
}, (error, req, res, next) => {
  res.status(404).send({ 'error': error.message })

})

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error()
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
  } catch (e) {
    res.status(404).send()
  }
}, (error, req, res, next) => {
  res.status(404).send({ 'error': error.message })

})

module.exports = router
