const http = require('http');

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  const dataHora = new Date().toLocaleString();
  res.end(`<h1>Data e Hora Atual</h1><p>${dataHora}</p>`);
});

server.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));