const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const auth = require('./auth.json');
const fs = require('fs');

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

const waitForElements = async (page) => {
    try {
        for (let x = 1; x <= 10; x++) {
            await page.waitForXPath(`//*[@id="content"]/div/section/div/div/div/div[1]/div[${x}]/div/div[1]/p/a`); // problem
            await page.waitForXPath(`//*[@id="content"]/div/section/div/div/div/div[1]/div[${x}]/div/div[2]/p/a`); // team
            await page.waitForXPath(`//*[@id="content"]/div/section/div/div/div/div[1]/div[${x}]/div/div[3]/p`); // id
            await page.waitForXPath(`//*[@id="content"]/div/section/div/div/div/div[1]/div[${x}]/div/div[4]/p`); // language
            await page.waitForXPath(`//*[@id="content"]/div/section/div/div/div/div[1]/div[${x}]/div/div[5]/p`); // time
            await page.waitForXPath(`//*[@id="content"]/div/section/div/div/div/div[1]/div[${x}]/div/div[6]/p`); // result
            await page.waitForXPath(`//*[@id="content"]/div/section/div/div/div/div[1]/div[${x}]/div/div[7]/p`); // score
            await page.waitForXPath(`//*[@id="content"]/div/section/div/div/div/div[1]/div[${x}]/div/div[8]/input`); // status
            await page.waitForXPath(`//*[@id="content"]/div/section/div/div/div/div[1]/div[${x}]/div/div[9]/p`); // during contest
            await page.waitForXPath(`//*[@id="content"]/div/section/div/div/div/div[1]/div[${x}]/div/div[10]/p/a`); // view
        }
        return true;
    } catch (err) {
        return false;
    }
};

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    await login(page, auth);

    await page.goto('https://www.hackerrank.com/contests/2020-pshs-adv-pokemasters/judge/submissions/1');
    await waitForElements(page);
    const content = await page.content();
    // fs.writeFileSync('./test5.html', content);
    const $ = cheerio.load(content);
    const arr = $('p', '.judge-submissions-list-view')
        .map(function (i, e) {
            return $(this).text().trim();
        }).get();
    console.log(arr);
    console.log(arr.length);

    console.log('done');
})().catch(console.error);