const Redux = require('redux')

// Função utilitária para obter a data atual formatada
const obterDataAtual = () => {
  const data = new Date()
  return `${data.getDate()}/${data.getMonth() + 1}/${data.getFullYear()}`;
};

//função criadora de ação: compra de um produto
const comprarProduto = (nome, produto, valor) => {
  return {
    type: 'COMPRAR_PRODUTO',
    payload: {
      nome,
      produto,
      valor
    }
  };
};

//função criadora de ação: ela cria novos contratos, agora incluindo a data
const criarContrato = (nome, taxa) => {
  //ela devolve uma ação, ou seja, um objeto JS
  return {
    type: "CRIAR_CONTRATO",
    payload: {
      nome,
      taxa,
      dataCriacao: obterDataAtual()
    }
  };
};

//escrever a criadora de ação para cancelamento de contrato
//incluindo a data de cancelamento
const cancelarContrato = (nome) => {
  return {
    type: 'CANCELAR_CONTRATO',
    payload: {
      nome,
      dataCancelamento: obterDataAtual()
    }
  };
};

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

//reducer para gerenciar o caixa, incluindo a multa por cancelamento antecipado
const caixa = (dinheiroEmCaixa = 0, acao) => {
  if (acao.type === "CASHBACK") {
    dinheiroEmCaixa -= acao.payload.valor
  }
  else if (acao.type === "CRIAR_CONTRATO") {
    dinheiroEmCaixa += acao.payload.taxa
  }
  else if (acao.type === "CANCELAR_CONTRATO") {
    const contratoCancelado = contratos().find(c => c.nome === acao.payload.nome);

    if (contratoCancelado) {
      //verifica se o contrato tem menos de 3 meses
      const dataCriacao = new Date(contratoCancelado.dataCriacao.split('/').reverse().join('-'));
      const dataCancelamento = new Date(acao.payload.dataCancelamento.split('/').reverse().join('-'));
      const diferencaEmMeses = (dataCancelamento.getFullYear() - dataCriacao.getFullYear()) * 12 + (dataCancelamento.getMonth() - dataCriacao.getMonth());
      if (diferencaEmMeses < 3) {
        dinheiroEmCaixa -= 100;
      }
    }
  }
  else if (acao.type === "COMPRAR_PRODUTO") {
    dinheiroEmCaixa += acao.payload.valor;
  }
  return dinheiroEmCaixa;
};

// reducer para gerenciar cashback por usuário
const cashbackPorUsuario = (estadoAtual = {}, acao) => {
  if (acao.type === "COMPRAR_PRODUTO") {
    const { nome, valor } = acao.payload;
    const cashbackGerado = valor * 0.1;
    return {
      ...estadoAtual,
      [nome]: (estadoAtual[nome] || 0) + cashbackGerado
    };
  }
  return estadoAtual;
}

//reducer para gerenciar os contratos
const contratos = (listaDeContratosAtual = [], acao) => {
  if (acao.type === "CRIAR_CONTRATO")
    return [...listaDeContratosAtual, acao.payload]
  if (acao.type === "CANCELAR_CONTRATO")
    return listaDeContratosAtual.filter(c => c.nome !== acao.payload.nome)
  return listaDeContratosAtual
}

const { createStore, combineReducers } = Redux;

const todosOsReducers = combineReducers({
  historicoDePedidosDeCashback,
  caixa,
  contratos,
  cashbackPorUsuario
});

const store = createStore(todosOsReducers);
