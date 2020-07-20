const config = require('./config.json');
const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');
const adjusted = require(config.adjust.adjustedSubmissionPath[config.contest.currentType]);

const teamNames = new Set();
adjusted.forEach(({ team }) => teamNames.add(team.name));

const teamsMap = new Map();
teamNames.forEach(name => {
    const data = {
        name: name,
        rank: 0,
        uniqueCorrectSubmissionsCount: 0,
        correctSubmissionsCount: 0,
        wrongSubmissionsCount: 0,
        submissionCount: 0,
        time: 0,
        correctSubmissionNumberSum: 0,
        submissions: {
            all: [],
            correct: [],
            wrong: []
        }
    };
    teamsMap.set(name, data);
});

adjusted.forEach(sub => {
    const data = teamsMap.get(sub.team.name);
    if (sub.result === 'Accepted') {
        data.correctSubmissionsCount++;
        if (sub.status) {
            data.uniqueCorrectSubmissionsCount++;
            data.correctSubmissionNumberSum += sub.submissionNumber;
            data.time += sub.time;
        }
        data.submissions.correct.push(sub);
    } else {
        data.wrongSubmissionsCount++;
        data.submissions.wrong.push(sub);
    }
    data.submissionCount++;
    data.submissions.all.push(sub);
});

const teamsArr = [...teamsMap].map(pair => pair[1])
    .sort((a, b) => {
        if (a.uniqueCorrectSubmissionsCount === b.uniqueCorrectSubmissionsCount) {
            if (a.time === b.time) {
                if (a.correctSubmissionNumberSum === b.correctSubmissionNumberSum) {
                    return a.submissionCount - b.submissionCount;
                }
                return a.correctSubmissionNumberSum - b.correctSubmissionNumberSum;
            }
            return a.time - b.time;
        }
        return b.uniqueCorrectSubmissionsCount - a.uniqueCorrectSubmissionsCount;
    })
    .map((teamData, index) => {
        teamData.rank = index + 1;
        return teamData;
    });

const JSONFilepath = config.analyze.analyzedSubmissionPath.JSON[config.contest.currentType];
fs.mkdirSync(path.dirname(JSONFilepath), { recursive: true });
fs.writeFileSync(JSONFilepath, JSON.stringify(teamsArr, null, 4));

const wb = XLSX.utils.book_new();
if (!wb.Props)
    wb.Props = {};
wb.Props.Title = 'Leaderboard';
const wsName = 'Leaderboard';

const problems = config.contest.problems[config.contest.currentType];
const wsData = [['Rank', 'Team', 'Solved', 'Time', 'Submission Number Sum', 'Total Submissions', ...problems]];

const problemIndex = new Map();
problems.forEach((name, index) => problemIndex.set(name, index));
teamsArr.forEach(team => {
    const row = [team.rank, team.name, team.uniqueCorrectSubmissionsCount, team.time, team.correctSubmissionNumberSum, team.submissionCount];
    const arr = Array(problemIndex.size);
    team.submissions.correct.forEach(sub => arr[problemIndex.get(sub.problem.name)] = `${sub.time} + ${sub.submissionNumber}`);
    row.push(...arr);
    wsData.push(row);
});

const ws = XLSX.utils.aoa_to_sheet(wsData);
XLSX.utils.book_append_sheet(wb, ws, wsName);
const XLSXFilepath = config.analyze.analyzedSubmissionPath.XLSX[config.contest.currentType];
fs.mkdirSync(path.dirname(XLSXFilepath), { recursive: true });
XLSX.writeFile(wb, XLSXFilepath);

console.log(`done with ${teamsArr.length} team(s)`);
teamsArr.forEach(team => console.log(`rank ${team.rank}: ${team.name}`));