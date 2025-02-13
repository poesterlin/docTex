#!/bin/bash

# Fetch latest changes from remote
git fetch

# Check if there are any changes between local and remote
if ! git diff --quiet HEAD origin/$(git rev-parse --abbrev-ref HEAD); then
    echo "Changes detected, updating..."
    git pull
    docker compose -f compose.prod.yaml up -d --build
else
    echo "No changes detected, skipping update."
fi
