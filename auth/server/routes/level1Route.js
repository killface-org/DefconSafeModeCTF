const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('../lib/dbConn.js').lvl1db;
const router = express.Router();

async function authenticateUser(username, password)
{
    try
    {
        return await db.select().table('users').where({login: username, password: password}).first();
    }
    catch(err) {
        console.log('Level 1: authenticateUser');
        console.log(err);
    }
}

async function createUser(username, password)
{
    username = username.toLowerCase();
    try
    {
        const result = await db.select().table('users').where({login: username}).first();
        if (result)
        {
            return {
                status: 'failed',
                message: `User ${result.login} already exists`
            }
        }
        else
        {
            //Add user to database.
            await db('users').insert({login: username, password: password, admin:0});
            return {
                status: 'success',
                message: `Created ${username}`
            }
        }
    }
    catch(err)
    {
        console.log('Level 1: createUser');
        console.log(err);
        return {
            status: 'failed',
            message: err.toString()
        }
    }
}

async function isAdminAuthenticated(req)
{
    const token = req.cookies['token'];
    if (!token)
    {
        return false;
    }
    try
    {
        const user = await db.select().table('users').where({id:token}).first();
        return user['admin'] === 1;
    }
    catch(err)
    {
        console.log('Level 1: isAdminAuthenticated');
        console.log(err);
        return false;
    }
}

async function isUserAuthenticated(req)
{
    const token = req.cookies['token'];
    if (!token)
    {
        return false;
    }
    try
    {
        const user = await db.select().table('users').where({id:token}).first();
        return user !== undefined;
    }
    catch(err)
    {
        console.log('Level 1: isUserAuthenticated');
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

router.all('/user.html', cookieParser(), async (req, res, next) => {
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
    const result = await createUser(req.body.username, req.body.password);
    res.json(result);
});

router.all('/logout', async(req, res) => {
    res.clearCookie('token', { path: '/level1' });
    res.redirect('./');
});

router.post('/login', express.json(), async (req, res) => {
    const user = await authenticateUser(req.body.username, req.body.password);
    if (user)
    {
        res.cookie('token', user.id, {path:'/level1'});
        res.json({status: 'success'});
    }
    else
    {
        res.clearCookie('token', { path: '/level1' });
        res.json({status: 'fail'});
    }
});

module.exports = router;