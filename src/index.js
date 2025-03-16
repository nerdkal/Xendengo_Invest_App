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

        function createRow(info) {
            return `
            
                <tr id="row-${info._id}" class="draggable-row">
                    <td>
                        <div>
                            <img src="${info.logo}" class="logosize"><a href="${info.url}" target="_blank">${info.ticker}</a>
                        </div>
                    </td>
                    <td><div class="text-white px-2  text-center font-bold">${info.setor}</div></td>
                    <td><div class="text-white px-2  text-center font-bold">R$ ${info.price}</div></td>
                    <td><div class="text-white px-2  text-center font-bold">${info.tipo}</div></td>
                    <td><div class="${info.cordia} text-white px-2 py-1 rounded-md text-sm text-center">${info.percentage}</div></td>
                    <td><div class="${info.cormes} text-white px-2 py-1 rounded-md text-sm text-center">${info.vmes}</div></td>
                    <td><div class="${info.corano} text-white px-2 py-1 rounded-md text-sm text-center">${info.vano}</div></td>
                    <td><div style="color:#FF6347" class="text-white px-2 py-1 text-sm text-center font-bold">${info.minimo}</div></td>
                    <td><div style="color:#9ACD32" class="font-bold">${info.maximo}</div></td>
                    <td><div class="text-sm text-center text-gray-400">${info.vol}</div></td>
                    <td><div class="text-white px-2 py-1 text-sm text-center"><i>${info.i}</i></div></td>
                    <td>
                        <button class="css-button" onclick="removeAcao('${info._id}')"><span class="css-button-icon"><i class="fa fa-trash-o"></i></span></button>
                    </td>
                </tr>
            `;
        }
        const rows = stockInfos.map(createRow).join('');
        

        const htmlContent = `
       <!DOCTYPE html>
        <html lang="en" >
        <head>
          <meta charset="UTF-8">
          <title>Xendengo Finance App</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">

        <link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN" crossorigin="anonymous">

        <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">

        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/meyer-reset/2.0/reset.min.css">
        <link rel="stylesheet" href="./style.css">

        <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
        <script>
        document.addEventListener("DOMContentLoaded", () => {
          const checkbox = document.getElementById("animacao-marquee");
          const marquee = document.querySelector(".marquee");
              marquee.classList.add("enable-animation");
        });
        </script>
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
<body>
<!-- partial:index.partial.html -->
<div class="center">
  <div class="left">
    <div class="logo" style="padding-top: 10px;">
         
    <center>
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="70" height="70" viewBox="0 0 171 172">
          <image xlink:href="data:image/png;base64,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" x="0" y="0" width="171" height="172"/>
      </svg>
    </center>
      
    </div>
    <div class="company">
      <div class="company-name">Xendengo Finance</div>
      <div class="company-description">Acompanhe ações do mercado</div>
    </div>
    <div class="navigation">
      <ul>
        <li><i class="material-icons">store</i><span>Bolsa</span></li>
        <li> <i class="material-icons">track_changes</i><span>Explorar</span></li>
        <li> <i class="material-icons">loyalty</i><span>Portfolio</span></li>
        <li> <i class="material-icons">library_books</i><span>Notícias</span></li>
        <!-- <li><i class="material-icons">account_box</i><span>Account</span></li> -->
        <!--<li> <i class="material-icons">forum</i><span>Mensagem</span></li> -->

      </ul>
    </div>
  </div>
  <div class="right">
  <div class="description"></div> <br>
    <div class="title" style="float: left;">
      <div class=" box bounce-2" >
        <img src="https://s3-symbol-logo.tradingview.com/b3-on-nm--600.png" width="50px" height="50px" >
      </div>
    </div>
    
    <div>
        <!-- <div class="graph">
        <svg viewBox="0 0 250 60" width="250" height="90">
          <path d="M 209.328 17.34 C 221.956 17.588 235.264 32.599 250 22.328" fill="none" vector-effect="non-scaling-stroke" stroke-width="2" stroke="rgb(243,243,250)" stroke-linejoin="miter" stroke-linecap="round" stroke-miterlimit="3"></path>
          <linearGradient id="_lgradient_1" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stop-opacity="1" style="stop-color:rgb(120,113,255)"></stop>
            <stop offset="100%" stop-opacity="1" style="stop-color:rgb(111,234,255)"></stop>
          </linearGradient>
          <path d=" M 0 43.634 C 5.934 43.634 11.318 51.209 17.462 51.342 C 33.219 51.683 30.603 59.567 39.187 59.868 C 46.963 60.141 50.44 44.192 60.537 43.77 C 69.126 43.77 72.129 52.461 79.739 52.433 C 90.904 52.433 94.93 38.455 106.648 39.78 C 129.082 42.317 124.556 27.606 139.157 27.177 C 153.758 26.747 158.235 44.485 171.96 44.725 C 196.438 45.155 189.782 17.1 208.248 17.1" fill="none" vector-effect="non-scaling-stroke" stroke-width="2" stroke="url(#_lgradient_1)" stroke-linejoin="miter" stroke-linecap="round" stroke-miterlimit="3"></path>
          <path d="M 206.649 17.218 C 206.649 15.739 207.85 14.538 209.328 14.538 C 210.807 14.538 212.008 15.739 212.008 17.218 C 212.008 18.696 210.807 19.897 209.328 19.897 C 207.85 19.897 206.649 18.696 206.649 17.218 Z" fill="rgb(111,232,255)"></path>
          <text transform="matrix(1,0,0,1,195,5)" style="font-family:&amp;quot;Open Sans&amp;quot;;font-weight:700;font-size:12px;font-style:normal;fill:#6fe8ff;stroke:none;">+14%</text>
          <div class="stock">
            <div class="stock-logo paperpillar"><i class="fa fa-inverse fa-angle-double-up"></i></div>
            <div class="stock-info">
              <div class="stock-name">PPRPLR</div>
              <div class="stock-fullname">Paperpillar Studio</div>
            </div>
          </div>
        </svg>
      </div> 
      <div class="graph">
        <svg viewBox="0 0 250 60" width="250" height="90">
          <path d="M 209.328 17.34 C 221.956 17.588 235.264 32.599 250 22.328" fill="none" vector-effect="non-scaling-stroke" stroke-width="2" stroke="rgb(243,243,250)" stroke-linejoin="miter" stroke-linecap="round" stroke-miterlimit="3"></path>
          <linearGradient id="_lgradient_2" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stop-opacity="1" style="stop-color:rgb(248, 135, 129)"></stop>
            <stop offset="100%" stop-opacity="1" style="stop-color:rgb(247, 198, 130)"></stop>
          </linearGradient>
          <path d=" M 0 43.634 C 5.934 43.634 11.318 51.209 17.462 51.342 C 33.219 51.683 30.603 59.567 39.187 59.868 C 46.963 60.141 50.44 44.192 60.537 43.77 C 69.126 43.77 72.129 52.461 79.739 52.433 C 90.904 52.433 94.93 38.455 106.648 39.78 C 129.082 42.317 124.556 27.606 139.157 27.177 C 153.758 26.747 158.235 44.485 171.96 44.725 C 196.438 45.155 189.782 17.1 208.248 17.1" fill="none" vector-effect="non-scaling-stroke" stroke-width="2" stroke="url(#_lgradient_2)" stroke-linejoin="miter" stroke-linecap="round" stroke-miterlimit="3"></path>
          <path d="M 206.649 17.218 C 206.649 15.739 207.85 14.538 209.328 14.538 C 210.807 14.538 212.008 15.739 212.008 17.218 C 212.008 18.696 210.807 19.897 209.328 19.897 C 207.85 19.897 206.649 18.696 206.649 17.218 Z" fill="rgb(247, 198, 130)"></path>
          <text transform="matrix(1,0,0,1,195,5)" style="font-family:&amp;quot;Open Sans&amp;quot;;font-weight:700;font-size:12px;font-style:normal;fill:rgb(247, 198, 130);stroke:none;">+14%</text>
        </svg>
        <div class="stock">
          <div class="stock-logo dandruft"><i class="fa fa-inverse fa-circle-thin"></i></div>
          <div class="stock-info">
            <div class="stock-name">DDFT</div>
            <div class="stock-fullname">Dandruft Craft</div>
          </div>
        </div> 
      </div> -->
    </div> 
    
    <div class="row column">
      <div class="sub-title">Setores</div>
      <div class="asset-category">
        <div class="category">
          <div class="asset">
            <div class="asset-logo"><i class="fa fa-bolt"></i></div>
          </div>
          <div class="asset-name">Energia</div>
        </div>
        <div class="category">
          <div class="asset">
            <div class="asset-logo"><i class="fa fa-inbox"></i></div>
          </div>
          <div class="asset-name">Ouro</div>
        </div>
        <div class="category">
          <div class="asset">
            <div class="asset-logo"><i class="fa fa-clone"></i></div>
          </div>
          <div class="asset-name">Metais</div>
        </div>
        <div class="category">
          <div class="asset">
            <div class="asset-logo"><i class="fa fa-pagelines"></i></div>
          </div>
          <div class="asset-name">Grãos</div>
        </div>
        <div class="category">
          <div class="asset">
            <div class="asset-logo"><i class="fa fa-adjust"></i></div>
          </div>
          <div class="asset-name">Livestock</div>
        </div>
        <div class="category">
          <div class="asset">
            <div class="asset-logo"><i class="fa fa-tencent-weibo"></i></div>
          </div>
          <div class="asset-name">Crypto</div>
        </div>
        <div class="category">
          <div class="asset">
            <div class="asset-logo"><i class="fa fa-leaf"></i></div>
          </div>
          <div class="asset-name">Commodities</div>
        </div>
        <div class="category">
          <div class="asset">
            <div class="asset-logo"><i class="fa fa-tint"></i></div>
          </div>
          <div class="asset-name">Petróleo</div>
        </div>
      </div>
    </div>
    
      <!-- <div class="half">
        <div class="sub-title">Altas do dia</div>
        <div class="stock">
          <div class="stock-logo apple"><i class="fa fa-inverse fa-apple"></i></div>
          <div class="stock-info">
            <div class="stock-name">APPL</div>
            <div class="stock-fullname">Apple Inc.</div>
          </div>
          <div class="stock-value">+14.5%</div>
        </div>
        <div class="stock">
          <div class="stock-logo facebook"><i class="fa fa-inverse fa-facebook"></i></div>
          <div class="stock-info">
            <div class="stock-name">FB</div>
            <div class="stock-fullname">Facebook, Inc.</div>
          </div>
          <div class="stock-value">+12.9%</div>
        </div>
        <div class="stock">
          <div class="stock-logo amazon"><i class="fa fa-inverse fa-amazon"></i></div>
          <div class="stock-info">
            <div class="stock-name">AMZN</div>
            <div class="stock-fullname">Amazon.com, Inc.</div>
          </div>
          <div class="stock-value">+10.2%</div>
        </div>
      </div>
      <div class="half">
        <div class="sub-title">Populares da semana</div>
        <div class="stock">
          <div class="stock-logo twitter"><i class="fa fa-inverse fa-twitter"></i></div>
          <div class="stock-info">
            <div class="stock-name">TWTR</div>
            <div class="stock-fullname">Twitter Inc.</div>
          </div>
          <div class="stock-value">+14.5%</div>
        </div>
        <div class="stock">
          <div class="stock-logo paypal"><i class="fa fa-inverse fa-paypal"></i></div>
          <div class="stock-info">
            <div class="stock-name">PYPL</div>
            <div class="stock-fullname">Paypal Holdings Inc.</div>
          </div>
          <div class="stock-value">+12.9%</div>
        </div>
        <div class="stock">
          <div class="stock-logo google"><i class="fa fa-inverse fa-google"></i></div>
          <div class="stock-info">
            <div class="stock-name">GOOGL</div>
            <div class="stock-fullname">Alphabet Inc.</div>
          </div>
          <div class="stock-value">+10.2%</div>
        </div>
      </div> 
    </div>-->
     
    <div> 
    
  
    <center>
    <section>
      <div class="marquee marquee--hover-pause">
        <ul class="marquee__content">
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r "><span class="w-max flex flex-nowrap"> Ibovespa </span><span class="w-max flex flex-nowrap font-normal"> 128.957pts </span><span class="text-wl-asset-rise font-semi-bold"> +2,64% </span></div></a></span></li>
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r "><span class="w-max flex flex-nowrap"> DÓLAR </span><span class="w-max flex flex-nowrap font-normal"> R$5,74 </span><span class="text-wl-asset-down font-semi-bold"> -1,02% </span></div></a></span></li>
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r "><span class="w-max flex flex-nowrap"> BITCOIN </span><span class="w-max flex flex-nowrap font-normal"> R$485.040 </span><span class="text-wl-asset-rise font-semi-bold"> +4,11% </span></div></a></span></li>
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r "><span class="w-max flex flex-nowrap"> IFIX </span><span class="w-max flex flex-nowrap font-normal"> 3.213pts </span><span class="text-wl-asset-rise font-semi-bold"> +0,76% </span></div></a></span></li>
          
        </ul>
        <ul aria-hidden="true" class="marquee__content">
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r "><span class="w-max flex flex-nowrap"> Ibovespa </span><span class="w-max flex flex-nowrap font-normal"> 128.957pts </span><span class="text-wl-asset-rise font-semi-bold"> +2,64% </span></div></a></span></li>
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r "><span class="w-max flex flex-nowrap"> DÓLAR </span><span class="w-max flex flex-nowrap font-normal"> R$5,74 </span><span class="text-wl-asset-down font-semi-bold"> -1,02% </span></div></a></span></li>
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r "><span class="w-max flex flex-nowrap"> BITCOIN </span><span class="w-max flex flex-nowrap font-normal"> R$485.040 </span><span class="text-wl-asset-rise font-semi-bold"> +4,11% </span></div></a></span></li>
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r "><span class="w-max flex flex-nowrap"> IFIX </span><span class="w-max flex flex-nowrap font-normal"> 3.213pts </span><span class="text-wl-asset-rise font-semi-bold"> +0,76% </span></div></a></span></li>
          
        </ul>
      </div>
    </section>

      <div class="linha"></div>
      <!-- <div class="table-container"></div> -->
      <!-- <div class="menu-header-move"><img src="/drag.gif" alt="Imagem">                    </div>-->
              
        <form id="stockForm" class="search-bar"><input type="search" placeholder="AÇÃO" id="stockName" name="stockName" required/ oninput="this.value = this.value.toUpperCase()" >
          <button class="search-btn" type="submit"></button>
        </form>
        <label id="result2"></label>										

        <div class="box bounce-2"></div>
        <label id="result"></label>
    </center>
    </div>
    <script>
    // Seleciona o campo de entrada e o formulário
    const inputField = document.getElementById('stockName');
    const stockForm = document.getElementById('stockForm');

    // Adiciona o evento de "blur" (quando perde o foco)
    inputField.addEventListener('blur', function () {
    if (this.value.trim() !== '') { // Verifica se o campo não está vazio
        // Previne o envio padrão e simula uma ação
        stockForm.dispatchEvent(new Event('submit'));
    }
    });

    // Captura o evento de submissão para evitar o reload da página
    stockForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Impede o comportamento padrão de recarregar a página

    // Pega o valor digitado no campo
    const stockValue = inputField.value.trim();
    });
    </script>	 
          
    <center><table>
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
