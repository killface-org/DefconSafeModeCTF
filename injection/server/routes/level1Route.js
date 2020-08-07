const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('../lib/dbConn.js').lvl1db;
const router = express.Router();

async function authenticateUser(user, pass)
{
    try
    {
        return (await db.raw(`SELECT * FROM users WHERE username = '${user}' AND password = '${pass}'`))[0];
    }
    catch(err) {}
}

async function isAuthenticated(req)
{
    try
    {
        const user = await db.select().table('users').where({username:'admin'}).first();
        return user['password'] === req.cookies['win'];
    }
    catch(err)
    {
        return false;
    }
}

router.all('/win.html', cookieParser(), async (req, res, next) => {
    if (await isAuthenticated(req))
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
        res.cookie('win', user.password, {path:'/level1'});
        res.json({status: 'success'});
    }
    else
    {
        res.clearCookie('win', { path: '/level1' });
        res.json({status: 'fail'});
    }
});

module.exports = router;