const express = require('express');
const routes = require('./routes');
const logger = require('./middlewares/logger');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Logger en başta: bozuk JSON gibi erken hatalar da dahil tüm istekler loglanır
app.use(logger);
app.use(express.json());

app.use('/', routes);

// Route'lardan sonra: önce 404, en sonda hata yakalayıcı
app.use(notFound);
app.use(errorHandler);

module.exports = app;
