const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const db = require('../lib/dbConn.js').baseDB;
const router = express.Router();

const JWT_KEY = '5e5ZGAyQCWcPsvxGW7WmfMDGGD1dgSof';

async function authenticateUser(username, password)
{
    username = username.toLowerCase();
    try
    {
        return await db.select().table('users').where({username: username, password: password}).first();
    }
    catch(err) {
        console.log('Scoreboard: authenticateUser');
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
        console.log('Scoreboard: createUser');
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
        console.log('Scoreboard: isAdminAuthenticated');
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
        console.log('Scoreboard: isUserAuthenticated');
        console.log(err);
        return false;
    }
}

async function submitFlag(userid, flag)
{
    try
    {
        const challenge = await db.select('id', 'description', 'points').table('challenges').where({flag:flag}).first();
        if (challenge)
        {
            const hasFlag = await db.select('id').table('flags').where({user_id:userid,challenge_id:challenge.id}).first();
            if (!hasFlag)
            {
                await db('flags').insert({user_id:userid,challenge_id:challenge.id});
                return {
                    status: 'success',
                    message: `${challenge.points} points for submitting the ${challenge.description} flag.`
                };
            }
            else
            {
                return {
                    status: 'failed',
                    message: 'You already have this flag.'
                };
            }
        }
        else
        {
            return {
                status: 'failed',
                message: 'Invalid Flag'
            };
        }
    }
    catch(err)
    {
        console.log('Scoreboard: submitFlag');
        console.log(err);
        return {
            status: 'failed',
            message: err.toString()
        };
    }
}

async function getScores()
{
    try
    {
        return await db.raw('SELECT u.id, u.name, u.username,sum(c.points) as total_score FROM flags f JOIN challenges c on c.id = f.challenge_id JOIN users u on u.id = f.user_id GROUP BY u.id, u.name, u.username ORDER BY sum(c.points) DESC');
    }
    catch (err)
    {
        console.log('Scoreboard: getScores');
        console.log(err);
        return {
            status: 'failed',
            message: err.toString()
        };
    }
}

async function getScoreDetails(userID)
{
    try
    {
        const results = await db('flags')
            .join('challenges', 'challenges.id', '=', 'flags.challenge_id')
            .where({'flags.user_id':userID})
            .select('flags.id','challenges.type','challenges.description','challenges.points')
            .orderBy('flags.id', 'desc');
        return {
            status: 'success',
            data: results
        };
    }
    catch (err)
    {
        console.log('Scoreboard: getScoreDetails');
        console.log(err);
        return {
            status: 'failed',
            message: err.toString()
        };
    }
}

async function giveBonusPoints(username, reason, points)
{
    username = username.toLowerCase();
    try
    {
        const cResult = await db('challenges').insert({
            type:'Bonus',
            description: reason,
            flag: 'sZj7Nod3uKKv0eN7S5Rle7FOJumasV92',
            points: points
        });
        const user = await db.select('id').from('users').where({username:username}).first();

        if (user && cResult)
        {
            await db('flags').insert({
                user_id: user.id,
                challenge_id:cResult[0]
            });
            return {
                status: 'success',
                message: 'Points given.'
            };
        }
        else
        {
            return {
                status: 'failed',
                message: 'Some bullshit stopped this from working.'
            }
        }

    }
    catch(err)
    {
        console.log('Scoreboard: giveBonusPoints');
        console.log(err);
        return {
            status: 'failed',
            message: err.toString()
        };
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
    res.clearCookie('token', { path: '/' });
    res.redirect('./');
});

router.post('/login', express.json(), async (req, res) => {
    const user = await authenticateUser(req.body.username, req.body.password);
    if (user)
    {
        res.cookie('token', jwt.sign({
            id: user.id,
            user: user.username,
            name: user.name,
            isAdmin: user.admin === 1
        }, JWT_KEY), {path:'/', httpOnly: true});
        res.json({status: 'success'});
    }
    else
    {
        res.clearCookie('token', { path: '/', httpOnly: true });
        res.json({status: 'fail'});
    }
});

router.post('/userinfo', cookieParser(), async(req, res) => {
    if (await isUserAuthenticated(req))
    {
        const verify = jwt.verify(req.cookies['token'], JWT_KEY);
        res.json(verify);
    }
    else
    {
        res.end();
    }
});

router.post('/submitflag', cookieParser(), express.json(), async(req, res) => {
    if (await  isUserAuthenticated(req))
    {
        const verify = jwt.verify(req.cookies['token'], JWT_KEY);
        const result = await submitFlag(verify.id, req.body.flag);
        res.json(result);
    }
    else
    {
        res.end();
    }
});

router.post('/scores', cookieParser(), express.json(), async(req, res) => {
    if (await  isUserAuthenticated(req))
    {
        const result = await getScores();
        res.json(result);
    }
    else
    {
        res.end();
    }
});

router.post('/scoredetails', cookieParser(), express.json(), async(req, res) => {
    if (await  isUserAuthenticated(req))
    {
        const result = await getScoreDetails(req.body.userid);
        res.json(result);
    }
    else
    {
        res.end();
    }
});

router.post('/givepoints', cookieParser(), express.json(), async(req, res) => {
    if (await isAdminAuthenticated(req))
    {
        const result = await giveBonusPoints(req.body.username, req.body.reason, req.body.points);
        res.json(result);
    }
    else
    {
        res.end();
    }
});

module.exports = router;