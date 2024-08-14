const starkbank = require('starkbank')
const fs = require("fs")
const axios = require("axios")

const urlPlanilha = ""

const WS001 = ""
const WS002 = ""
const WS003 = ""
const WS008 = ""
const WS009 = ""

const nameAccounts = {
    "": "WS001",
    "": "WS002",
    "": "WS003",
    "": "WS008",
    "": "WS009"
}

function parseValor(valor) {
    if ( valor.length == 1 ) {
        return valor
    }
    let sinal = ""
    if ( valor.includes('-') ) {
        sinal = "-"
        valor = valor.slice(1)
    }
    if ( valor.length == 10 ) {
        return sinal + valor.slice(0, 8) +','+ valor.slice(-2)
    }
    if ( valor.length == 9 ) {
        return sinal + valor.slice(0, 7) +','+ valor.slice(-2)
    }
    if ( valor.length == 8 ) {
        return sinal + valor.slice(0, 6) +','+ valor.slice(-2)
    }
    if ( valor.length == 7 ) {
        return sinal + valor.slice(0, 5) +','+ valor.slice(-2)
    }
    if ( valor.length == 6 ) {
        return sinal + valor.slice(0, 4) +','+ valor.slice(-2)
    }
    if ( valor.length == 5 ) {
        return sinal + valor.slice(0, 3) +','+ valor.slice(-2)
    }
    if ( valor.length == 4 ) {
        return sinal + valor.slice(0, 2) +','+ valor.slice(-2)
    }
    if ( valor.length == 3 ) {
        return sinal + valor.slice(0, 1) +','+ valor.slice(-2)
    }
    if ( valor.length == 2 ) {
        return sinal + '0,'+ valor.slice(-2)
    }
}


async function get_user(idAccount) {
    let user = new starkbank.Project({
        environment: 'production',
        id: idAccount,
        privateKey: fs.readFileSync('./privateKey.pem', {encoding: 'utf-8'})
    })
    return user
}
async function get_balance(usuario) {
    let balance = await starkbank.balance.get({user: usuario})
    return balance
}
function formateDate(date) {
    return date.split(',')[0].split('/').reverse().join('-')
}
async function get_transactions(usuario) {
    let date = new Date().toLocaleString('pt-BR')
    let dataFormatada = formateDate(date)
    console.log('\nBuscando as transações do dia => ', dataFormatada, '\n')
    let transactions = await starkbank.transaction.query({
        after:  dataFormatada,//'2024-08-11',
        before: dataFormatada,//'2024-08-11', 
        user: usuario, 
        limit: 100
    });
    return transactions
}

async function write_sheet(data, nameSheet) {
    let tags = ""
    for ( let tag of data.tags ) {
        tags += ' ,'+tag
    }
    let response = await axios(`${urlPlanilha}?gravar=true&guia=${nameSheet}&id=${data.id}&externalId=${data.externalId}&receiverId=${data.receiverId}&description=${data.description}&amount=${parseValor(data.amount.toString())}&balance=${parseValor(data.balance.toString())}&fee=${data.fee}&source=${data.source}&tags=${tags.slice(2)}&data=${formateHora(data.created.split('.')[0])}`)
    return response.data
}

async function read_sheet(nameSheet) {
    try {
        let response = await axios(`${urlPlanilha}?consulta=true&guia=${nameSheet}`)
        return response.data.ids
    }catch(e) { return { erro: true }}
}

async function write_transactions(account, nameSheet) {
    let objSheet = await read_sheet(nameSheet)
    let usuario = await get_user(account)
    let balance = await get_balance(usuario)
    let transactions = await get_transactions(usuario)

    let count = 0
    for await (let transaction of transactions) {
        if ( typeof objSheet[transaction.id] == 'undefined' ) {
            await write_sheet(transaction, nameSheet)
            console.log(transaction)
            count++
        }
    }
    console.log('qtde de dados escritas =>', count)
    
    console.log("balance => ", balance)
}


function formateHora(hora) {
    let date=new Date(hora)
    date.setHours(date.getHours()-3)
    return date.toLocaleString('pt-BR').split(', ')[0].split('/').reverse().join('-') + 'T' + date.toLocaleString('pt-BR').split(', ')[1]
}


async function run_accounts() {
    for ( let account of [WS001, WS002, WS003, WS008, WS009] ) {
        console.log("Iniciando =>", account, nameAccounts[account])
        await write_transactions(account, nameAccounts[account]) 
    }
}


run_accounts()


