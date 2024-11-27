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
        const acoesList = await Acoes.find({}, { ticker: 1, url: 1, logo: 1, _id: 1, hora: 1 });
        const stockInfoPromises = acoesList.map(async (acao) => {
            const scraper = new StockScraper(acao.ticker, acao.url, acao.logo);
            const scrapedInfo = await scraper.scrapeInfo();
            return {
                _id: acao._id,
                ticker: acao.ticker.toUpperCase(),
                url: acao.url,
                logo: acao.logo ? acao.logo : '',
                hora: acao.hora,
                ...scrapedInfo
            };
        });

        const stockInfos = await Promise.all(stockInfoPromises);

        const rows = stockInfos.map(info => `
            <tr id="row-${info._id}" class="draggable-row" >
                <td><div class="logoc text-white px-2 py-1 text-sm text-center font-bold"><img src="${info.logo}" class="logosize"><a href="${info.url}">${info.ticker}</a></div>                </td>
                <td><div class="text-white px-2 py-1 text-sm text-center font-bold">${info.setor}</div></td>
                <td><div class="text-white px-2 py-1 text-sm text-center font-bold">R$ ${info.price}</div></td>
                <td><div class="text-white px-2 py-1 text-sm text-center font-bold">${info.tipo}</div></td>
                <td><div class="${info.cordia} text-white px-2 py-1 rounded-md text-sm text-center">${info.percentage}</div></td>
                <td><div class="${info.cormes} text-white px-2 py-1 rounded-md text-sm text-center">${info.vmes}</div></td>
                <td><div class="${info.corano} text-white px-2 py-1 rounded-md text-sm text-center">${info.vano}</div></td>
                <td><div style="color:#FF6347" class="text-white px-2 py-1 text-sm text-center font-bold">${info.minimo}</div></td>
                <td><div style="color:#9ACD32" class="font-bold">${info.maximo}</div></td>
                <td><div class="text-sm text-center text-gray-400">${info.vol}</div></td>
                <td><div class="text-white px-2 py-1 text-sm text-center"><i>${info.i}</i></div></td>
                <td><button class="css-button" onclick="removeAcao('${info._id}')">
                        <span class="css-button-icon"><i class="fa fa-trash-o"></i></span>
                    </button></td>
            </tr>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <link rel="stylesheet" href="style.css" type="text/css" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                <script src="https://cdn.tailwindcss.com"></script>
                <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>

               
               <script>
    async function removeAcao(id) {
        try {
            const response = await fetch('/remover/' + id, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
                showAlert('Ação removida com sucesso');
                document.getElementById('row-' + id).remove();
                setTimeout(() => location.reload(), 4000); // Atualiza a página após 4 segundos
            } else {
                showAlert('Erro ao remover a ação');
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao remover a ação');
        }
    }

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

                const resultElement2 = document.getElementById('result2');
                const logo = data.logo || 'Nenhum LOGO de encontrada';
                const boxElement = document.querySelector('.box');
                boxElement.style.backgroundImage = 'url(' + logo + ')';

                // Criando o botão "Adicionar ao Banco de Dados"
                if (location !== 'Nenhuma URL de redirecionamento encontrada') {
                    const [ticker, url] = location.split(' ');
                    const addButton = document.createElement('button');
                    addButton.textContent = ' ';
                    addButton.className = 'css-button fa fa-plus-circle fa-2x';
                    addButton.style.width = '90px';
                    addButton.style.marginBottom = '20px'; // Adiciona espaçamento inferior

                    addButton.addEventListener('click', function() {
                        fetch('/adicionar', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ ticker, url, logo })
                        })
                        .then(addResponse => addResponse.json())
                        .then(addData => {
                            showAlert('Ação ' + ticker + ' adicionada ao banco de dados com sucesso!');
                            setTimeout(() => window.location.reload(), 4000); // Atualiza a página após 4 segundos
                        })
                        .catch(addError => {
                            console.error('Erro ao adicionar a ação ao banco de dados:', addError);
                            showAlert('Erro ao adicionar a ação ao banco de dados');
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

    // Função showAlert com efeito de entrada e saída
    const showAlert = (message) => {
        const alert = document.createElement('div');
        alert.className = 'custom-alert';
        alert.textContent = message;
        alert.style.opacity = 0;  // Começa transparente
        alert.style.transition = 'opacity 1s ease-in-out';  // Efeito de transição suave

        document.body.appendChild(alert);
        
        // Efeito de entrada (do transparente para a cor final)
        setTimeout(() => {
            alert.style.opacity = 1; // Torna visível
        }, 100);  // Inicia o efeito logo após adicionar o alerta na página

        // Efeito de saída (da cor final para o transparente)
        setTimeout(() => {
            alert.style.opacity = 0; // Torna transparente
            setTimeout(() => alert.remove(), 1000); // Remove o alerta após a transição
        }, 3000); // Depois de 3 segundos (tempo do alerta visível)
    };
</script>
</head>
			<center>
			<form id="stockForm">
				<div class="bg-gray-800">
				<label id="result2"></label>
				<div class="box bounce-2"></div>
			
				<ul id="growing-search-freebie">
					<li>
					<!-- Start Freebie Markup -->
					<div class="growing-search">
						<div class="input">
						<input type="text" placeholder="AÇÃO" id="stockName" name="stockName" required/>
						</div><!-- Space hack --><div class="submit">
						<button type="submit" name="go_search">
							<span class="fa fa-search 4x"></span>
						</button>
						
						</div>
					</div>
					<!-- End Freebie Markup -->
					</li>
				</ul>
				
				</div>
			</form>
			
			
			<label id="result"></label>
			
			

			</center>

            <body>
                <center>
                    <table>
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Setor</th>
                                <th>Preço</th>
                                <th>Tipo</th>
                                <th>Var. Dia</th>
                                <th>Var. Mês</th>
                                <th>Var. Ano</th>
                                <th>Mínimo</th>
                                <th>Máximo</th>
                                <th>Volume</th>
                                <th>Indicador</th>
                            </tr>
                        </thead>
                        <tbody id="stockTable">
                            ${rows}
                        </tbody>
                    </table>
                </center>
                <script>
                    // Initialize SortableJS for table rows
                    new Sortable(document.getElementById('stockTable'), {
                        animation: 150,
                        ghostClass: 'sortable-ghost'
                    });
                </script>
            </body>
            </html>
        `;

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
