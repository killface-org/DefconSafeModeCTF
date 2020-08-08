const AgentFactory = require('./lib/agentFactory.js');
const quotes = {
    bender: require('./data/benderQuotes.json'),
    fry: require('./data/fryQuotes.json')
};

function calcPostTime(length, hours)
{
    return (60*60*1000*hours)/length;
}

const DOMAIN = '10.0.3.222';
const PORT = '8080';

(async ()=> {
    let agents = {};
    for (let i = 0; i < 5; i++)
    {
        agents[`benderAgent${i+1}`] = await AgentFactory.createAgent(
            DOMAIN, PORT, i+1, true, quotes.bender, calcPostTime(quotes.bender.length, 3));
        agents[`fryAgent${i+1}`] = await AgentFactory.createAgent(
            DOMAIN, PORT, i+1, false, quotes.fry, calcPostTime(quotes.fry.length, 3));
    }
})();