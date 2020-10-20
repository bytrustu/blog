const express = require('express');

// Model
const Post = require('../../models/post');

const router = express.Router();

router.get('/', async(req, res) => {
    // api /post
    const postFindResult = await Post.find();
    console.log(postFindResult, "All Post Get");
    res.json(postFindResult);
});

router.post('/', async(req, res, next) => {
    try {
        console.log(req, "req");
        const {title, contents, fileUrl, creator} = req.body;
        const newPost = await Post.create({
            title,
            contents,
            fileUrl,
            creator
        });
        res.json(newPost);
    } catch (e) {
        console.log(e);
    }
})

module.exports = router;