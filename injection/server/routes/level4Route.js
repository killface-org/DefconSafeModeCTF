const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('../lib/dbConn.js').lvl4db;
const router = express.Router();

async function authenticateUser(user, pass)
{
    try
    {
        return await db.select().table('users').where({name: user, password: pass}).first();
    }
    catch(err) {}
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

async function isValidUser(username)
{
    try
    {
        const user = (await db.raw(`SELECT id, name, password FROM users WHERE name = '${username}'`))[0];
        if (user)
        {
            return { status: 'success' };
        }
        else
        {
            return { status: 'failed' };
        }
    }
    catch(err)
    {
        return {
            status: 'error',
            message: err.toString()
        }
    }
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

router.post('/login', express.json(), async (req, res) => {
    const user = await authenticateUser(req.body.username, req.body.password);
    if (user)
    {
        res.cookie('win', user.password, {path:'/level4'});
        res.json({status: 'success', page: 'win.html'});
    }
    else
    {
        res.clearCookie('win', { path: '/level4' });
        res.json({status: 'fail'});
    }
});

router.post('/reset', express.json(), async (req, res) => {
    const status = await isValidUser(req.body.username);
    res.json(status);
});

module.exports = router;