const Redux = require('redux')
const prompts = require('prompts')

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
  //ela devolve uma ação, ou seja, um objeto JSON
  return {
    type: "CRIAR_CONTRATO",
    payload: {
      nome,
      taxa,
      dataCriacao: obterDataAtual()
    }
  };
};

//função criadora de ação: cancelar contrato, incluindo a data
const cancelarContrato = (nome) => {
  return {
    type: 'CANCELAR_CONTRATO',
    payload: {
      nome,
      dataCancelamento: obterDataAtual()
    }
  };
};

//função criadora de ação: solicitação de cashback
const solicitarCashback = (nome, valor) => {
  return {
    type: "CASHBACK",
    payload: {
      nome, 
      valor
    }
  };
};

//reducer para lidar com as solicitações de cashback
const historicoDePedidosDeCashback = (historicoAtual = [], acao) => {
  if (acao.type === "CASHBACK") {
    const cashbackDisponivel = store.getState().cashbackPorUsuario[acao.payload.nome] || 0;
    const status = cashbackDisponivel >= acao.payload.valor ? "ATENDIDO" : "NÃO_ATENDIDO";
    return [
      ...historicoAtual,
      {...acao.payload, status, data: obterDataAtual() }
    ]
  }
  return historicoAtual;
};

//reducer para gerenciar o caixa, incluindo a multa por cancelamento antecipado
const caixa = (dinheiroEmCaixa = 0, acao) => {
  if (acao.type === "CASHBACK" ) {
    const historico = store.getState().historicoDePedidosDeCashback;
    const ultimoPedido = historico[historico.length - 1];
    if (ultimoPedido && ultimoPedido.status === "ATENDIDO") {
      return dinheiroEmCaixa - acao.payload.valor;
    }
  } else if (acao.type === "CRIAR_CONTRATO") {
    return dinheiroEmCaixa + acao.payload.taxa;
  } else if (acao.type === "CANCELAR_CONTRATO") {
    const contratoCancelado = store.getState().contratos.find(c => c.nome === acao.payload.nome);

    if (contratoCancelado) {
      //verifica se o contrato tem menos de 3 meses
      const dataCriacao = new Date(contratoCancelado.dataCriacao.split('/').reverse().join('-'));
      const dataCancelamento = new Date(acao.payload.dataCancelamento.split('/').reverse().join('-'));
      const diferencaEmMeses = (dataCancelamento.getFullYear() - dataCriacao.getFullYear()) * 12 + (dataCancelamento.getMonth() - dataCriacao.getMonth());
      if (diferencaEmMeses < 3) {
        return dinheiroEmCaixa - 100;
      }
    }
  } else if (acao.type === "COMPRAR_PRODUTO") {
    return dinheiroEmCaixa + acao.payload.valor;
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
  } else if (acao.type === "CASHBACK") {
    const cashbackDisponivel = estadoAtual[acao.payload.nome] || 0;
    if (cashbackDisponivel >= acao.payload.valor) {
      return {
        ...estadoAtual,
        [acao.payload.nome]: estadoAtual[acao.payload.nome] - acao.payload.valor
      };
    }
  }
  return estadoAtual;
}

//reducer para gerenciar os contratos
const contratos = (listaDeContratosAtual = [], acao) => {
  if (acao.type === "CRIAR_CONTRATO")
    return [...listaDeContratosAtual, acao.payload]
  if (acao.type === "CANCELAR_CONTRATO")
    return listaDeContratosAtual.filter(c => c.nome !== acao.payload.nome)
  return listaDeContratosAtual;
};

const { createStore, combineReducers } = Redux;

const todosOsReducers = combineReducers({
  historicoDePedidosDeCashback,
  caixa,
  contratos,
  cashbackPorUsuario
});

const store = createStore(todosOsReducers);

// Menu interativo
(async () => {
  let continuar = true;

  while (continuar) {
    const resposta = await prompts({
      type: 'select',
      name: 'opcao',
      message: 'Escolha uma opção:',
      choices: [
        { title: '1. Realizar novo contrato', value: 1 },
        { title: '2. Cancelar contrato existente', value: 2 },
        { title: '3. Consultar saldo de cashbak', value: 3 },
        { title: '4. Fazer pedido de cashback', value: 4 },
        { title: '5. Exibir saldo em caixa', value: 5 },
        { title: '0. Sair', value: 0 }
      ]
    });

    switch (resposta.opcao) {
      case 1:
        const contrato = await prompts([
          { type: 'text', name: 'nome', message: 'Nome do contrato:' },
          { type: 'number', name: 'taxa', message: 'Taxa do contrato:' }
        ]);
        store.dispatch(criarContrato(contrato.nome, contrato.taxa));
        break;
      case 2:
        const cancelamento = await prompts({ type: 'text', name: 'nome', message: 'Nome do cliente para cancelamento:' });
        store.dispatch(cancelarContrato(cancelamento.nome));
        break;
      case 3:
        const consulta = await prompts({ type: 'text', name: 'nome', message: 'Nome do cliente:' });
        console.log(`Saldo de cashback de ${consulta.nome}: R$${store.getState().cashbackPorUsuario[consulta.nome] || 0}`);
        break;
      case 4:
        const pedido = await prompts([
          { type: 'text', name: 'nome', message: 'Nome do cliente:' },
          { type: 'number', name: 'valor', message: 'Valor do cashback solicitado:' }
        ]);
        store.dispatch(solicitarCashback(pedido.nome, pedido.valor));
        break;
      case 5:
        console.log(`Saldo em caixa: R$${store.getState().caixa}`);
        break;
      case 0:
        continuar = false;
        break;
      default:
        console.log('Opção inválida');
    }
    console.log(store.getState());
  }
})();
