#!/bin/bash
echo "Starting Feedback Widget Development Server..."
echo ""
echo "The demo will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""
python3 -m http.server 8000
