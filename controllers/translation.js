const express = require('express')
const router = express.Router()
const db = require('../models')
const passport = require('../config/ppConfig.js')


//get all translations
router.get ('/', (req, res)=>{})
//get one translation
router.get('/', (req, res)=>{})
//post a new translation
router.post('/', (req, res)=>{})
//delete a translation
router.delete('/', (req, res)=>{})


module.exports = router