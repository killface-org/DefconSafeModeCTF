const express = require('express');

const Level1Router = require('./server/routes/level1Route.js');
const Level2Router = require('./server/routes/level2Route.js');
const Level3Router = require('./server/routes/level3Route.js');
const Level4Router = require('./server/routes/level4Route.js');
const Level5Router = require('./server/routes/level5Route.js');

const app = express();
const port = 8080

app.use('/level1', Level1Router);
app.use('/level2', Level2Router);
app.use('/level3', Level3Router);
app.use('/level4', Level4Router);
app.use('/level5', Level5Router);

app.use(express.static('client'));
app.listen(port, () => console.log(`XSS CTF Web Application listening on port ${port}`));