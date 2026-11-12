// ==========================================
// 1. CARRINHO DE COMPRAS DINÂMICO (DOM)
// ==========================================
let totalCarrinho = 0;
let quantidadeItens = 0;

const listaCarrinho = document.getElementById('lista-carrinho');
const spanTotal = document.getElementById('valor-total');
const msgVazio = document.getElementById('carrinho-vazio');
const contadorTopo = document.getElementById('contador-carrinho');

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarResumoCarrinho(valorAlterado, qtdAlterada) {
  totalCarrinho += valorAlterado;
  quantidadeItens += qtdAlterada;

  if (totalCarrinho < 0.01) totalCarrinho = 0;
  if (quantidadeItens < 0) quantidadeItens = 0;

  spanTotal.textContent = formatarMoeda(totalCarrinho);
  contadorTopo.textContent = quantidadeItens;

  msgVazio.style.display = quantidadeItens === 0 ? 'block' : 'none';
}

// Adicionar itens ao clicar em "Adicionar ao Carrinho"
document.querySelectorAll('.btn-add').forEach((botao) => {
  botao.addEventListener('click', () => {
    const nome = botao.dataset.nome;
    const preco = parseFloat(botao.dataset.preco);

    const li = document.createElement('li');
    li.classList.add('item-carrinho');
    li.dataset.preco = preco;

    li.innerHTML = `
      <span><strong>${nome}</strong> — ${formatarMoeda(preco)}</span>
      <button type="button" class="btn-remover">Remover</button>
    `;

    listaCarrinho.appendChild(li);
    atualizarResumoCarrinho(preco, 1);

    // Feedback rápido no botão
    const textoOriginal = botao.textContent;
    botao.textContent = 'Adicionado! ✓';
    setTimeout(() => {
      botao.textContent = textoOriginal;
    }, 800);
  });
});

// Remover itens com Delegação de Eventos
listaCarrinho.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-remover')) {
    const itemLi = e.target.closest('.item-carrinho');
    const precoItem = parseFloat(itemLi.dataset.preco);

    itemLi.remove();
    atualizarResumoCarrinho(-precoItem, -1);
  }
});

// ==========================================
// 2. VALIDAÇÃO E PREENCHIMENTO DE CEP
// ==========================================
const inputCep = document.getElementById('cep');
const inputEndereco = document.getElementById('endereco');
const erroCep = document.getElementById('erro-cep');

inputCep.addEventListener('input', async (e) => {
  let valor = e.target.value.replace(/\D/g, '');
  if (valor.length > 5) {
    valor = valor.replace(/^(\d{5})(\d)/, '$1-$2');
  }
  e.target.value = valor;

  const cepValido = /^\d{5}-\d{3}$/.test(valor);

  if (cepValido) {
    erroCep.textContent = 'Buscando endereço...';
    erroCep.classList.add('info');

    try {
      const cepLimpo = valor.replace('-', '');
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resposta.json();

      erroCep.classList.remove('info');

      if (dados.erro) {
        erroCep.textContent = 'CEP não encontrado.';
        inputCep.classList.add('invalido');
        inputCep.classList.remove('valido');
      } else {
        inputEndereco.value = `${dados.logradouro}, ${dados.bairro}, ${dados.localidade} - ${dados.uf}`;
        erroCep.textContent = '';
        inputCep.classList.remove('invalido');
        inputCep.classList.add('valido');
        inputEndereco.classList.add('valido');
        inputEndereco.classList.remove('invalido');
      }
    } catch (erro) {
      erroCep.classList.remove('info');
      erroCep.textContent = 'Não foi possível buscar o CEP. Digite o endereço manualmente.';
    }
  } else {
    erroCep.classList.remove('info');
    inputCep.classList.remove('valido');
    if (valor.length > 0) {
      erroCep.textContent = 'Formato esperado: 00000-000';
      inputCep.classList.add('invalido');
    } else {
      erroCep.textContent = '';
      inputCep.classList.remove('invalido');
    }
  }
});

// ==========================================
// 3. VALIDAÇÃO AO ENVIAR O PEDIDO
// ==========================================
const formPedido = document.getElementById('form-pedido');

formPedido.addEventListener('submit', (event) => {
  event.preventDefault();

  const camposObrigatorios = [
    { el: document.getElementById('nome'), nome: 'Nome Completo' },
    { el: document.getElementById('telefone'), nome: 'WhatsApp / Telefone' },
    { el: document.getElementById('email'), nome: 'E-mail' },
    { el: document.getElementById('cep'), nome: 'CEP' },
    { el: document.getElementById('endereco'), nome: 'Endereço' },
    { el: document.getElementById('data'), nome: 'Data Desejada' },
    { el: document.getElementById('hora'), nome: 'Horário' },
    { el: document.getElementById('pagamento'), nome: 'Forma de Pagamento' }
  ];

  // Limpa erros anteriores
  camposObrigatorios.forEach(({ el }) => {
    el.classList.remove('invalido');
    const spanErro = document.getElementById(`erro-${el.id}`);
    if (spanErro) spanErro.textContent = '';
  });

  // 1. Verifica se o carrinho está vazio
  if (quantidadeItens === 0) {
    alert('Erro: Seu carrinho está vazio! Adicione pelo menos um item do cardápio antes de enviar.');
    document.getElementById('cardapio').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // 2. Verifica campos em branco
  let camposEmBranco = [];

  camposObrigatorios.forEach(({ el, nome }) => {
    if (el.value.trim() === '') {
      camposEmBranco.push(nome);
      el.classList.add('invalido');
      const spanErro = document.getElementById(`erro-${el.id}`);
      if (spanErro) spanErro.textContent = `O campo ${nome} é obrigatório.`;
    }
  });

  // Validação extra do formato do CEP
  const cepEl = document.getElementById('cep');
  if (cepEl.value.trim() !== '' && !/^\d{5}-\d{3}$/.test(cepEl.value)) {
    camposEmBranco.push('CEP válido (00000-000)');
    cepEl.classList.add('invalido');
    document.getElementById('erro-cep').textContent = 'Formato inválido. Use 00000-000.';
  }

  // Alerta de erro se houver campos em branco
  if (camposEmBranco.length > 0) {
    alert(`Erro ao enviar o pedido! Por favor, preencha os seguintes campos obrigatórios:\n\n- ${camposEmBranco.join('\n- ')}`);
    return;
  }

  // Sucesso!
  const nomeCliente = document.getElementById('nome').value;
  alert(`Pedido confirmado com sucesso, ${nomeCliente}!\nItens: ${quantidadeItens}\nTotal: ${formatarMoeda(totalCarrinho)}`);

  // Limpa tudo após o envio
  formPedido.reset();
  listaCarrinho.querySelectorAll('.item-carrinho').forEach((item) => item.remove());
  atualizarResumoCarrinho(-totalCarrinho, -quantidadeItens);
  camposObrigatorios.forEach(({ el }) => el.classList.remove('valido'));
});