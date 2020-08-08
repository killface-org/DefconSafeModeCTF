const _ = require('lodash');
const puppeteer = require('puppeteer');
const TokenBuilder = require('./tokenBuilder.js');

const PUPPETEER_LAUNCH_CONFIG = {
    headless: true,
    //These options are needed to run puppeteer on alpine arm v7
    executablePath: '/usr/bin/chromium-browser',
    args:['--no-sandbox']
};

const launchBrowser = function()
{
    return new Promise((resolve, reject) => {
        puppeteer.launch(PUPPETEER_LAUNCH_CONFIG)
        .then((b) => {
            resolve(b);
        }).catch((err) => {
            reject(err);
        })
    });
}

const BROWSER = launchBrowser();
const CONTEXTS = {
    admin: null,
    user: null
};

class Agent
{
    constructor(page, phrases, phraseInterval)
    {
        this.page = page;
        this.phrases = phrases;
        this.phraseInterval = phraseInterval;
        this.init();
    }

    init()
    {
        setInterval(this.generatePost.bind(this), this.phraseInterval);
        setInterval(async () => {
            await this.page.reload();
        }, 60000 * 5);
    }

    generatePost()
    {
        const phrase = _.sample(this.phrases);
        this.page.evaluate(async (p)=> {
            await window.publishPost(p, true);
        }, phrase).catch((err) => {
            console.log(err);
        });
    }
}


class AgentFactory {
    static async createAgent(domain, port, level, admin, phrases, phraseInterval) {
        const b = await BROWSER;
        let bContext = null;
        if (admin)
        {
            if (CONTEXTS.admin === null)
            {
                CONTEXTS.admin = await b.createIncognitoBrowserContext();
            }
            bContext = CONTEXTS.admin;
        }
        else
        {
            if (CONTEXTS.user === null)
            {
                CONTEXTS.user = await b.createIncognitoBrowserContext();
            }
            bContext = CONTEXTS.user;
        }
        const page = await bContext.newPage();
        const cookie = await page.setCookie({
            name: `lvl${level}token`,
            value: TokenBuilder.getUserKey(level, admin),
            url: `http://${domain}:${port}/level${level}/app.html`,
            domain: domain,
            path: `/level${level}`,
            httpOnly: false,
            secure: false
        });
        await page.goto(`http://${domain}:${port}/level${level}/app.html`);
        return new Agent(page, phrases, phraseInterval);
    }
}

module.exports = AgentFactory;