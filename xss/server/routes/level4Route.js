const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const db = require('../lib/dbConn.js').lvl4db;
const router = express.Router();

const JWT_KEY = '6K5ZM2PFWnvFsxRZChciM1zcvgWXAFmp';

async function authenticateUser(username, password)
{
    username = username.toLowerCase();
    try
    {
        return await db.select().table('users').where({username: username, password: password}).first();
    }
    catch(err) {
        console.log('Level 4: authenticateUser');
        console.log(err);
    }
}

async function createUser(username, name, password)
{
    username = username.toLowerCase();
    try
    {
        const result = await db.select().table('users').where({username: username}).first();
        if (result)
        {
            return {
                status: 'failed',
                message: `User ${result['username']} already exists`
            }
        }
        else
        {
            //Add user to database.
            await db('users').insert({
                username: username,
                name: name,
                password: password,
                admin:0
            });
            return {
                status: 'success',
                message: `Created ${username}`
            }
        }
    }
    catch(err)
    {
        console.log('Level 4: createUser');
        console.log(err);
        return {
            status: 'failed',
            message: err.toString()
        }
    }
}

async function isAdminAuthenticated(req)
{
    const token = req.cookies['lvl4token'];
    if (!token)
    {
        return false;
    }
    try
    {
        const verify = jwt.verify(token, JWT_KEY);
        return verify.isAdmin;
    }
    catch(err)
    {
        console.log('Level 4: isAdminAuthenticated');
        console.log(err);
        return false;
    }
}

async function isUserAuthenticated(req)
{
    const token = req.cookies['lvl4token'];
    if (!token)
    {
        return false;
    }
    try
    {
        const verify = jwt.verify(token, JWT_KEY);
        return verify.user !== null;
    }
    catch(err)
    {
        console.log('Level 4: isUserAuthenticated');
        console.log(err);
        return false;
    }
}

router.all('/win.html', cookieParser(), async (req, res, next) => {
    if (await isAdminAuthenticated(req))
    {
        next();
    }
    else
    {
        res.redirect('./nope.html');
    }
});

router.all('/app.html', cookieParser(), async (req, res, next) => {
    if (await isUserAuthenticated(req))
    {
        next();
    }
    else
    {
        res.redirect('./nope.html');
    }
});

router.post('/createuser', express.json(), async (req, res) => {
    const result = await createUser(req.body.username, req.body.name, req.body.password);
    res.json(result);
});

router.all('/logout', async(req, res) => {
    res.clearCookie('lvl4token', { path: '/level4' });
    res.redirect('./');
});

router.post('/login', express.json(), async (req, res) => {
    const user = await authenticateUser(req.body.username, req.body.password);
    if (user)
    {
        res.cookie('lvl4token', jwt.sign({
            id: user.id,
            user: user.username,
            name: user.name,
            isAdmin: user.admin === 1
        }, JWT_KEY), {path:'/level4'});
        res.json({status: 'success'});
    }
    else
    {
        res.clearCookie('lvl4token', { path: '/level4' });
        res.json({status: 'fail'});
    }
});

router.post('/userinfo', cookieParser(), async(req, res) => {
    if (await isUserAuthenticated(req))
    {
        const verify = jwt.verify(req.cookies['lvl4token'], JWT_KEY);
        res.json(verify);
    }
    else
    {
        res.end();
    }
});

async function publishPost(userID, postData, isPublic)
{
    try
    {
        await db('posts').insert({
            user_id: userID,
            post_data: postData,
            public: isPublic === true ? 1 : 0
        });
        return {
            status: 'success',
            message: 'Published post.'
        }
    }
    catch(err)
    {
        console.log('Level 4: publishPost');
        console.log(err);
        return {
            status: 'failed',
            message: err.toString()
        }
    }
}

async function getPosts(userID, lastID = 0)
{
    try
    {
        const posts = await db('posts as p')
            .join('users as u', 'u.id', 'p.user_id')
            .where((builder) => {
                builder
                    .where({'p.public':1})
                    .orWhere({'p.user_id': userID})
            })
            .andWhere('p.id', '>', lastID)
            .orderBy('p.id', 'desc')
            .select('p.id','p.user_id','u.username', 'u.name','u.admin','p.post_data','p.public').limit(25);
        return {
            status: 'success',
            data: posts
        };
    }
    catch (err)
    {
        console.log('Level 4: getPosts');
        console.log(err);
        return {
            status: 'failed',
            message: err.toString()
        }
    }
}

router.post('/posts', cookieParser(), express.json(), async(req, res) => {
    if (await isUserAuthenticated(req))
    {
        const verify = jwt.verify(req.cookies['lvl4token'], JWT_KEY);
        const result = await getPosts(verify['id'], req.body.lastid);
        res.json(result);
    }
    else
    {
        res.json({
            status: 'failed',
            message: 'Not authenticated'
        });
    }
});

const EVIL_WORDS = [
    'cookie',
    'xmlhttprequest',
    'fetch',
    'document',
    'window',
    'onload',
    'onerror'
];

function sanitizePost(post)
{
    for (let word of EVIL_WORDS)
    {
        let regex = new RegExp(word, 'gi');
        post = post.replace(regex,'');
    }
    return post;
}

function recursiveSanitizePost(post)
{
    post = sanitizePost(post);
    for (let word of EVIL_WORDS)
    {
        let regex = new RegExp(word,'gi');
        if (post.match(regex))
        {
            post = recursiveSanitizePost(post);
            break;
        }
    }
    return post;
}

router.post('/publish', cookieParser(), express.json(), async(req, res) => {
    if (await isUserAuthenticated(req))
    {
        const verify = jwt.verify(req.cookies['lvl4token'], JWT_KEY);
        const result = await publishPost(verify['id'], recursiveSanitizePost(req.body.post), req.body.public);
        res.json(result);
    }
    else
    {
        res.json({
            status: 'failed',
            message: 'Not authenticated'
        });
    }
});

module.exports = router;