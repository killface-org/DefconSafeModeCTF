const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

function execPromise(command) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout) => {
            if (err)
            {
                reject(err);
            }
            resolve(stdout);
        });
    });
}

async function getAnimalList()
{
    try {
        const cmdResult = await execPromise('ls ./client/level5/animals');
        return {
            status: 'success',
            data: cmdResult.split('\n').slice(0,-1)
        }
    }
    catch (err) {
        return {
            status: 'failed',
            message: err.toString()
        }
    }
}

async function getPictureList(animalName)
{
    try {
        const cmdResult = await execPromise(`ls ./client/level5/animals/${animalName}`);
        return {
            status: 'success',
            data: cmdResult.split('\n').slice(0,-1)
        }
    }
    catch (err)
    {
        return {
            status: 'failed',
            message: err.toString()
        }
    }
}

router.post('/getAnimalList', express.json(), async(req, res) => {
    const list = await getAnimalList();
    res.json(list);
});

router.post('/getPictureList', express.json(), async (req, res) => {
    const list = await getPictureList(req.body.name);
    res.json(list);
});


module.exports = router;