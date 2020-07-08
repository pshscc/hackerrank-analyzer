const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const config = require('./config.json');
const fs = require('fs');

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

const viewSubmissions = async (page, submissions, initialPageNumber) => {
    try {
        let pageNumber = initialPageNumber;
        let lastPage = false;
        while (!lastPage) {
            console.log(`trying page ${pageNumber}`);
            await page.goto(`https://www.hackerrank.com/contests/${config.contest_slug}/judge/submissions/${pageNumber}`);
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
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);

    await login(page, config.auth);

    const submissions = [];
    if (await viewSubmissions(page, submissions, 1)) {
        submissions.reverse();
        let id = 0;
        while (fs.existsSync(`./raw_submissions${id}.json`))
            id++;
        fs.writeFileSync(`./raw_submissions${id}.json`, JSON.stringify(submissions, null, 4));
    }

    console.log(`done with ${submissions.length} submission(s)`);
    await browser.close();
})().catch(console.error);