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
    baseDB: createKnexConnection('./server/data/base.db')
}