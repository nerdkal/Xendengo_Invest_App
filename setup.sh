#!/bin/bash

# Verificar se o whiptail está instalado, caso contrário, instalar
if ! command -v whiptail &> /dev/null; then
    echo "whiptail não encontrado. Instalando..."
    sudo apt-get install -y whiptail || { echo "Erro ao instalar o whiptail."; exit 1; }
fi

# Função para exibir mensagens de erro
function error_msg() {
    whiptail --title "Erro" --msgbox "$1" 8 45
}

# Função para executar comandos e verificar erros
function run_cmd() {
    eval "$1"
    if [ $? -ne 0 ]; then
        error_msg "Falha ao executar: $1"
        exit 1
    fi
}

# Função para mudar de diretório com verificação
function change_dir() {
    if [ -d "$1" ]; then
        cd "$1" || { error_msg "Falha ao acessar o diretório: $1"; exit 1; }
    else
        error_msg "O diretório $1 não existe."
        exit 1
    fi
}

# Mensagem de boas-vindas
whiptail --title "Configuração do Xendengo Invest App" --msgbox "Bem-vindo! Este script irá instalar e configurar o Xendengo Invest App." 10 60

# 1. Clonar o repositório
run_cmd "git clone https://github.com/nerdkal/Xendengo_Invest_App"

# Mudar para o diretório clonado
change_dir "Xendengo_Invest_App"

# Verificar o branch
run_cmd "git checkout App"

# 2. Configurar Git (Opcional)
if (whiptail --yesno "Você deseja configurar o Git?" 10 60); then
    GIT_EMAIL=$(whiptail --inputbox "Digite seu e-mail do Git:" 10 60 "your git mail" 3>&1 1>&2 2>&3)
    GIT_NAME=$(whiptail --inputbox "Digite seu nome do Git:" 10 60 "your git user" 3>&1 1>&2 2>&3)
    GITHUB_TOKEN=$(whiptail --inputbox "Digite seu Token do GitHub:" 10 60 "TOKEN" 3>&1 1>&2 2>&3)

    run_cmd "git config --global user.email \"$GIT_EMAIL\""
    run_cmd "git config --global user.name \"$GIT_NAME\""
    run_cmd "git remote set-url origin https://$GIT_NAME:$GITHUB_TOKEN@github.com/nerdkal/Xendengo_Invest_App.git"
else
    whiptail --title "Git" --msgbox "Configuração do Git ignorada." 10 60
fi

# 3. Instalar MongoDB
if (whiptail --yesno "Você deseja instalar o MongoDB?" 10 60); then
    run_cmd "sudo apt-get install -y gnupg curl"
    run_cmd "curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor"
    run_cmd "echo \"deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse\" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list"
    run_cmd "sudo apt-get update -y"
    run_cmd "sudo apt-get install mongodb-org -y"
    run_cmd "sudo systemctl start mongod"

    # Criar banco de dados e usuário
    mongosh --quiet <<EOF
use ticker
db.createCollection('acoes')
db.createUser({
    user: 'user',
    pwd: 'pass',
    roles: [{ role: 'readWrite', db: 'ticker' }]
})
EOF
fi

# 4. Instalar npm
run_cmd "sudo apt install npm -y"

# 5. Instalar dependências
run_cmd "npm install express axios cheerio mongoose mongodb dotenv"

# 6. Executar o aplicativo
if (whiptail --yesno "Deseja executar o aplicativo agora?" 10 60); then
    run_cmd "node ."
fi

whiptail --title "Concluído" --msgbox "Configuração do Xendengo Invest App concluída!" 10 60
