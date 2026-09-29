const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`TaskFlow API çalışıyor → http://localhost:${config.port}`);
});
