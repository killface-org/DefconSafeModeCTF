const knex = require('knex');

function createKnexConnection(fileName)
{
    return knex({
        client: 'sqlite3',
        connection: {
            filename: fileName
        },
        useNullAsDefault: true
    });
}

module.exports = {
    lvl1db: createKnexConnection('./server/data/level1.db'),
    lvl2db: createKnexConnection('./server/data/level2.db'),
    lvl3db: createKnexConnection('./server/data/level3.db'),
    lvl4db: createKnexConnection('./server/data/level4.db'),
    lvl5db: createKnexConnection('./server/data/level5.db')
}