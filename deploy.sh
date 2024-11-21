#!/bin/bash

# Function to stop any process running on a given port
stop_process_on_port() {
  local port=$1
  local pid
  pid=$(lsof -t -i:$port)  # Find process ID using the port
  if [ -n "$pid" ]; then
    echo "Stopping process $pid running on port $port..." >> $LOG_FILE
    kill -9 "$pid"
  else
    echo "No process running on port $port" >> $LOG_FILE
  fi
}

# Log deployment start
if [ "$LOG_LEVEL" -eq 1 ]; then
  echo "Deployment started at $(date)" >> $LOG_FILE
fi

# Stop processes running on ports 3000 and 3001
echo "Stopping processes on ports 3000 and 3001..." >> $LOG_FILE
stop_process_on_port 3000
stop_process_on_port 3001

# Delete existing repository and clone fresh
echo "Checking for existing repository..." >> $LOG_FILE
if [ -d "461_Phase2_1" ]; then
  echo "Deleting existing repository..." >> $LOG_FILE
  rm -rf 461_Phase2_1 >> $LOG_FILE 2>&1
fi

echo "Cloning fresh repository..." >> $LOG_FILE
git clone https://github.com/AWV2804/461_Phase2_1.git >> $LOG_FILE 2>&1

cd 461_Phase2_1
echo "Switching to the integration/1.0 branch..." >> $LOG_FILE
git checkout integration/1.0 >> $LOG_FILE 2>&1

# Install dependencies using ./run install
echo "Installing dependencies using './run install'..." >> $LOG_FILE
./run install >> $LOG_FILE 2>&1

# Start the application using npm run bstart
echo "Starting the application using 'npm run bstart'..." >> $LOG_FILE
npm run bstart >> $LOG_FILE 2>&1

# Log deployment completion
if [ "$LOG_LEVEL" -eq 1 ]; then
  echo "Deployment completed at $(date)" >> $LOG_FILE
fi
