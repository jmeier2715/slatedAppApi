const express = require('express')
const router = express.Router()
const db = require('../models')
const passport = require('../config/ppConfig.js')
const isLoggedIn = require('../middleware/isLoggedIn')

//get all translations
router.get ('/', isLoggedIn, (req, res, next)=>{
    db.collection.findAll({
        where:{userId: res.locals.currentUser.id}
    })
    .then(()=>{
        db.translation.findAll({
            where: {collectionId: res.collection.id}
        })
    })
    .then((translations)=>{
        return translations.map((translation)=> translation.toObject())
    })
    
})
    
//get one translation
router.get('/:id', isLoggedIn, (req, res, next)=>{
    db.translation.findOne({
        where: {id: req.params.id}
    })
    .then(handle404)
    .then((translation)=>res.status(200).json({ translation: translation.toObject() }))
    .catch(next)
})
//post a new translation
router.post('/', isLoggedIn, (req, res, next)=>{
    db.collection.findAll({
        where:{userId: res.locals.currentUser.id}
    })
    .then(()=>{
        db.translation.findAll({
            where: {collectionId: res.collection.id}
        })
    })
    .then(foundCollection=>{
        console.log('adding new translation to collection')
        foundCollection.createTranslation({
            where:{
                rootText: req.body.rootText,
                rootLanguage: req.body.rootLanguage,
                targetText: req.body.targetText,
                targetLanguage: req.body.targetLanguage,
                collectionId: res.collection.id
            }      
        })
    })
    .then((translation)=>{
        res.status(201).json({translation: translation.toObject() })
    })
    .catch(next)
})
//delete a translation
router.delete('/:id', isLoggedIn, (req, res, next)=>{
    db.translation.findOne({
        where: {id: req.params.id}
    })
    .then(handle404)
    .then((translation)=>{
        translation.deleteOne()
    })
    .then(()=> res.sendStatus(204))
    .catch(next)
})


module.exports = router