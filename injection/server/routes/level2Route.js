const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('../lib/dbConn.js').lvl2db;
const router = express.Router();

async function authenticateUser(user, pass)
{
    try
    {
        return await db.select().table('secretusertableofdoom').where({loginname: user, secret: pass}).first();
    }
    catch(err) {
    }
}

async function isAdminAuthenticated(req)
{
    try
    {
        const user = await db.select().table('secretusertableofdoom').where({loginname:'admin'}).first();
        return user['secret'] === req.cookies['win'];
    }
    catch(err)
    {
        return false;
    }
}

async function search(query)
{
    try {
        const searchResults = await db.raw(
            `SELECT id, type, title, year, rating, duration FROM netflix WHERE title LIKE '%${query}%' ORDER BY title LIMIT 100`);

        return {
            status: 'success',
            data: searchResults
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

router.post('/search', express.json(), async(req, res) => {
    const result = await search(req.body.query);
    res.json(result);
});

router.post('/login', express.json(), async (req, res) => {
    const user = await authenticateUser(req.body.username, req.body.password);
    if (user)
    {
        res.cookie('win', user.secret, {path:'/level2'});
        res.json({status: 'success', page: 'win.html'});
    }
    else
    {
        res.clearCookie('win', { path: '/level2' });
        res.json({status: 'fail'});
    }
});

module.exports = router;