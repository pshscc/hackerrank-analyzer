const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const raw = require(config.scrape.rawSubmissionPath[config.contest.currentType]);

console.log(`starting with ${raw.length} submission(s)`);

const unqiueSolutionURLs = new Set();
let submissionNumber = 0;
const submissions = raw.filter(sub => {
    if (unqiueSolutionURLs.has(sub.url) || !sub.duringContest || config.adjust.teams.exclude.some(name => name === sub.team.name))
        return false;
    unqiueSolutionURLs.add(sub.url);
    return true;
}).map(sub => {
    sub.submissionNumber = submissionNumber++;
    return sub;
});

const filepath = config.adjust.adjustedSubmissionPath[config.contest.currentType];
fs.mkdirSync(path.dirname(filepath), { recursive: true });
fs.writeFileSync(filepath, JSON.stringify(submissions, null, 4));

console.log(`done with ${submissions.length} submission(s)`);