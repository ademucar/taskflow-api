const app = require('./app');
const config = require('./config');

// Express 5'te listen callback'i sunucu başlatılamazsa hatayla birlikte çağrılır.
app.listen(config.port, (err) => {
  if (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `${config.port} portu başka bir uygulama tarafından kullanılıyor. ` +
          'Farklı bir port ile başlatın, örneğin: PORT=4000 npm start',
      );
    } else {
      console.error('Sunucu başlatılamadı:', err.message);
    }
    process.exit(1);
  }

  console.log(`TaskFlow API çalışıyor → http://localhost:${config.port}`);
});
