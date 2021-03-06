const express = require('express');
const moment = require('moment');
const {isNullOrUndefined} = require('util');


// Model
const Post = require('../../models/post');
const Category = require('../../models/category');
const User = require('../../models/user');
const Comment = require('../../models/comment');

const auth = require('../../middleware/auth');

const router = express.Router();

const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
dotenv.config();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_PRIVATE_KEY
})

const uploadS3 = multer({
    storage: multerS3({
        s3,
        bucket: "bytrustu-blog",
        region: 'ap-northeast-2',
        key(req, file, cb) {
            const ext = path.extname(file.originalname);
            const basename = path.basename(file.originalname, ext);
            cb(null, basename + new Date().valueOf() + ext);
        }
    }),
    limits: {fileSize: 100 * 1024 * 1024},
})

// @route   POST api/post/image
// @desc    Create a Post
// @access  Private

router.post("/image", uploadS3.array("upload", 5), async (req, res, next) => {
    try {
        res.json({uploaded: true, url: req.files.map((v) => v.location)});
    } catch (e) {
        console.error(e);
        res.json({uploaded: false, url: null});
    }
});

router.get('/', async (req, res) => {
    // api /post
    const postFindResult = await Post.find();
    const categoryFindResult = await Category.find();
    const result = {postFindResult, categoryFindResult};
    res.json(result);
});

//  @route  POST api/post
//  @desc   Create a Post
//  @access Private
router.post("/", auth, uploadS3.none(), async (req, res, next) => {
    try {
        const {title, contents, fileUrl, creator, category} = req.body;
        const newPost = await Post.create({
            title,
            contents,
            fileUrl,
            creator: req.user.id,
            date: moment().format("YYYY-MM-DD hh:mm:ss"),
        });

        const findResult = await Category.findOne({
            categoryName: category,
        });

        if (isNullOrUndefined(findResult)) {
            const newCategory = await Category.create({
                categoryName: category,
            });
            await Post.findByIdAndUpdate(newPost._id, {
                $push: {category: newCategory._id},
            });
            await Category.findByIdAndUpdate(newCategory._id, {
                $push: {posts: newPost._id},
            });
            await User.findByIdAndUpdate(req.user.id, {
                $push: {
                    posts: newPost._id,
                },
            });
        } else {
            await Category.findByIdAndUpdate(findResult._id, {
                $push: {posts: newPost._id},
            });
            await Post.findByIdAndUpdate(newPost._id, {
                category: findResult._id,
            });
            await User.findByIdAndUpdate(req.user.id, {
                $push: {
                    posts: newPost._id,
                },
            });
        }
        return res.redirect(`/api/post/${newPost._id}`);
    } catch (e) {
        console.log(e);
    }
});

// @route   POST api/post/:id
// @desc    Detail Post
// @access  Public

router.get('/:id', async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("creator", "name")
            .populate({path: "category", select: "categoryName"});
        post.views += 1;
        post.save();
        res.json(post);
    } catch (e) {
        console.error(e);
        next(e);
    }
})


// [Comments Route]
// @route Get api/post/comments
// @desc Get All Comments
// @access public

router.get('/:id/comments', async (req, res) => {
    try {
        const comment = await Post.findById(req.params.id).populate({
            path: 'comments'
        })
        const result = comment.comments;
        res.json(result);
    } catch (e) {
        console.log(e);
        res.redirect('/');
    }
});

router.post('/:id/comments', async (req, res, next) => {
    const newComment = await Comment.create({
        contents: req.body.contents,
        creator: req.body.userId,
        creatorName: req.body.userName,
        post: req.body.id,
        date: moment().format('YYYY-MM-DD hh:mm:ss')
    });
    try {
        await Post.findByIdAndUpdate(req.body.id, {
            $push: {
                comments: newComment._id
            }
        })
        await User.findByIdAndUpdate(req.body.id, {
            $push: {
                comments: {
                    post_id: req.body.id,
                    comment_id: newComment._id
                }
            }
        })
        res.json(newComment);
    } catch (e) {
        console.error(e);
        next(e);
    }
});


// @route    Delete api/post/:id
// @desc     Delete a Post
// @access   Private

router.delete("/:id", auth, async (req, res) => {
    await Post.deleteMany({ _id: req.params.id });
    await Comment.deleteMany({ post: req.params.id });
    await User.findByIdAndUpdate(req.user.id, {
        $pull: {
            posts: req.params.id,
            comments: { post_id: req.params.id },
        },
    });
    const CategoryUpdateResult = await Category.findOneAndUpdate(
        { posts: req.params.id },
        { $pull: { posts: req.params.id } },
        { new: true }
    );

    if (CategoryUpdateResult.posts.length === 0) {
        await Category.deleteMany({ _id: CategoryUpdateResult });
    }
    return res.json({ success: true });
});

// @route   GET api/post/:id/edit
// @desc    Edit Post
// @access  Private
router.get('/:id/edit', auth, async(req, res, next) => {
    try {
        const post = await Post.findById(req.params.id).populate('creator', 'name');
        res.json(post);
    } catch (e) {
        console.error(e);
    }
});

// @route   POST api/post/:id/edit
// @desc    Edit Post
// @access  Private
router.post('/:id/edit', auth, async(req, res, next) => {
   try {
       const {body: {title, contents, fileUrl, id}} = req;
       const modified_post = await Post.findByIdAndUpdate(
           id, {
               title, contents, fileUrl, date: moment().format('YYYY-MM-DD hh:mm:ss')
           },
           { new: true }
       )
       res.redirect(`/api/post/${modified_post.id}`);
   }  catch (e) {
       console.error(e);
       next(e);
   }
});

// @route   GET /category/:categoryName
// @desc    Search Category
// @access  Public
router.get('/category/:categoryName', async (req, res, next) => {
   try {
       const result = await Category.findOne({
           categoryName: {
               $regex: req.params.categoryName,
               $options: 'i'
           }
       }, 'posts').populate({path: 'posts'})
       res.send(result);
   } catch (e) {
       console.log(e);
       next(e);
   }
});




//  @route    GET api/post
//  @desc     More Loading Posts
//  @access   public
router.get("/skip/:skip", async (req, res) => {
    try {
        const postCount = await Post.countDocuments();
        const postFindResult = await Post.find()
            .skip(Number(req.params.skip))
            .limit(6)
            .sort({ date: -1 });

        const categoryFindResult = await Category.find();
        const result = { postFindResult, categoryFindResult, postCount };

        res.json(result);
    } catch (e) {
        console.log(e);
        res.json({ msg: "더 이상 포스트가 없습니다" });
    }
});




module.exports = router;