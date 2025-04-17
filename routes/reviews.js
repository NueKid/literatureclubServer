const express = require('express');
const Review = require('../models/review');
const authenticate = require('../authenticate');
const User = require('../models/user');
const cors = require('./cors');

const reviewRouter = express.Router();

reviewRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res) => {
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
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => { // Add admin privileges
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
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.status = 403;
    res.end('PUT operation not supperted on /reviews');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { // Add admin privileges
    Review.deleteMany()
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    }).catch(err => next(err));
})

reviewRouter.route('/:reviewId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
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
.post(cors.corsWithOptions, authenticate.verifyUser,  authenticate.verifyAdmin, (req, res, next) => {
    res.status = 403;
    res.end('POST operation not supperted on /reviews');
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Review.findById(req.params.reviewId)
    .then(review => {
        console.log(review)
        if (review) {
            if ((review.author._id).equals(req.user._id) || req.user.admin) {
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
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => { // Add admin privileges 
    Review.findById(req.params.reviewId)
    .then(review => {
        if (review) {
            if ((review.author._id).equals(req.user._id) || req.user.admin) {
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