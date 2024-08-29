const path = require('path');
const Acoes = require('../models/mongoose');
const StockScraper = require('../services/stockScraper');
const stockController = require('../controllers/stockController'); // Importa o controlador

const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const db = require('mongoose')
const { exec } = require('child_process')
require('dotenv').config();


const app = express();
const PORT = (process.env.port);



// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

//DB connection & start server versão online
//db.connect("mongodb+srv://"+auth+"@xndgdb.ywuzd.mongodb.net/ticker?retryWrites=true&w=majority&appName=XNDGDB")
//auth recebe credenciais no formato: auth=user:pass do aquivo .env
//banco de dados: ticker
//user do banco:  useracoes





//DB connection versão localhost
db.connect("mongodb://" + (process.env.auth) + "@localhost:27017/ticker?retryWrites=true&w=majority")
	.then(() => {
		console.log("\x1b[1m\x1b[32m\x1b[5m", 'Sucesso!  Conectado ao DB!', "\x1b[0m");  //cyan
		app.listen(PORT, () => {
			console.log('Servidor rodando em\x1b[1m\x1b[36m', `\x1b[4mhttp://localhost:${PORT}\x1b[0m`);
		});
	})
	.catch(() => {
		console.log("\x1b[1m\x1b[31m\x1b[5m", 'Falha!   Conexão ao DB falhou', "\x1b[0m");
	});

	
// leitura de dados
app.get('/', async (req, res) => {
	try {
		// Buscando todos os documentos na coleção 'acoes'
		const acoesList = await Acoes.find({}, { ticker: 1, url: 1, _id: 1, hora: 1 }); // Apenas 'ticker' e 'url' são retornados
		const stockInfoPromises = acoesList.map(async (acao) => {
			const scraper = new StockScraper(acao.ticker, acao.url);
			const scrapedInfo = await scraper.scrapeInfo();
			return {
				_id: acao._id,
				ticker: acao.ticker,
				url: acao.url,
				hora: acao.hora,
				...scrapedInfo
			};
		});
		// Executando todas as promessas
		const stockInfos = await Promise.all(stockInfoPromises);
		// Gerando o HTML
		const rows = stockInfos.map(info => `
            <tr id="row-${info._id}">
                <td>${info.ticker}</td>
                <!-- <td><a href="${info.url}" target="_blank">${info.url}</a></td>
                <td>${info.hora}</td> -->
                <td>${info.price}</td>
                <td>${info.percentage}</td>
                <td>${info.minimo}</td>
                <td>${info.maximo}</td>
                <td>${info.vol}</td>
                <td>${info.i}</td>
                <td><button class="css-button" onclick="removeAcao('${info._id}')"><span class="css-button-icon"><i class="fa fa-trash-o"></i></span></button></td>
            </tr>
        `).join('');
		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<link rel="stylesheet" href="style.css" type="text/css" />
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
			<head>
				<title>Exportação de Ações</title>			
				<script>
                async function removeAcao(id) {
                    try {
                        const response = await fetch('/remover/' + id, {
                            method: 'DELETE',
                        });
                        const result = await response.json();
                        if (result.success) {
							alert('Ação removida com sucesso');
                            document.getElementById('row-' + id).remove();
							location.reload();
                        } else {
                            alert('Erro ao remover a ação');
                        }
                    } catch (error) {
                        console.error('Erro:', error);
                        alert('Erro ao remover a ação');
                    }
                }
	            </script>	
				<script>
				document.addEventListener('DOMContentLoaded', function() {
				document.getElementById('stockForm').addEventListener('submit', function(event) {
				event.preventDefault();
				const stockName = document.getElementById('stockName').value;

				fetch('/pegar', {
					method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ stockName })
				})
				.then(response => response.json())
				.then(data => {
				const resultElement = document.getElementById('result');
				const location = data.location || 'Nenhuma URL de redirecionamento encontrada';
				resultElement.textContent = location;

				// Criando o botão "Adicionar ao Banco de Dados"
				if (location !== 'Nenhuma URL de redirecionamento encontrada') {
					const [ticker, url] = location.split(' ');
					const addButton = document.createElement('button');
					addButton.textContent = ' ';
					addButton.className = 'css-button fa fa-save fa-2x';
					addButton.addEventListener('click', function() {
					fetch('/adicionar', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ ticker, url })
					})
					.then(addResponse => addResponse.json())
					.then(addData => {
						alert('Ação ' + ticker + ' adicionada ao banco de dados com sucesso!');
						
					})
					.catch(addError => {
						console.error('Erro ao adicionar a ação ao banco de dados:', addError);
						alert('Erro ao adicionar a ação ao banco de dados');
					});
				});

				 // Removendo qualquer botão anterior antes de adicionar o novo
                if (resultElement.nextElementSibling) {
                    resultElement.nextElementSibling.remove();
                }

				// Adicionando o botão ao DOM
				resultElement.insertAdjacentElement('afterend', addButton);
				}
				})
				.catch(error => {
					console.error('Erro:', error);
					document.getElementById('result').textContent = 'Erro ao buscar a URL da ação';
				});
				});
				});
			</script>
			</head>
			<center>
				<form id="stockForm">
					<label for="stockName">Nome da Ação:</label>
					<input type="text" id="stockName" name="stockName" required>
					<button class="css-button" type="submit"><span class="css-button-icon"><i class="fa fa-search" aria-hidden="true"></i></span></button>
				</form>
            <p id="result"></p>
       		</center>
			<body>
			<table>
				<tr>
					<th>Ticker</th>
					<th>Preço</th>
					<th>Variação</th>
					<th>Mínimo</th>
					<th>Máximo</th>
					<th>Volume</th>
					<th>Indicador</th>
				</tr>
				${rows}
			</table>
			</body>
			</html>
			`;

		// Enviando o HTML gerado como resposta
		res.send(htmlContent);

	} catch (error) {
		console.error('Erro ao exportar os dados:', error);
		res.status(500).send('Erro ao exportar os dados');
	}
});



app.get('/lista', stockController.lista);
app.post('/adicionar', stockController.adicionar); 
app.delete('/remover/:id', stockController.remover); 

app.post('/pegar', stockController.pegar); 





