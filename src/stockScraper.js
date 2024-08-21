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

            const price = $('div.value').first().text().trim();
            const percentage = $('div.percentage').first().text().trim();
            const minimo = $('div.minimo').first().text().trim();
            const maximo = $('div.maximo').first().text().trim();
            const vol = $('div.volume').first().text().trim();
            const tab = $('div.tables:nth-child(1) > table:nth-child(2) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(2)').text().trim();
            const line = $('div.line-info').first().text().trim();

            let i = '';
            $('i.negative, i.positive').each(function () {
                const text = $(this).text().trim();
                if (text === 'arrow_downward') {
                    i = '<span style="color: red; font-size: 18px;">&#x2B07;</span>';
                } else if (text === 'arrow_upward') {
                    i = '<span style="color: green; font-size: 18px;">&#x2B06;</span>';
                }
            });

            return {
                name: this.stockName,
                price,
                percentage,
                minimo,
                maximo,
                vol,
                tab,
                i,
                line,
            };
        } catch (error) {
            console.error(`Erro ao fazer o scraping do ${this.stockName}:`, error);
            return null;
        }
    }
}

module.exports = StockScraper;

