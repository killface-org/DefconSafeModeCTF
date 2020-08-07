const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('../lib/dbConn.js').lvl5db;
const router = express.Router();

const JWT_KEY = 'TYCjMGdNrSdwFMdahVo55ID2wU0Wzh5wpkvjL73ewaI0bBl6ir3WqA7B17bTmtNr';

const RESET_KEYS = {};

function createResetToken(username)
{
    const reverseName = username.split('').reverse().join('');
    const base64Name = Buffer.from(username).toString('base64');
    const hash = crypto.createHash('sha256');
    hash.update(reverseName);
    const token = Buffer.from(`${base64Name}:${hash.digest('hex')}`).toString('base64');
    return token;
}

function verifyResetToken(token)
{
    token = Buffer.from(token,'base64').toString();
    const splitToken = token.split(':');
    const username = splitToken[0];
    const reverseName = username.split('').reverse().join('');
    const hash = crypto.createHash('sha256');
    hash.update(reverseName);
    const digest = hash.digest('hex');
    if (digest === splitToken[1])
    {
        return {
            status: 'success',
            username: username
        }
    }
    else
    {
        return {
            status: 'failed',
            message: 'Failed to validate reset token.'
        }
    }
}

async function authenticateUser(username, password)
{
    try
    {
        return await db.select().table('users').where({login: username, password: password}).first();
    }
    catch(err) {
        console.log('Level 5: authenticateUser');
        console.log(err);
    }
}

async function updatePassword(username, password)
{
    try
    {
        await db('users').where({login:username}).update({password: password});
        return {
            status: 'success',
            message: `The password for user:${username} has been updated.`
        };
    }
    catch(err) {
        console.log('Level 5: updatePassword');
        console.log(err);
        return {
            status: 'failed',
            message: 'SQL ERROR'
        };
    }
}

async function requestReset(username)
{
    username = username.toLowerCase();
    try {
        const user = await db.select().table('users').where({login: username}).first();
        if (user)
        {
            if (user.login === 'admin')
            {
                return {
                    status: 'failed',
                    message: 'Nice try, but no.'
                }
            }
            else
            {
                const urlKey = crypto.randomBytes(16).toString('hex');
                RESET_KEYS[urlKey] = {
                    username: username
                };

                return {
                    status: 'success',
                    message: `./resetpassword?id=${urlKey}`
                };
            }
        }
        else
        {
            return {
                status: 'failed',
                message: 'No such user.'
            };
        }
    }
    catch(err)
    {
        return {
            status: 'failed',
            message: 'An error occurred.'
        }
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
        console.log('Level 5: createUser');
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
        const verify = jwt.verify(token, JWT_KEY);
        return verify.isAdmin;
    }
    catch(err)
    {
        console.log('Level 5: isAdminAuthenticated');
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
        const verify = jwt.verify(token, JWT_KEY);
        return verify.user !== null;
    }
    catch(err)
    {
        console.log('Level 5: isUserAuthenticated');
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
    res.clearCookie('token', { path: '/level5' });
    res.redirect('./');
});

router.post('/login', express.json(), async (req, res) => {
    const user = await authenticateUser(req.body.username, req.body.password);
    if (user)
    {
        res.cookie('token', jwt.sign({user:user.login, isAdmin: user.admin === 1}, JWT_KEY), {path:'/level5'});
        res.json({status: 'success'});
    }
    else
    {
        res.clearCookie('token', { path: '/level5' });
        res.json({status: 'fail'});
    }
});

router.post('/updatepassword', cookieParser(), express.json(), async (req, res) => {
    const verify = verifyResetToken(req.cookies['reset_token']);
    if (verify.status === 'failed')
    {
        res.json(verify);
    }
    else
    {
        const result = await updatePassword(verify.username, req.body.password);
        res.json(result);
    }
});

router.get('/resetpassword', async (req, res) => {
    const keyData = RESET_KEYS[req.query.id];
    if (keyData)
    {
        const token = createResetToken(keyData.username);
        res.cookie('reset_token', token, {path:'/level5'});
        res.redirect('./changepassword.html');
    }
    else
    {
        res.redirect('./nope.html');
    }
});

router.post('/requestreset', express.json(), async (req, res) => {
    const result = await requestReset(req.body.username);
    res.json(result);
});

module.exports = router;