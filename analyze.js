const config = require('./config.json');
const fs = require('fs');
const XLSX = require('xlsx');
const adjusted = require(config.adjust.adjustedSubmissionPath);

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

fs.writeFileSync(config.analyze.analyzedSubmissionPath.JSON, JSON.stringify(teamsArr, null, 4));

// const wb = XLSX.utils.book_new();
// if (!wb.Props)
//     wb.Props = {};
// wb.Props.Title = 'Leaderboard';
// const wsName = 'Leaderboard';
// const wsData = [
//     ["S", "h", "e", "e", "t", "J", "S"],
//     [1, 2, 3, 4, 5]
// ];
// const ws = XLSX.utils.aoa_to_sheet(wsData);
// XLSX.utils.book_append_sheet(wb, ws, wsName);
// XLSX.writeFile(wb, config.analyze.analyzedSubmissionPath);

console.log(`done with ${teamsArr.length} team(s)`);
teamsArr.forEach(team => console.log(`rank ${team.rank}: ${team.name}`));