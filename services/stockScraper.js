const axios = require('axios');
const cheerio = require('cheerio');


class StockScraper {
	constructor(stockName, url) {
		this.stockName = stockName;
		this.url = url;
		
	}

	async scrapeInfo() {
		try {
			const { data } = await axios.get(this.url);
			const $ = cheerio.load(data);           
			const price = $('div.value').first().text().trim().match(/[0-9+,.%-]+/)[0];
			const tipo = $('p').first().text().trim();
			const variacao = $('p.value').first().text().trim();
			const vmes = $('td:contains(Mê)').next().text().trim();
			const vano = $('td:contains("20")').next().text().trim();
			const percentage = $('div.percentage').first().text().trim().match(/[0-9+,.%-]+/)[0];
			const minimo = $('div.minimo').first().text().trim().match(/[0-9+,.%-]+/)[0];
			const maximo = $('div.maximo').first().text().trim().match(/[0-9+,.%-]+/)[0];
			const vol = $('td:contains(Vol)').next().text().trim();
			const setor = $('h3:contains(Setor)').first().text().trim().split(':').pop();
			//const vol = $('div.volume').first().text().trim().match(/[0-9+,.%-]+/)[0];
			let i,cordia,cormes,corano,cormax;			
			
			// Constrói a segunda URL com base no nome da ação
			const tradingViewUrl = 'https://br.tradingview.com/symbols/BMFBOVESPA-'+$('stockName');
			
			


			cormes = vmes.startsWith('-') ? 'bg-red-100' : 'bg-green-100';
			corano = vano.startsWith('-') ? 'bg-pink-100' : 'bg-blue-100';
			
			$('i.negative, i.positive').each(function () {
				const text = $(this).text().trim();
				i = text === 'arrow_downward' ? '<div class="down">&#x21af; </div>' 
					: '<div class="up">&#x21af; </div>';
			
				cordia = text === 'arrow_downward' ? 'bg-red-600' : 'bg-green-600';								
			});
			return {
				name: this.stockName,
				price,
				tipo,
				variacao,
				vmes,
				vano,
				percentage,
				minimo,
				maximo,
				vol,
				i,
				cordia,
				cormes,
				corano,
				cormax,
				setor,
				tradingViewUrl,
				
				
			};
		} catch (error) {
			console.error(`Erro ao fazer o scraping do ${this.stockName}:`, error);
			return null;
		}
	}
}

module.exports = StockScraper;
