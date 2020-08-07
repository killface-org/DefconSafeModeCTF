const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('../lib/dbConn.js').lvl3db;
const router = express.Router();

async function authenticateUser(user, pass)
{
    try
    {
        return await db.select().table('users').where({name: user, password: pass}).first();
    }
    catch(err) {}
}

async function createUser(username, password)
{
    username = username.toLowerCase();
    try
    {
        //Check to see if user already exists.
        const result = (await db.raw(`SELECT id, name FROM users WHERE name = '${username}'`))[0];
        if (result)
        {
            return {
                status: 'failed',
                message: `User ${result.name} already exists`
            }
        }
        else
        {
            //Add user to database.
            await db.raw(`INSERT INTO users (name, password) VALUES ('${username}','${password}')`);
            return {
                status: 'success',
                message: `Created ${username}`
            }
        }
    }
    catch(err)
    {
        return {
            status: 'failed',
            message: err.toString()
        }
    }
}

async function isAdminAuthenticated(req)
{
    try
    {
        const user = await db.select().table('users').where({name:'admin'}).first();
        return user['password'] === req.cookies['win'];
    }
    catch(err)
    {
        return false;
    }
}

function isUserAuthenticated(req)
{
    return req.cookies['user'] !== null && req.cookies['user'] !== undefined;
}

router.all('/win.html', cookieParser(), async (req, res, next) => {
    if (await isAdminAuthenticated(req))
    {
        next();
    }
    else
    {
        res.redirect('./');
    }
});

router.all('/user.html', cookieParser(), async (req, res, next) => {
    if (await isUserAuthenticated(req))
    {
        next();
    }
    else
    {
        res.redirect('./');
    }
});

router.post('/create', express.json(), async (req, res) => {
    const result = await createUser(req.body.username, req.body.password);
    res.json(result);
});

router.post('/login', express.json(), async (req, res) => {
    const user = await authenticateUser(req.body.username, req.body.password);
    if (user && user.name === 'admin')
    {
        res.cookie('win', user.password, {path:'/level3'});
        res.json({status: 'success', page: 'win.html'});
    }
    else if (user)
    {
        res.cookie('user', user.password, {path:'/level3'});
        res.json({status: 'success', page: 'user.html'});
    }
    else
    {
        res.clearCookie('win', { path: '/level3' });
        res.json({status: 'fail'});
    }
});

module.exports = router;