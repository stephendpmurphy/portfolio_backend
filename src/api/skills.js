const express = require('express');
const monk = require('monk');
const Joi = require('@hapi/joi');
const jwt = require('jsonwebtoken');
const router = express.Router();

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost/skills';
const db = monk(DB_URI);
const skills = db.get("skills");

const secretkey = process.env.API_SECRET;

const postSchema = Joi.object({
    skill: Joi.string().trim().required()
})

// Get all
router.get('/', async(req, res, next) => {
    try {
        var items = await skills.find({});
        res.json(items);
    }
    catch(err) {
        next(err);
    }
});

// Add one
router.post('/', verifyToken, async(req, res, next) => {
    try {
        // Validate the token
        jwt.verify(req.token, secretkey, (err, data) => {
            if( err ) {
                res.status(403).send({msg:"Forbidden: Invalid token"});
                next();
            }
        });

        // Check if a skill with the same name already exists
        var exists = await skills.findOne({
            skill: req.body.skill
        });

        // If it doesn't exist. Add it.
        if( !exists ) {
            var value = await postSchema.validateAsync(req.body);
            const inserted = await skills.insert(value);
            res.json(inserted);
        }
        else {
            // The item already exists. Return it in the response
            res.status(400).send({ msg:"Skill already exists.", skill: exists});
        }
    }
    catch(err) {
        next(err);
    }
});

// Update one
router.put('/:id', verifyToken, async(req, res, next) => {
    try {
        // Validate the token
        jwt.verify(req.token, secretkey, (err, data) => {
            if( err ) {
                res.status(403).send({msg:"Forbidden: Invalid token"});
                next();
            }
        });

        // Validate the incoming body
        const { id } = req.params;
        const value = await postSchema.validateAsync(req.body);

        // Send back a 400 if the schema is incorrect
        if( !value ) res.sendStatus(400).send({msg:"Invalid schema"});

        // Check if a skill with the same name already exists
        var item = await skills.findOne({
            _id: id
        });

        if( item ) {
            // We found an item with that id.. Let's update it.
            await skills.update({
                _id: id
            }, {
                $set: {
                    skill: value.skill
                }
            });

            // Respond with the updated object
            res.json(value);
        }
        else {
            res.sendStatus(400).send({msg:`Skill with an id of ${req.params.id} does not exist`});
        }
    }
    catch {
        next(err);
    }
});

// Delete one
router.delete('/:id', verifyToken, async(req, res, next) => {
    try{
        // Validate the token
        jwt.verify(req.token, secretkey, (err, data) => {
            if( err ) {
                res.status(403).send({msg:"Forbidden: Invalid token"});
                // Move on to the next middleware
                next();
            }
        });

        const { id } = req.params;

        // Find the item we are wanting to delete
        var item = await projects.findOne({
            _id: id
        })

        if( item ) {
            // Now that we found it, remove it.
            await projects.remove({ _id: id });
            res.status(200).send({msg:"Item deleted"});
        }
        else {
            res.status(400).send({msg:`Could not find a skill with an id of ${id}`})
        }
    }
    catch(err) {
        next(err);
    }
});

// Verify the token exists in the req header
function verifyToken(req, res, next) {
    // Get the auth header value
    const bearerToken = req.headers['authorization'];

    if( typeof(bearerToken) !== 'undefined' ) {
        // Set the token
        req.token = bearerToken;
        // Move onto the next middleware
        next();
    }
    else {
        // Forbidden
        res.status(403).send({msg:"Forbidden: Invalid token"});
    }
}

module.exports = router;