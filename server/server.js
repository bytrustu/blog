const app = require('./app');
const HOST = '0.0.0.0';
const PORT = 7000;

app.listen(HOST, PORT, () => {
    console.log(`Running on http://${HOST}:${PORT}`);
});
