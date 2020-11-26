const express = require('express');
const monk = require('monk');
const Joi = require('@hapi/joi');
const jwt = require('jsonwebtoken');
const router = express.Router();

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost/projects';
const db = monk(DB_URI);
const projects = db.get("projects");

const secretkey = process.env.API_SECRET;

const postSchema = Joi.object({
    name: Joi.string().trim().required(),
    desc: Joi.string().trim().required(),
    proj_url: Joi.string().uri().required(),
    photo_url: Joi.string().uri()
})

// Get all
router.get('/', async(req, res) => {
    try {
        var items = await projects.find({});
        res.json(items);
    }
    catch(err) {
        res.status(400);
    }
});

// Add one
router.post('/', verifyToken, async(req, res) => {
    try {
        // Validate the token
        jwt.verify(req.token, secretkey, (err, data) => {
            if( err ) {
                res.status(403).send({msg:"Forbidden: Invalid token"});
                return;
            }
        });

        // Check if a skill with the same name already exists
        var exists = await projects.findOne({
            name: req.body.name
        });

        // If it doesn't exist. Add it.
        if( !exists ) {
            var value = await postSchema.validateAsync(req.body);
            const inserted = await projects.insert(value);
            res.json(inserted);
        }
        else {
            // The item already exists. Return it in the response
            res.status(400).send({ msg:"Skill already exists.", skill: exists});
        }
    }
    catch(err) {
        res.sendStatus(400);
    }
});

// Update one
router.put('/:id', verifyToken, async(req, res) => {
    try {
        // Validate the token
        jwt.verify(req.token, secretkey, (err, data) => {
            if( err ) {
                res.status(403).send({msg:"Forbidden: Invalid token"});
                return;
            }
        });

        // Validate the incoming body
        const { id } = req.params;
        const value = await postSchema.validateAsync(req.body);

        // Send back a 400 if the schema is incorrect
        if( !value ) res.sendStatus(400).send({msg:"Invalid schema"});

        // Check if a skill with the same name already exists
        var item = await projects.findOne({
            _id: id
        });

        if( item ) {
            // We found an item with that id.. Let's update it.
            await projects.update({
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
        res.sendStatus(400);
    }
});

// Delete one
router.delete('/:id', verifyToken, async(req, res) => {
    try{
        // Validate the token
        jwt.verify(req.token, secretkey, (err, data) => {
            if( err ) {
                res.status(403).send({msg:"Forbidden: Invalid token"});
                return;
            }
        });

        const { id } = req.params;
        await projects.remove({ _id: id });
        res.status(200).send({msg:"Item deleted"});
    }
    catch(err) {
        res.status(400);
    }
});


// Verify the token exists in the req header
function verifyToken(req, resp, next) {
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