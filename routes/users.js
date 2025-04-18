const express = require('express');
const User = require('../models/user');
const passport = require('passport');
const authenticate = require('../authenticate');
const user = require('../models/user');
const cors = require('./cors');

const router = express.Router();

// GET user listings
router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, function (req, res, next) {
    User.find()
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
});

router.get('/facebook/token', passport.authenticate('facebook-token', { session: false }), (req, res) => {
    if (req.user) {
        const token = authenticate.getToken({_id: req.user._id});
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, token: token, status: 'You are successfully logged in!'});
    }
});

router.get('/:userId', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    User.findById(req.params.userId)
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
});

router.post('/signup', cors.corsWithOptions, (req, res) => {
    const user = new User({username: req.body.username});

    User.register(user, req.body.password)
        .then(registeredUser => {
            if (req.body.firstname) {
                registeredUser.firstname = req.body.firstname;
            }
            if (req.body.lastname) {
                registeredUser.lastname = req.body.lastname;
            }
            return registeredUser.save();
        })
        .then(() => {
            passport.authenticate('local')(req,res, () => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({success: true, status: 'Registration Successful!'});
        });
        })
        .catch(err => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({err: err});
        });
});

router.post('/login', cors.corsWithOptions, passport.authenticate('local', {session: false}), (req, res) => {
    const token = authenticate.getToken({_id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true, token: token, status: 'You are successfully logged in!'});
});

router.get('/logout', cors.corsWithOptions, (req, res, next) => {
    if (req.session) {
        req.session.destroy();
        res.clearCookie('session-id');
        res.redirect('/');
    } else {
        const err = new Error('You are not logged in!');
        err.status = 401;
        return next(err);
    }
});

router.post('/logout', cors.corsWithOptions, (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

router.route('/:userId/readinglist')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        User.findById(req.params.userId)
        .then(user => {
            if (user) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'appplication/json');
                res.json(user.readinglist);
            } else {
                err = new Error(`User ${req.params.userId} not found`);
                err.status = 404;
                return next(err);
            }
        })
        .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /users/${req.params.userId}/readinglist`);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        User.findById(req.params.userId)
        .then(user => {
            if (user && user._id.equals(req.user._id)) {
                if (!user.readinglist.some(book => book.key === req.body.key)) {
                    user.readinglist.push(req.body)
                    user.save()
                    .then(user => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(user.readinglist);
                    })
                    .catch(err => next(err));
                } else {
                    err = new Error(`Book ${req.body.title} already exists in reading list`);
                    err.status = 404;
                    return next(err);
                }
            } else {
                err = new Error(`You are not authorized to add Book ${req.body.title} to this reading list`);
                err.status = 403;
                return next(err);
            }
        })
        .catch(err => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`DELETE operation not supported on /users/${req.params.userId}/readinglist`);
    })

    router.route('/:userId/readinglist/:bookId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        User.findById(req.params.userId)
        .then(user => {
            if(user && user.readinglist.id(req.params.bookId)) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(user.readinglist.id(req.params.bookId));
            } else if (!user) {
                err = new Error(`User ${req.params.userId} not found`);
                err.status = 404;
                return next(err);
            } else {
                err = new Error(`Book ${req.params.bookId} not found in reading list`);
                err.status = 404;
                return next(err);
            }
        })
        .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /users/${req.params.userId}/readinglist/${req.params.bookId}`);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        User.findById(req.params.userId)
        .then(user => {
            if (user && user._id.equals(req.user._id)) {
                if(user && user.readinglist.id(req.params.bookId)) {
                    if(req.body.markRead) {
                        user.readinglist.id(req.params.bookId).markRead = req.body.markRead;
                    }
                    user.save()
                    .then(user => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(user.readinglist.id(req.params.bookId));
                    })
                    .catch(err => next(err));
                } else if (!user) {
                    err = new Error(`User ${req.params.userId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`Book ${req.params.bookId} not found in reading list`);
                    err.status = 404;
                    return next(err);
                }
            } else {
                err = new Error(`You are not authorized to update Book ${req.params.bookId} in this reading list`);
                err.status = 403;
                return next(err);
            }
        })
        .catch(err => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        user.findById(req.params.userId)
        .then(user => {
            if (user && user._id.equals(req.user._id)) {
                if (user && user.readinglist.id(req.params.bookId)) {
                    user.readinglist.id(req.params.bookId).deleteOne();
                    user.save()
                    .then(user => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(user.readinglist);
                    })
                    .catch(err => next(err));
                } else if (!user) {
                    err = new Error(`User ${req.params.userId} not found`);
                    err.status = 404;
                    return next(err);
                }
                else {
                    err = new Error(`Book ${req.params.bookId} not found in reading list`);
                    err.status = 404;
                    return next(err);
                }
            } else {
                err = new Error(`You are not authorized to delete Book ${req.params.bookId} from this reading list`);
                err.status = 403;
                return next(err);
            }
        })
    })

module.exports = router;
