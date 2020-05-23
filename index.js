const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const auth = require('./auth.json');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await login(page, auth);

    await page.goto('https://www.hackerrank.com/contests/2020-pshs-adv-pokemasters/judge/submissions/1');
    await page.waitForSelector('.span2.submissions-title');
    await page.waitForSelector('.span1.submissions-title');
    await page.waitForSelector('.span3.submissions-title');
    const content = await page.content();
    const $ = cheerio.load(content);
    const arr = $('p', '.judge-submissions-list-view')
        .map(function (i, e) {
            return $(this).text().trim().replace(/\n.+/g, '').trim();
        }).get();
    console.log(arr);
    console.log(arr.length);

    console.log('done');
})().catch(console.error);

const login = async (page, auth) => {
    await page.goto('https://www.hackerrank.com/auth/login');
    await page.waitForSelector('#input-1');
    await page.waitForSelector('#input-2');
    await page.click('#input-1');
    await page.keyboard.type(auth.username);
    await page.click('#input-2');
    await page.keyboard.type(auth.password);
    await page.click('.ui-btn.ui-btn-large.ui-btn-primary.auth-button');
};

const pause = async (ms) => {
    return new Promise(res => {
        setTimeout(res, ms);
    });
};