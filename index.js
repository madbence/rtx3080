import puppeteer from 'puppeteer';
import fs from 'fs/promises';

async function getPrices(term) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.arukereso.hu/videokartya-c3142/?orderby=1&st=' + encodeURIComponent(term));
  const prices = await page.evaluate((term) => {
    const parsePrice = s => parseInt(s.replace(/[^0-9]/g, ''), 10);
    const parseId = s => +s.match(/p(\d+)\/$/)[1];
    return Array.from(document.querySelectorAll('.product-box'))
      .filter(p => p.querySelector('.price'))
      .map(p => ({
        price: parsePrice(p.querySelector('.price').innerText),
        url: p.querySelector('a.image').href,
        id: parseId(p.querySelector('a.image').href),
        name: p.querySelector('.name h2 a').innerText,
        date: new Date().toISOString(),
        term,
      }));
  }, term);
  await browser.close();

  return prices;
}

const sleep = t => new Promise(resolve => setTimeout(resolve, t * 1000));
const blacklist = (await fs.readFile('blacklist.txt')).toString().split('\n').filter(Boolean).map(n => parseInt(n, 10));
const terms = ['rtx 3080', 'rtx 3080 ti', 'rtx 3090'];

for (;;) {
  for (const term of terms) {
    const prices = (await getPrices(term)).filter(p => !blacklist.includes(p.id));
    for (const price of prices) {
      console.log(JSON.stringify(price));
    }
    console.error('Cheapest %s is %sHUF %s', term, prices[0].price, prices[0].url);
  }
  await sleep(60 * 60);
}
