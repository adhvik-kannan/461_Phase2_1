# ECE-461-Project-Repo
Repository housing all files pertaining to our project for ECE 461.
## Original Codebase Inherited From:
Shriya Srinivas, Parv Kumar, Zach Barna, Karthik Digavalli
## Team Members:
Adhvik Kannan, Andrew Tu, Atharva Rao, Noah Kim

## Purpose of Project
This project is a tool that assesses the health of various repositories by checking various metrics such as the Ramp Up, Bus Factor, Licensing, and Responsiveness.

# Calculation of Metrics
- Ramp Up: 
    - This metric was evaluated by assesing the quality of the documentation and the ease of understanding the implementation.
- Bus Factor: 
    - We looked at the top 1% of committers in the up to the last 2000 commits, and analyzed whether or not they were making an unproportionally large amount of commits.
- Responsiveness:
    - The maintainer was evaluated by assessing average response time, issue closure time, number of active maintainers, and ratio of closed vs open issues.
- Licensing:
    - This metric evaluated whether or not the license description was going to be in the README in the packages being evaluated.
- Netscore:
    - Maintainer_Score * 0.3 + BusFactor_Score * 0.3 + License_Score * 0.2 + RampUp_Score * 0.2

# How to Use
1. Ensure that your GitHub Token is set:
    - run ```echo $GITHUB_TOKEN``` to check if the token is set
    - if it is not:
        - run ```export GITHUB_TOKEN="your token"```
2. Set LOG_FILE to path you want your log file to be created, and LOG_LEVEL to the level of verbosity you would like the logger to output (0 for silent, 1 for info, 2 for debug).
3. run ```chmod +x run``` to create an executable
4. run ```./run install``` to install the necessary dependencies
5. run ```./run URL_FILE``` to run the metrics on the urls inside the URL_FILE.txt file
6. run ```./run test``` to run test cases for the program
