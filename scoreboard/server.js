const express = require('express');

const ClientRouter = require('./server/routes/clientRoute.js');

const app = express();
const port = 8080

app.use('/', ClientRouter);

app.use(express.static('client'));
app.listen(port, () => console.log(`XSS CTF Web Application listening on port ${port}`));