#!/bin/bash

# Log deployment details to ./logfile.txt
if [ "$LOG_LEVEL" -eq 1 ]; then
  echo "Deployment started at $(date)" >> $LOG_FILE
fi

# Pull the latest code and log output
echo "Pulling latest code from GitHub..." >> $LOG_FILE
git pull origin main >> $LOG_FILE 2>&1

# Install dependencies using ./run install
echo "Running './run install' to install dependencies..." >> $LOG_FILE
./run install >> $LOG_FILE 2>&1

# Deploy the application using ./run URL_FILE
# Replace URL_FILE with the actual file or parameter you want to process
URL_FILE="src/URL_FILE.txt"  # Update this with the actual file you want to process
echo "Deploying application with './run $URL_FILE'..." >> $LOG_FILE
./run "$URL_FILE" >> $LOG_FILE 2>&1

# Log the deployment completion
echo "Deployment completed at $(date)" >> $LOG_FILE
