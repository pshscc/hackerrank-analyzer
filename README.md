# HackerRank Analyzer
A program to analyze the submissions Plano Senior's HackerRank contests and creates leaderboards in Excel. 

## Prequisites
- [Node.js](https://nodejs.org/en/)

## Building
To build this repository, enter the following in command prompt:
```shell
git clone https://github.com/pshscc/hackerrank-analyzer.git
cd hackerrank-analyzer
npm install
```

## Scripts
To run these scripts, enter the following in command prompt: 
```shell
npm run <name of script>
```
| Name | Description |
| :-: | - |
| `scrape` | Obtains the submissions from the specified HackerRank contest in `config.json` and generates a JSON file in `./submissions/raw/` with the submissions. |
| `adjust` | Removes any possible duplicate ID submissions and adds a submission number to each submission. A JSON file is generated in `./submissions/adjusted/` with the adjusted submissions. |
| `analyze` | Ranks the teams and generates a JSON file and Excel file in `./submissions/analyzed/`. How ranking is done can be seen [here](https://github.com/pshscc/hackerrank-analyzer#ranking). |
| `clean:raw` | Deletes `.json` files in `./submissions/raw/`. |
| `clean:adjust` | Deletes `.json` files in `./submissions/adjusted/`. |
| `clean:analyze` | Deletes `.json` and `.xlsx` files in `./submissions/analyzed/`. |
| `clean` | Calls the `clean:raw`, `clean:adjust`, and `clean:analyze` scripts. |

## Ranking
Ranking teams is all done in `analyze.js`. Teams are ranked based on three criteria in the following order:
1. Number of Correct Submissions
2. Total Time (in minutes)
   - Submissions are taken from `https://www.hackerrank.com/contests/<contest slug>/judge/submissions/challenge` and only provide the time in minutes.
3. Sum of Submission Numbers.
   - Each submission is given a submission number, ***N***, in `adjust.js` that corresponds to being the ***N***th submission to the contest. For example, the first submission to the contest would be assigned the number zero.

