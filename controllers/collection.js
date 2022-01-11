const express = require('express')
const router = express.Router()
const db = require('../models')
const passport = require('../config/ppConfig.js')
const isLoggedIn = require('../middleware/isLoggedIn')


//get all collections
router.get ('/', isLoggedIn, (req, res, next)=>{
    db.collection.findAll({
        where: {userId: res.locals.currentUser.id}
    })
    .then((collections)=>{
        return collections.map((collection)=> collection.toObject())
    })
    .then((collections)=> res.status(200).json({collections: collections}))
    .catch(next)
})


//get one collection
router.get('/:id', isLoggedIn, (req, res, next)=>{
    db.collection.findByPk({
        where: {collectionId: req.params.id}
    })
    .then(handle404)
    .then((collection)=>res.status(200).json({ example: example.toObject() }))
    .catch(next)
})


//post a new collection
router.post('/', isLoggedIn, (req, res, next)=>{
    db.user.findOne({
        where: {id: res.locals.currentUser.id}
    })
    .then(foundUser=>{
        console.log('adding collection to user')
        foundUser.createCollection({
            title: req.body.title,
            userId: res.locals.currentUser.id
        })
        .then((collection)=>{
            res.status(201).json({collection: collection.toObject() })
        })
        .catch(next)
    })
})    
//delete a collection
router.delete('/:id', isLoggedIn, (req, res)=>{
    db.collection.findByPk({
        where: {collectionId: req.params.id}
    })
    .then(handle404)
    .then((collection)=>{
        collection.deleteOne()
    })
    .then(()=> res.sendStatus(204))
    .catch(next)
})
   


module.exports = router


//include a createcollection render separately