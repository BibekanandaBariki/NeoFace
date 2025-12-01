#!/bin/bash

# Start the advanced AI/ML face recognition service (75%+ similarity threshold)
cd "$(dirname "$0")"
/opt/homebrew/bin/python3.10 app_advanced.py
