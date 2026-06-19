#!/bin/bash
# Alias — mesmo que deploy.sh (mantido por compatibilidade)
exec "$(dirname "$0")/deploy.sh" "$@"
