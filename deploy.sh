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
stop_process_on_port 8080
stop_process_on_port 8081

# Install dependencies using ./run install
# echo "Installing dependencies using './run install'..." >> $LOG_FILE
# ./run install >> $LOG_FILE 2>&1

# Start the backend server in the background
echo "Starting backend server in the background..." >> $LOG_FILE
nohup npm run bstart > $LOG_FILE 2>&1 &

# # Start the frontend server in the background
# echo "Starting frontend server in the background..." >> $LOG_FILE
# nohup npm run start > $LOG_FILE 2>&1 &

# Log deployment completion
if [ "$LOG_LEVEL" -eq 1 ]; then
  echo "Deployment completed at $(date)" >> $LOG_FILE
fi
