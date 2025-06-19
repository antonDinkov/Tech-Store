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


    res.render('home', { title: 'Home', lastThree });
});

homeRouter.get('/create', isUser(), (req, res) => {
    res.render('create', { title: 'Create' });
});
homeRouter.post('/create', isUser(),
    body('name').trim().isLength({ min: 2 }).withMessage('The Name should be atleast 2 characters'),
    body('age').trim().notEmpty().withMessage('Age is required').bail().isFloat({ min: 0.01 }).withMessage('Age should be a positive number'),
    body('system').trim().isLength({ min: 2 }).withMessage('The System should be atleast 2 characters'),
    body('type').notEmpty().withMessage('Type is required').bail().isIn(['Inner', 'Outer', 'Dwarf']).withMessage('Type should be one of the options: Inner, Outer, Dwarf'),
    body('moons').trim().notEmpty().withMessage('Moons is required').bail().isFloat({ min: 0.01 }).withMessage('Moons should be a positive number'),
    body('size').trim().notEmpty().withMessage('Size is required').bail().isFloat({ min: 0.01 }).withMessage('Size should be a positive number'),
    body('rings').notEmpty().withMessage('Rings is required').bail().isIn(['Yes', 'No']).withMessage('Rings should be one of the options: Yes, No'),
    body('description').trim().isLength({ min: 20, max: 200 }).withMessage('The Description should be between 10 and 100 characters long'),
    body('image').trim().isURL({ require_tld: false, require_protocol: true }).withMessage('The Image should start with http:// or https://'),
    async (req, res) => {
        const { name, age, system, type, moons, size, rings, description, image } = req.body;
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
            
            res.render('create', { data: { name, age, system, type, moons, size, rings, description, image }, errors: parseError(err).errors })
        }
    });

homeRouter.get('/catalog', async (req, res) => {
    const planets = await getAll();
    res.render('catalog', { planets, title: 'Catalog' });
});

homeRouter.get('/catalog/:id', async (req, res) => {

    const id = req.params.id;
    const planet = await getById(id);
    
    let likeCount = planet.likedList.length;

    if (!planet) {
        res.render('404', { title: 'Error' });
        return;
    };

    const isLoggedIn = req.user;
    
    const isAuthor = req.user?._id == planet.owner.toString();
    
    const hasLiked = Boolean(planet.likedList.find(id => id.toString() == req.user?._id.toString()));

    res.render('details', { planet, likeCount, isLoggedIn, isAuthor, hasLiked, title: `Details ${planet.name}` });
});


homeRouter.get('/catalog/:id/edit', isOwner(), async (req, res) => {
    try {
        const planet = await getById(req.params.id);

        if (!planet) {
            res.render('404');
            return;
        };

        res.render('edit', { planet, title: `Edit ${planet.name}` });
    } catch (err) {
        console.error('Error loading edit form: ', err);
        res.redirect('/404');
    }
});
homeRouter.post('/catalog/:id/edit', isOwner(),
    body('name').trim().isLength({ min: 2 }).withMessage('The Name should be atleast 2 characters'),
    body('age').trim().notEmpty().withMessage('Age is required').bail().isFloat({ min: 0.01 }).withMessage('Age should be a positive number'),
    body('system').trim().isLength({ min: 2 }).withMessage('The System should be atleast 2 characters'),
    body('type').notEmpty().withMessage('Type is required').bail().isIn(['Inner', 'Outer', 'Dwarf']).withMessage('Type should be one of the options: Inner, Outer, Dwarf'),
    body('moons').trim().notEmpty().withMessage('Moons is required').bail().isFloat({ min: 0.01 }).withMessage('Moons should be a positive number'),
    body('size').trim().notEmpty().withMessage('Size is required').bail().isFloat({ min: 0.01 }).withMessage('Size should be a positive number'),
    body('rings').notEmpty().withMessage('Rings is required').bail().isIn(['Yes', 'No']).withMessage('Rings should be one of the options: Yes, No'),
    body('description').trim().isLength({ min: 20, max: 200 }).withMessage('The Description should be between 10 and 100 characters long'),
    body('image').trim().isURL({ require_tld: false, require_protocol: true }).withMessage('The Image should start with http:// or https://'),
    async (req, res) => {
        const planet = await getById(req.params.id);
        try {
            const validation = validationResult(req);

            if (!validation.isEmpty()) {
                throw validation.array();
            }

            if (!planet) {
                res.render('404');
                return;
            };
            
            const newRecord = await update(req.params.id, req.user._id, req.body);
            
            res.redirect(`/catalog/${req.params.id}`);
        } catch (err) {
            console.log(err);
            
            res.render('edit', { planet, errors: parseError(err).errors });
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

homeRouter.get('/catalog/:id/like', hasInteracted(), async (req, res) => {
    try {
        await interact(req.params.id, req.user._id);
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