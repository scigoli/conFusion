var express = require('express');
var bodyParser = require('body-parser');
var Verify = require('./verify');

// wire-up
var mongoose = require('mongoose');
var Favorites = require('../models/favorites');
//
var app = express();
var favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.get(Verify.verifyOrdinaryUser, function (req, res, next) {
    // return the list of all the dishes that have been favorited by the user
    // null is returned if favorites are not available for current user
    Favorites.findOne({postedBy: req.decoded._id})
        .populate('postedBy')
        .populate('dishes')
        .exec(function (err, favorite) {
          if (err) throw err;
          res.json(favorite);
    });
})

.post(Verify.verifyOrdinaryUser, function (req, res, next) {
      var query = { postedBy: req.decoded._id };
      // look for user in postedBy, creates the object if it doesn't exist
      Favorites.findOneAndUpdate(query, { $set: { postedBy: req.decoded._id } }, { upsert: true, new: true }, function (err, favorite) {
        if (err) throw err;

        if(favorite.dishes.indexOf(req.body._id)<0) {
          favorite.dishes.push(req.body._id);
        }

        favorite.save(function (err, favorite) {
          if (err) throw err;
          console.log('Updated Favorite!');
          res.json(favorite);
        });


      });
})

.delete(Verify.verifyOrdinaryUser, function (req, res, next) {
    Favorites.findOneAndRemove({postedBy: req.decoded._id}, function (err, resp) {
        if (err) throw err;
        // returns the deleted object
        res.json(resp);
    });
});

favoriteRouter.route('/:dishId')
.delete(Verify.verifyOrdinaryUser, function (req, res, next) {
        // look for an object with the favorites of current user
        // if found, remove from the favorites the dish specified as param
        Favorites.findOne({postedBy:req.decoded._id}, function (err, favorites) {

        if(err) {
          var err = new Error('Favorites not found for current user');
          err.status = 404;
          return next(err);
        }

        // Look for the dish ID to be removed
        var index= favorites.dishes.indexOf(req.params.dishId);
        if(index>=0) {
          favorites.dishes.splice(index,1);
        }
        else {
          var err = new Error('Dish not found in favorites');
          err.status = 404;
          return next(err);
        }

        favorites.save(function (err, resp) {
            if (err) throw err;

            // returns the remaining objects
            res.json(resp);
        });
      });
});


module.exports = favoriteRouter;
