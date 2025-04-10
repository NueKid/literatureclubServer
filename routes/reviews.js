const express = require('express');
const Review = require('../models/review');
const authenticate = require('../authenticate');
const User = require('../models/user');

const reviewRouter = express.Router();

reviewRouter.route('/')
.get(authenticate.verifyUser, (req, res) => {
    Review.find()
    .populate('author')
    .then(reviews => {
        console.log('Review Created', reviews);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(reviews);
    })
    // res.status = 403;
    // res.end('GET operation not supperted on /reviews');
})
.post(authenticate.verifyUser, (req, res, next) => { // Add admin privileges
    req.body.author = req.user._id
    Review.create(req.body)
    .then(review => {
        // console.log('Review Created', review);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(review);
    })
    .catch(err => next(err));
})
.put((req, res) => {
    res.status = 403;
    res.end('PUT operation not supperted on /reviews');
})
.delete(authenticate.verifyUser, (req, res, next) => { // Add admin privileges
    Review.deleteMany()
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    }).catch(err => next(err));
})

reviewRouter.route('/:reviewId')
.get(authenticate.verifyUser, (req, res, next) => {
    Review.findById(req.params.reviewId)
    .populate('author')
    .then(review => {
        if (review) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(review);
        } else {
            err = new Error(`Review ${req.params.reviewId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    res.status = 403;
    res.end('POST operation not supperted on /reviews');
})
.put(authenticate.verifyUser, (req, res, next) => {
    Review.findById(req.params.reviewId)
    .then(review => {
        console.log(review)
        if (review) {
            if ((review.author._id).equals(req.user._id)) {
                if (req.body.rating) {
                    review.rating = req.body.rating;
                }
                if (req.body.text) {
                    review.text = req.body.text;
                }
                review.save()
                .then(review => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(review);
                })
                .catch(err => next(err));
            } else {
                err = new Error(`You are not authorized to edit Review ${req.params.reviewId}`);
                err.status = 403;
                return next(err);
                
            }
        } else {
            err = new Error(`Review ${req.params.reviewId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => { // Add admin privileges 
    Review.findById(req.params.reviewId)
    .then(review => {
        if (review) {
            if ((review.author._id).equals(req.user._id)) {
                review.deleteOne()
                .then(review => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(review);
                })
                .catch(err => next(err));
            } else {
                err = new Error(`You are not authorized to edit Review ${req.params.reviewId}`);
                err.status = 403;
                return next(err);
            }
        } else {
            err = new Error(`Review ${req.params.reviewId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
});

module.exports = reviewRouter;