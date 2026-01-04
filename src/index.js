require('dotenv').config();                  // Primeiro: carrega .env
const express = require('express');
const mongoose = require('mongoose');         // Use mongoose, não require('mongoose') em variável db
const path = require('path');

// Imports do seu projeto (mantenha se existirem)
const Acoes = require('../models/mongoose'); // ajuste se necessário
const yahooFinanceService = require('../services/yahooFinanceService');
const stockController = require('../controllers/stockController');

const app = express();
const PORT = process.env.PORT || 3000;        // Corrigido: process.env.PORT (maiúsculo) e fallback

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ==================== CONEXÃO COM MONGODB LOCAL ====================
if (!process.env.MONGO_USER || !process.env.MONGO_PASS) {
  console.error('❌ MONGO_USER ou MONGO_PASS não encontrados no .env');
  process.exit(1);
}
const user = encodeURIComponent(process.env.MONGO_USER);
const pass = encodeURIComponent(process.env.MONGO_PASS);

// URI que funcionou no seu teste com mongosh + authSource=admin (necessário na maioria dos casos)
const uri = `mongodb://${user}:${pass}@localhost:27017/ticker`;
console.log('Tentando conectar com URI:', uri.replace(pass, '[SENHA_OCULTA]'));

mongoose.connect(uri)
  .then(() => {
    console.log('\x1b[1m\x1b[32m\x1b[5m✅ Sucesso! Conectado ao DB (ticker)!\x1b[0m');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em \x1b[1m\x1b[36m\x1b[4mhttp://localhost:${PORT}\x1b[0m`);
    });
  })
  .catch((err) => {
    console.error('\x1b[1m\x1b[31m\x1b[5m❌ Falha! Conexão ao DB falhou\x1b[0m');
    console.error('Erro detalhado:', err.message);
  });

// ==================== ROTAS (adicione aqui ou importe) ====================
// Exemplo: se você usa o stockController
// app.use('/', stockController);  // ou as rotas específicas que você tem


// Teste PETR4.SA (Petrobras)
// leitura de dados
app.get('/', async (req, res) => {
    try {
        const acoesList = await Acoes.find({}, { ticker: 1, url: 1, logo: 1, _id: 1, hora: 1 });

	const globalIndices = await yahooFinanceService.getGlobalIndices();
	    const stockInfoPromises = acoesList.map(async (acao) => {
            const info = await yahooFinanceService.getStockInfo(acao.ticker);
            return {
                _id: acao._id,
                ticker: acao.ticker.toUpperCase(),
                url: acao.url,
                logo: acao.logo || '/default-logo.png', // fallback opcional
                hora: acao.hora,
                setor: info.setor,
                price: info.price,
                tipo: info.tipo,
                percentage: info.percentage,
                cordia: info.cordia,
                vmes: info.vmes,
                cormes: info.cormes,
                vano: info.vano,
                corano: info.corano,
                minimo: info.minimo,
                maximo: info.maximo,
                vol: info.vol,
                i: info.i,
                // Injetamos os índices globais explicitamente em cada item
	    };
        });

        const stockInfos = await Promise.all(stockInfoPromises);

const {
  ibovespaValue,
  ibovespaVol,
  dolarValue,
  dolarVol,
  bitcoinValue,
  bitcoinVol,
  ifixValue,
  ifixVol
} = globalIndices;
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
                    addButton.innerHTML = '<i class="fa fa-plus-circle fa-2x"></i>';
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

    // 🔹 LIMPA INPUT E RESULTADOS
    document.getElementById('stockName').value = '';
    document.getElementById('result').textContent = '';
    document.getElementById('result2').textContent = '';
    document.querySelector('.box').style.backgroundImage = '';

    // Remove botão adicionar
    addButton.remove();

    // Opcional: foca no input para nova busca
    document.getElementById('stockName').focus();

    // mantém seu comportamento atual
    setTimeout(() => window.location.reload(), 500);
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
            }, 0000); // Depois de 3 segundos (tempo do alerta visível)
        };
        </script>
</head>
<body>
     
<!-- partial:index.partial.html -->
<div class="center">
  <div class="left">
    <div class="logo" style="padding-top: 10px;">
         
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
      <div class=" box0 bounce-2" >
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
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r"><img src="https://logodownload.org/wp-content/uploads/2019/08/b3-logo-01.png" class="ico">Ibovespa ${ibovespaValue} <span class="w-max flex flex-nowrap font-normal" style="color: ${String(ibovespaVol).startsWith('-') ? 'red' : 'green'};"> ${ibovespaVol}</span></div></span></li>
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r"><img src="https://br.advfn.com/common/images/company/FX_USDBRL.png" class="ico">Dolar ${dolarValue} <span class="w-max flex flex-nowrap font-normal" style="color: ${String(dolarVol).startsWith('-') ? 'red' : 'green'};"> ${dolarVol}</span></div></span></li>
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r"><img src="https://br.advfn.com/common/images/company/COIN_BTCUSD.png" style="height: 21px";>BTC ${bitcoinValue} <span class="w-max flex flex-nowrap font-normal" style="color: ${String(bitcoinVol).startsWith('-') ? 'red' : 'green'};"> ${bitcoinVol}</span></div></span></li>
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r"><img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_ifix.jpg" style="height: 21px";>IFIX ${ifixValue} <span class="w-max flex flex-nowrap font-normal" style="color: ${String(ifixVol).startsWith('-') ? 'red' : 'green'};"> ${ifixVol}</span></div></span></li>
          
        </ul>
        <ul aria-hidden="true" class="marquee__content">
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r"><img src="https://logodownload.org/wp-content/uploads/2019/08/b3-logo-01.png"  class="ico">Ibovespa ${ibovespaValue} <span class="w-max flex flex-nowrap font-normal" style="color: ${String(ibovespaVol).startsWith('-') ? 'red' : 'green'};"> ${ibovespaVol}</span></div></span></li>
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r"><img src="https://br.advfn.com/common/images/company/FX_USDBRL.png" class="ico">Dolar ${dolarValue} <span class="w-max flex flex-nowrap font-normal" style="color: ${String(dolarVol).startsWith('-') ? 'red' : 'green'};"> ${dolarVol}</span></div></span></li>
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r"><img src="https://br.advfn.com/common/images/company/COIN_BTCUSD.png" class="ico">BTC ${bitcoinValue} <span class="w-max flex flex-nowrap font-normal" style="color: ${String(bitcoinVol).startsWith('-') ? 'red' : 'green'};"> ${bitcoinVol}</span></div></span></li>
          <li><span><div class="flex flex-nowrap gap-2 !px-4 !py-2 text-xs leading-4 !border-r"><img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_ifix.jpg" class="ico">IFIX ${ifixValue} <span class="w-max flex flex-nowrap font-normal" style="color: ${String(ifixVol).startsWith('-') ? 'red' : 'green'};"> ${ifixVol}</span></div></span></li>        
        </ul>
      </div>
    </section>

      <div class="linha"></div>
      <!-- <div class="table-container"></div> -->
      <!-- <div class="menu-header-move"><img src="/drag.gif" alt="Imagem">                    </div>-->
              
        <form id="stockForm" class="search-bar"><input type="search" placeholder="AÇÃO" id="stockName" name="stockName" required/ oninput="this.value = this.value.toUpperCase()" >
          <button class="search-btn" type="submit"></button>
        </form>
      <div>
        <label id="result2"></label>
        <div class="box bounce-2"></div>
        <label id="result"></label>
        
      </div>
    </center>
    </div>
    <script>
    // Seleciona o campo de entrada e o formulário
    const inputField = document.getElementById('stockName');
    const stockForm = document.getElementById('stockForm');

   // 🔹 LIMPA O INPUT AO CARREGAR A PÁGINA
   document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('stockName');
    if (input) {
        input.value = '';
        input.focus();
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
