const express = require('express');
const { exec } = require('child_process');
const StockScraper = require('./stockScraper');

const router = express.Router();

const stocks = [
    new StockScraper('PETR4', 'https://www.infomoney.com.br/cotacoes/b3/acao/petrobras-petr4/'),
    new StockScraper('BBAS3', 'https://www.infomoney.com.br/cotacoes/b3/acao/banco-do-brasil-bbas3/'),
    new StockScraper('BBSE3', 'https://www.infomoney.com.br/cotacoes/b3/acao/bb-seguridade-bbse3/'),
    new StockScraper('ITUB3', 'https://www.infomoney.com.br/cotacoes/b3/acao/itau-unibanco-itub3/'),
    new StockScraper('MGLU3', 'https://www.infomoney.com.br/cotacoes/b3/acao/magazine-luiza-mglu3/'),
    new StockScraper('VULC3', 'https://www.infomoney.com.br/cotacoes/b3/acao/vulcabras-vulc3/'),
    new StockScraper('VALE3', 'https://www.infomoney.com.br/cotacoes/b3/acao/vale-vale3/')

];

router.get('/', async (req, res) => {
    const stockInfoPromises = stocks.map(stock => stock.scrapeInfo());
    const stockInfos = await Promise.all(stockInfoPromises);

    if (stockInfos.includes(null)) {
        return res.status(500).send('Falha ao recuperar informações das ações');
    }

    const rows = stockInfos.map(stockInfo => `
        <tr>
            <td>${stockInfo.name}</td>
            <td>${stockInfo.price}</td>
            <td>${stockInfo.percentage}</td>
            <td>${stockInfo.minimo}</td>
            <td>${stockInfo.maximo}</td>
            <td>${stockInfo.vol}</td>
            <td>${stockInfo.i}</td>
        </tr>
    `).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
        <link rel="stylesheet" href="style.css" type="text/css" />
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                document.getElementById('stockForm').addEventListener('submit', function(event) {
                    event.preventDefault();
                    const stockName = document.getElementById('stockName').value;

                    fetch('/get-url', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ stockName })
                    })
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('result').textContent = data.location || 'Nenhuma URL de redirecionamento encontrada';
                    })
                    .catch(error => {
                        console.error('Erro:', error);
                        document.getElementById('result').textContent = 'Erro ao buscar a URL da ação';
                    });
                });
            });
        </script>
    </head>
    <body>
        <center>
            <form id="stockForm">
                
                <label for="stockName">Nome da Ação:</label>
                <input type="text" id="stockName" name="stockName" required>
                <button class="botao" type="submit">Buscar URL</button>
            </form>
            <p id="result"></p>
        </center>
        <table>
            <tr>
                <th>Nome</th>
                <th>Preço Atual</th>
                <th>Variação</th>
                <th>Variação MIN</th>
                <th>Variação MAX</th>
                <th>Volume</th>
                <th>Indicador</th>
            </tr>
            ${rows}
        </table>
    </body>
    </html>
    `;
    res.send(htmlContent);
});


router.post('/get-url', (req, res) => {
    const { stockName } = req.body;
    const url = `https://www.infomoney.com.br/${stockName.toLowerCase()}`;

    exec(`curl -i ${url} 2>&1 | awk '/location/ {print $2}'`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.json({ error: 'Erro ao buscar a URL da ação' });
        }

        // Extrai a URL final do stdout
        const url_final = stdout.match(/https[^\s]+/);
        // Se a URL final existir, concatena com stockName
        const location = url_final ? `${stockName} ${url_final[0]}` : 'Nenhuma URL de redirecionamento encontrada';
        res.json({ location });
    });
});

module.exports = router;

