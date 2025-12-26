#!/bin/bash
# Script completo para instalar e configurar MongoDB 8.0 no Ubuntu (instância privada)

# -----------------------------
# 1️⃣ Atualizar e instalar dependências
# -----------------------------
sudo apt-get update
sudo apt-get install -y gnupg curl

# -----------------------------
# 2️⃣ Adicionar chave e repositório MongoDB
# -----------------------------
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-o                      rg/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# -----------------------------
# 3️⃣ Instalar MongoDB
# -----------------------------
sudo apt-get update
sudo apt-get install -y mongodb-org

# -----------------------------
# 4️⃣ Configurar bind IP e ativar autenticação
# -----------------------------
# Ajuste o bindIp para localhost + IP privado da instância
PRIVATE_IP=$(hostname -I | awk '{print $1}')
sudo sed -i "/^  bindIp:/c\  bindIp: 127.0.0.1,$PRIVATE_IP" /etc/mongod.conf

# Ativar autenticação
sudo sed -i '/^#security:/a\security:\n  authorization: enabled' /etc/mongod.conf

# -----------------------------
# 5️⃣ Iniciar e habilitar serviço MongoDB
# -----------------------------
sudo systemctl enable mongod
sudo systemctl restart mongod
sudo systemctl status mongod

# -----------------------------
# 6️⃣ Criar database, collection e usuário da aplicação
# -----------------------------
DB_NAME="ticker"
COLLECTION_NAME="acoes"
APP_USER="user"
APP_PASS="pass"  # altere para uma senha forte

echo -e "use $DB_NAME\ndb.createCollection('$COLLECTION_NAME')\ndb.createUser({ user: '$APP_USER', pwd: '$APP_PASS', roles: [ { role:](                      )

ubuntu@ip-10-0-132-178:~$
ubuntu@ip-10-0-132-178:~$ vim comando.sh
ubuntu@ip-10-0-132-178:~$ cat $_
#!/bin/bash
# Script completo para instalar e configurar MongoDB 8.0 no Ubuntu (instância privada)

# -----------------------------
# 1️⃣ Atualizar e instalar dependências
# -----------------------------
sudo apt-get update
sudo apt-get install -y gnupg curl

# -----------------------------
# 2️⃣ Adicionar chave e repositório MongoDB
# -----------------------------
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# -----------------------------
# 3️⃣ Instalar MongoDB
# -----------------------------
sudo apt-get update
sudo apt-get install -y mongodb-org

# -----------------------------
# 4️⃣ Configurar bind IP e ativar autenticação
# -----------------------------
# Ajuste o bindIp para localhost + IP privado da instância
PRIVATE_IP=$(hostname -I | awk '{print $1}')
sudo sed -i "/^  bindIp:/c\  bindIp: 127.0.0.1,$PRIVATE_IP" /etc/mongod.conf

# Ativar autenticação
sudo sed -i '/^#security:/a\security:\n  authorization: enabled' /etc/mongod.conf

# -----------------------------
# 5️⃣ Iniciar e habilitar serviço MongoDB
# -----------------------------
sudo systemctl enable mongod
sudo systemctl restart mongod
sudo systemctl status mongod

# -----------------------------
# 6️⃣ Criar database, collection e usuário da aplicação
# -----------------------------
DB_NAME="ticker"
COLLECTION_NAME="acoes"
APP_USER="user"
APP_PASS="pass"  # altere para uma senha forte

echo -e "use $DB_NAME\ndb.createCollection('$COLLECTION_NAME')\ndb.createUser({ user: '$APP_USER', pwd: '$APP_PASS', roles: [ { role:]()

