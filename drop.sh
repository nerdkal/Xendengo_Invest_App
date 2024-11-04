#!/bin/bash

# Conectar ao MongoDB e executar os comandos
mongosh --quiet <<EOF
use ticker
db.dropDatabase("ticker")
db.dropUser('user')
EOF
