const { Router } = require("express");
const { isUser, isOwner, hasInteracted } = require("../middlewares/guards");
const { body, validationResult } = require("express-validator");
const { parseError } = require("../util");
const { create, getAll, getById, update, deleteById, getLastThree, interact } = require("../services/data");

//TODO replace with real router according to exam description
const homeRouter = Router();

homeRouter.get('/', async (req, res) => {
    //This code creates a token and saves it in a cookie
    //const result = await login('John', '123456');
    //const token = createToken(result);
    //res.cookie('token', token)

    const lastThree = await getLastThree();


    res.render('home', { title: 'Home', posts: lastThree });
});

homeRouter.get('/about', (req, res) => {
    res.render('about', { title: 'About' });
});

homeRouter.get('/create', isUser(), (req, res) => {
    res.render('create', { title: 'Create' });
});
homeRouter.post('/create', isUser(),
    body('brand').trim().isLength({ min: 2 }).withMessage('The Name should be atleast 2 characters'),
    body('model').trim().isLength({ min: 5 }).withMessage('The Model should be atleast 5 characters'),
    body('hardDisk').trim().isLength({ min: 5 }).withMessage('The Hard disk should be atleast 5 characters'),
    body('screenSize').trim().isLength({ min: 1 }).withMessage('The Screen size should be atleast 1 characters'),
    body('ram').trim().isLength({ min: 2 }).withMessage('The Ram should be atleast 2 characters'),
    body('operatingSystem').trim().isLength({ min: 5, max: 20 }).withMessage('The Operating system should be between 5 and 20 characters long'),
    body('cpu').trim().isLength({ min: 10, max: 50 }).withMessage('The CPU should be between 10 and 50 characters long'),
    body('gpu').trim().isLength({ min: 10, max: 50 }).withMessage('The GPU should be between 10 and 50 characters long'),
    body('price').trim().notEmpty().withMessage('Price is required').bail().isFloat({ min: 0.01 }).withMessage('Price should be a positive number'),
    body('color').trim().isLength({ min: 2, max: 10 }).withMessage('The Color should be between 2 and 10 characters long'),
    body('weight').trim().isLength({ min: 1 }).withMessage('The Weight size should be atleast 1 characters'),
    body('image').trim().isURL({ require_tld: false, require_protocol: true }).withMessage('The Image should start with http:// or https://'),
    async (req, res) => {
        const { brand, model, hardDisk, screenSize, ram, operatingSystem, cpu, gpu, price, color, weight, image } = req.body;
        try {
            const validation = validationResult(req);
            
            if (!validation.isEmpty()) {
                throw validation.array();
            }

            const authorId = req.user._id;

            const result = await create(req.body, authorId);

            res.redirect('/catalog');
        } catch (err) {
            console.log(err);
            
            res.render('create', { data: { brand, model, hardDisk, screenSize, ram, operatingSystem, cpu, gpu, price, color, weight, image }, errors: parseError(err).errors })
        }
    });

homeRouter.get('/catalog', async (req, res) => {
    const posts = await getAll();
    res.render('catalog', { posts, title: 'Catalog' });
});

homeRouter.get('/catalog/:id', async (req, res) => {

    const id = req.params.id;
    const post = await getById(id);
    
    
    let interactionCount = post.preferredList.length;

    if (!post) {
        res.render('404', { title: 'Error' });
        return;
    };

    const isLoggedIn = req.user;
    
    const isAuthor = req.user?._id == post.owner.toString();
    
    const hasInteracted = Boolean(post.preferredList.find(id => id.toString() == req.user?._id.toString()));

    res.render('details', { post, interactionCount, isLoggedIn, isAuthor, hasInteracted, title: `Details ${post.name}` });
});


homeRouter.get('/catalog/:id/edit', isOwner(), async (req, res) => {
    
    try {
        const post = await getById(req.params.id);

        if (!post) {
            console.log('Blocked');
            
            res.render('404');
            return;
        };

        res.render('edit', { post, title: `Edit ${post.brand}` });
    } catch (err) {
        console.error('Error loading edit form: ', err);
        res.redirect('/404');
    }
});
homeRouter.post('/catalog/:id/edit', isOwner(),
    body('brand').trim().isLength({ min: 2 }).withMessage('The Name should be atleast 2 characters'),
    body('model').trim().isLength({ min: 5 }).withMessage('The Model should be atleast 5 characters'),
    body('hardDisk').trim().isLength({ min: 5 }).withMessage('The Hard disk should be atleast 5 characters'),
    body('screenSize').trim().isLength({ min: 1 }).withMessage('The Screen size should be atleast 1 characters'),
    body('ram').trim().isLength({ min: 2 }).withMessage('The Ram should be atleast 2 characters'),
    body('operatingSystem').trim().isLength({ min: 5, max: 20 }).withMessage('The Operating system should be between 5 and 20 characters long'),
    body('cpu').trim().isLength({ min: 10, max: 50 }).withMessage('The CPU should be between 10 and 50 characters long'),
    body('gpu').trim().isLength({ min: 10, max: 50 }).withMessage('The GPU should be between 10 and 50 characters long'),
    body('price').trim().notEmpty().withMessage('Price is required').bail().isFloat({ min: 0.01 }).withMessage('Price should be a positive number'),
    body('color').trim().isLength({ min: 2, max: 10 }).withMessage('The Color should be between 2 and 10 characters long'),
    body('weight').trim().isLength({ min: 1 }).withMessage('The Weight size should be atleast 1 characters'),
    body('image').trim().isURL({ require_tld: false, require_protocol: true }).withMessage('The Image should start with http:// or https://'),
    async (req, res) => {
        const post = await getById(req.params.id);
        try {
            const validation = validationResult(req);

            if (!validation.isEmpty()) {
                throw validation.array();
            }

            if (!post) {
                res.render('404');
                return;
            };
            
            const newRecord = await update(req.params.id, req.user._id, req.body);
            
            res.redirect(`/catalog/${req.params.id}`);
        } catch (err) {
            console.log(err);
            
            res.render('edit', { post, errors: parseError(err).errors });
        }
    });

homeRouter.get('/catalog/:id/delete', isOwner(), async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user._id;
        await deleteById(id, userId);
        res.redirect('/catalog');
    } catch (err) {
        res.render('404', { title: 'Error' });
    }
});

homeRouter.get('/catalog/:id/interact', hasInteracted(), async (req, res) => {
    try {
        await interact(req.params.id, req.user._id, "preferredList");
        res.redirect(`/catalog/${req.params.id}`);
    } catch (err) {
        res.render('404', { title: 'Error' });
    }
});

homeRouter.get('/search', async (req, res) => {
    const { searchName = '', searchSystem = '' } = req.query;
    let planets = await getAll();

    if (searchName) {
        planets = planets.filter(pl => pl.name.toLowerCase().includes(searchName.toLowerCase()));
    };

    if (searchSystem) {
        planets = planets.filter(pl => pl.system.toLowerCase().includes(searchSystem.toLowerCase()));
    };

    res.render('search', { planets, searchName, searchSystem, title: 'Search' });
});

module.exports = { homeRouter }