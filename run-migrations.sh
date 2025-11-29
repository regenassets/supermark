#!/bin/bash
set -a
source .env.local
set +a
npx prisma migrate deploy
