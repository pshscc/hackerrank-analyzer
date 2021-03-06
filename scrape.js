const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const config = require('./config.json');
const fs = require('fs');
const path = require('path');

const login = async (page, auth) => {
    console.log('logging in');
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
    } catch (err) {
        return err;
    }
};

const getSubmissions = async (page, submissions, initialPageNumber) => {
    try {
        let pageNumber = initialPageNumber;
        let lastPage = false;
        while (!lastPage) {
            console.log(`trying page ${pageNumber}`);
            await page.goto(`https://www.hackerrank.com/contests/${config.contest.slug[config.contest.currentType]}/judge/submissions/${pageNumber}`);
            const err = await waitForElements(page);
            const content = await page.content();
            const $ = cheerio.load(content);
            lastPage = $('*').hasClass('disabled') && $('.disabled').toArray().some(e => $('a', e).attr('data-attr1') === 'Right');
            if (err && !lastPage) {
                console.log(`broke on page ${pageNumber}\n`, err);
                return false;
            }
            const arr = $('.judge-submissions-list-view')
                .map(function (i, e) {
                    const elements = $('p', this).map(function (i, e) {
                        const href = $('a', this).attr('href');
                        const text = $(this).text().replace(/\s{2,}/g, '').trim();
                        if (href)
                            return { href: 'https://www.hackerrank.com/' + href.replace(/^\//g, ''), text };
                        return text;
                    }).get();
                    return {
                        problem: {
                            url: elements[0].href,
                            name: elements[0].text
                        },
                        team: {
                            url: elements[1].href,
                            name: elements[1].text
                        },
                        id: elements[2],
                        language: elements[3],
                        time: parseInt(elements[4]),
                        result: elements[5],
                        score: parseFloat(elements[6]),
                        status: $('input[type=checkbox]', this).is(':checked'),
                        duringContest: elements[7] === 'Yes',
                        url: elements[8].href
                    };
                }).get();
            submissions.push(...arr);
            pageNumber++;
        }
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: config.scrape.puppeteer.headless });
        const page = await browser.newPage();
        page.setDefaultTimeout(config.scrape.puppeteer.timeout);

        await login(page, config.auth);

        const submissions = [];
        if (await getSubmissions(page, submissions, config.scrape.initialPageNumber)) {
            submissions.reverse();
            const filepath = config.scrape.rawSubmissionPath[config.contest.currentType];
            fs.mkdirSync(path.dirname(filepath), { recursive: true });
            fs.writeFileSync(filepath, JSON.stringify(submissions, null, 4));
        }

        console.log(`done with ${submissions.length} submission(s)`);
    } catch (err) {
        console.log(err);
    } finally {
        await browser.close();
    }
})();