const Redux = require('redux')
//função criadora de ação: ela cria novos contratos
const criarContrato = (nome, taxa) => {
  //ela devolve uma ação, ou seja, um objeto JS
  return {
    type: "CRIAR_CONTRATO",
    payload: {
      nome, taxa
    }
  }
}
//escrever a criadora de ação para cancelamento de contrato
//2 minutos
const cancelarContrato = (nome) => {
  return {
    type: 'CANCELAR_CONTRATO',
    payload: {
      nome
    }
  }
}

const solicitarCashback = (nome, valor) => {
  return {
    type: "CASHBACK",
    payload: { nome, valor }
  }
}

//reducer para lidar com as solicitações de cashback
const historicoDePedidosDeCashback = (historicoDePedidosDeCashbackAtual = [], acao) => {
  if (acao.type === "CASHBACK") {
    return [
      ...historicoDePedidosDeCashbackAtual,
      acao.payload
    ]
  }
  return historicoDePedidosDeCashbackAtual
}

const caixa = (dinheiroEmCaixa = 0, acao) => {
  if (acao.type === "CASHBACK") {
    dinheiroEmCaixa -= acao.payload.valor
  }
  else if (acao.type === "CRIAR_CONTRATO") {
    dinheiroEmCaixa += acao.payload.taxa
  }
  return dinheiroEmCaixa
}

const contratos = (listaDeContratosAtual = [], acao) => {
  if (acao.type === "CRIAR_CONTRATO")
    return [...listaDeContratosAtual, acao.payload]
  if (acao.type === "CANCELAR_CONTRATO")
    return listaDeContratosAtual.filter(c => c.nome !== acao.payload.nome)
  return listaDeContratosAtual
}

const { createStore, combineReducers } = Redux

const todosOsReducers = combineReducers({
  historicoDePedidosDeCashback, caixa, contratos
})

const store = createStore(todosOsReducers)
