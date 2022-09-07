const express = require('express');
const axios = require('axios');

const secretkey = process.env.GITHUB_API_SECRET;

// Get all
express.get('/projects', async(req, res, next) => {
    try {
        const oauth = {"Authorization": "bearer " + secretkey};
        const query = `{
                            user(login:"stephendpmurphy") {
                                pinnedItems(first: 6, types: [REPOSITORY]) {
                                    totalCount
                                    edges {
                                        node {
                                            ... on Repository {
                                                name,
                                                description,
                                                url,
                                                repositoryTopics(first: 5) {
                                                    totalCount
                                                    edges {
                                                        node {
                                                            topic {
                                                                name
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }`
        const { data } = await axios.post('https://api.github.com/graphql', {query: query}, {headers: oauth})
        const projects = data.data.user.pinnedItems.edges.map( (i) => {
            // For every project we get back from Github, We want to return an object containing the name, url, and array of topics
            return {
                        name: i.node.name,
                        description: i.node.description,
                        url: i.node.url,
                        topics: i.node.repositoryTopics.edges.map( (n) => {
                            return n.node.topic.name;
                        })
                    }
        })

        if( projects.length ) {
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
            res.json(projects);
        }
        else {
            res.status(400);
        }
    }
    catch(err) {
        next(err);
    }
});

module.exports = express;