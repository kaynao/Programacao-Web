// ==========================================
// UTILITÁRIOS (MOEDA E NOTIFICAÇÃO TOAST)
// ==========================================
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarToast(mensagem) {
  let toast = document.getElementById('toast-ifome');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-ifome';
    toast.className = 'toast-aviso';
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add('visivel');
  setTimeout(() => toast.classList.remove('visivel'), 2500);
}

// ==========================================
// 1. RENDERIZAÇÃO E BUSCA DO CARDÁPIO (DOM)
// ==========================================
function renderizarCardapio(filtro = '') {
  const termo = filtro.trim().toLowerCase();
  const favoritos = JSON.parse(localStorage.getItem('favoritosIFome')) || [];
  const nomesFavoritados = favoritos.map((item) => item.nome);

  const grids = {
    pizzas: document.getElementById('grid-pizzas'),
    bebidas: document.getElementById('grid-bebidas'),
    sobremesas: document.getElementById('grid-sobremesas')
  };

  const fragmentos = {
    pizzas: document.createDocumentFragment(),
    bebidas: document.createDocumentFragment(),
    sobremesas: document.createDocumentFragment()
  };

  // Filtra os dados se houver termo digitado na busca
  const itensFiltrados = cardapioDados.filter(
    (item) =>
      item.nome.toLowerCase().includes(termo) ||
      item.desc.toLowerCase().includes(termo)
  );

  itensFiltrados.forEach((item) => {
    const jaFavoritado = nomesFavoritados.includes(item.nome) ? 'favoritado' : '';
    const article = document.createElement('article');
    article.classList.add('card');

    article.innerHTML = `
      <button
        type="button"
        class="btn-favorito ${jaFavoritado}"
        aria-label="Favoritar ${item.nome}"
        data-nome="${item.nome}"
        data-preco="${item.preco}"
        data-img="${item.img}"
        data-desc="${item.desc}"
      >
        <span class="material-symbols-outlined">favorite</span>
      </button>
      <img src="${item.img}" alt="${item.nome}" loading="lazy" />
      <h3>${item.nome}</h3>
      <p>${item.desc}</p>
      <span class="preco">${formatarMoeda(item.preco)}</span>
      <button type="button" class="btn-pedido btn-add" data-nome="${item.nome}" data-preco="${item.preco}">
        Adicionar ao Carrinho
      </button>
    `;

    if (fragmentos[item.categoria]) {
      fragmentos[item.categoria].appendChild(article);
    }
  });

  // Atualiza cada grade e oculta a seção se não houver itens na busca
  Object.keys(grids).forEach((cat) => {
    if (grids[cat]) {
      grids[cat].innerHTML = '';
      const temItens = fragmentos[cat].childNodes.length > 0;
      grids[cat].appendChild(fragmentos[cat]);
      const secaoPai = document.getElementById(`sec-${cat}`);
      if (secaoPai) secaoPai.style.display = temItens ? 'block' : 'none';
    }
  });
}

// Evento de busca em tempo real
const inputBusca = document.getElementById('input-busca');
if (inputBusca) {
  inputBusca.addEventListener('input', (e) => {
    renderizarCardapio(e.target.value);
  });
}

// ==========================================
// 2. CARRINHO INTELIGENTE (AGRUPADO + LOCALSTORAGE)
// ==========================================
let carrinho = JSON.parse(localStorage.getItem('carrinhoIFome')) || [];
let taxaEntregaAtual = 0;

const listaCarrinho = document.getElementById('lista-carrinho');
const spanSubtotal = document.getElementById('valor-subtotal');
const spanFrete = document.getElementById('valor-frete');
const spanTotal = document.getElementById('valor-total');
const contadorTopo = document.getElementById('contador-carrinho');

function calcularFrete(subtotal, bairro = '') {
  const tipoServico = document.querySelector('input[name="tipo_servico"]:checked')?.value;
  if (tipoServico === 'reserva' || subtotal === 0 || subtotal > 100) {
    return 0; // Frete grátis acima de R$ 100 ou retirada/reserva
  }

  const b = bairro.toLowerCase();
  if (b.includes('vila')) return 0;
  if (b.includes('são josé') || b.includes('sao jose')) return 3;
  if (b.includes('centro')) return 7;
  return bairro ? 5 : taxaEntregaAtual; // R$ 5 padrão para outros bairros
}

function atualizarInterfaceCarrinho() {
  localStorage.setItem('carrinhoIFome', JSON.stringify(carrinho));
  listaCarrinho.innerHTML = '';

  if (carrinho.length === 0) {
    listaCarrinho.innerHTML =
      '<li id="carrinho-vazio" class="carrinho-vazio">Seu carrinho está vazio. Clique em "Adicionar ao Carrinho" no cardápio!</li>';
    spanSubtotal.textContent = formatarMoeda(0);
    spanFrete.textContent = formatarMoeda(0);
    spanTotal.textContent = formatarMoeda(0);
    contadorTopo.textContent = '0';
    return;
  }

  let subtotal = 0;
  let totalItens = 0;

  carrinho.forEach((item, index) => {
    const qtd = item.quantidade || 1;
    const totalItem = item.preco * qtd;
    subtotal += totalItem;
    totalItens += qtd;

    const li = document.createElement('li');
    li.classList.add('item-carrinho');
    li.innerHTML = `
      <div>
        <strong>${item.nome}</strong><br>
        <small>${formatarMoeda(item.preco)} un. — Subtotal: <strong>${formatarMoeda(totalItem)}</strong></small>
      </div>
      <div class="controles-qtd">
        <button type="button" class="btn-qtd" data-acao="diminuir" data-index="${index}" aria-label="Diminuir quantidade">-</button>
        <span class="qtd-numero">${qtd}</span>
        <button type="button" class="btn-qtd" data-acao="aumentar" data-index="${index}" aria-label="Aumentar quantidade">+</button>
        <button type="button" class="btn-remover" data-index="${index}">Remover</button>
      </div>
    `;
    listaCarrinho.appendChild(li);
  });

  const enderecoAtual = document.getElementById('endereco')?.value || '';
  taxaEntregaAtual = calcularFrete(subtotal, enderecoAtual);
  const totalFinal = subtotal + taxaEntregaAtual;

  spanSubtotal.textContent = formatarMoeda(subtotal);
  spanFrete.textContent = subtotal > 100 ? 'Grátis (Pedido > R$ 100)' : formatarMoeda(taxaEntregaAtual);
  spanTotal.textContent = formatarMoeda(totalFinal);
  contadorTopo.textContent = totalItens;
}

// Cliques no Cardápio (Adicionar ao Carrinho e Favoritar)
const secaoCardapio = document.getElementById('cardapio');
if (secaoCardapio) {
  secaoCardapio.addEventListener('click', (e) => {
    // Adicionar ao Carrinho (agrupa se já existir)
    const btnAdd = e.target.closest('.btn-add');
    if (btnAdd) {
      const nome = btnAdd.dataset.nome;
      const preco = parseFloat(btnAdd.dataset.preco);
      const itemExistente = carrinho.find((item) => item.nome === nome);

      if (itemExistente) {
        itemExistente.quantidade = (itemExistente.quantidade || 1) + 1;
      } else {
        carrinho.push({ nome, preco, quantidade: 1 });
      }

      atualizarInterfaceCarrinho();
      mostrarToast(`${nome} adicionado ao carrinho!`);
      return;
    }

    // Favoritar / Desfavoritar
    const btnFav = e.target.closest('.btn-favorito');
    if (btnFav) {
      let favoritos = JSON.parse(localStorage.getItem('favoritosIFome')) || [];
      const nome = btnFav.dataset.nome;
      const indice = favoritos.findIndex((item) => item.nome === nome);

      if (indice > -1) {
        favoritos.splice(indice, 1);
        btnFav.classList.remove('favoritado');
        mostrarToast(`${nome} removido dos favoritos.`);
      } else {
        favoritos.push({
          nome,
          preco: parseFloat(btnFav.dataset.preco),
          img: btnFav.dataset.img,
          desc: btnFav.dataset.desc
        });
        btnFav.classList.add('favoritado');
        mostrarToast(`${nome} salvo nos favoritos ❤️`);
      }
      localStorage.setItem('favoritosIFome', JSON.stringify(favoritos));
    }
  });
}

// Cliques dentro do Carrinho (+, - e Remover)
listaCarrinho.addEventListener('click', (e) => {
  const btnQtd = e.target.closest('.btn-qtd');
  if (btnQtd) {
    const index = Number(btnQtd.dataset.index);
    const acao = btnQtd.dataset.acao;

    if (acao === 'aumentar') {
      carrinho[index].quantidade = (carrinho[index].quantidade || 1) + 1;
    } else if (acao === 'diminuir') {
      if ((carrinho[index].quantidade || 1) > 1) {
        carrinho[index].quantidade -= 1;
      } else {
        carrinho.splice(index, 1);
      }
    }
    atualizarInterfaceCarrinho();
    return;
  }

  const btnRemover = e.target.closest('.btn-remover');
  if (btnRemover) {
    const index = Number(btnRemover.dataset.index);
    carrinho.splice(index, 1);
    atualizarInterfaceCarrinho();
  }
});

// Recalcula frete se mudar entre Entrega e Reserva de Mesa
document.querySelectorAll('input[name="tipo_servico"]').forEach((radio) => {
  radio.addEventListener('change', atualizarInterfaceCarrinho);
});

// ==========================================
// 3. CEP (VIACEP) E DADOS DO PERFIL
// ==========================================
const inputCep = document.getElementById('cep');
const inputEndereco = document.getElementById('endereco');
const erroCep = document.getElementById('erro-cep');

async function consultarCEP(valorCep) {
  const cepValido = /^\d{5}-\d{3}$/.test(valorCep);
  if (!cepValido) return;

  erroCep.textContent = 'Buscando endereço...';
  erroCep.classList.add('info');

  try {
    const cepLimpo = valorCep.replace('-', '');
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
      atualizarInterfaceCarrinho(); // Recalcula frete pelo bairro
    }
  } catch (erro) {
    erroCep.classList.remove('info');
    erroCep.textContent = 'Erro ao buscar CEP. Digite o endereço manualmente.';
  }
}

inputCep.addEventListener('input', (e) => {
  let valor = e.target.value.replace(/\D/g, '');
  if (valor.length > 5) {
    valor = valor.replace(/^(\d{5})(\d)/, '$1-$2');
  }
  e.target.value = valor;

  if (/^\d{5}-\d{3}$/.test(valor)) {
    consultarCEP(valor);
  } else {
    erroCep.classList.remove('info');
    inputCep.classList.remove('valido');
    erroCep.textContent = valor.length > 0 ? 'Formato esperado: 00000-000' : '';
  }
});

// ==========================================
// 4. VALIDAÇÃO AO ENVIAR O PEDIDO
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

  camposObrigatorios.forEach(({ el }) => {
    el.classList.remove('invalido');
    el.removeAttribute('aria-invalid');
    const spanErro = document.getElementById(`erro-${el.id}`);
    if (spanErro) spanErro.textContent = '';
  });

  if (carrinho.length === 0) {
    alert('Erro: Seu carrinho está vazio! Adicione pelo menos um item do cardápio antes de enviar.');
    document.getElementById('cardapio').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  let camposEmBranco = [];

  camposObrigatorios.forEach(({ el, nome }) => {
    if (el.value.trim() === '') {
      camposEmBranco.push(nome);
      el.classList.add('invalido');
      el.setAttribute('aria-invalid', 'true');
      const spanErro = document.getElementById(`erro-${el.id}`);
      if (spanErro) spanErro.textContent = `O campo ${nome} é obrigatório.`;
    }
  });

  if (inputCep.value.trim() !== '' && !/^\d{5}-\d{3}$/.test(inputCep.value)) {
    camposEmBranco.push('CEP válido (00000-000)');
    inputCep.classList.add('invalido');
    inputCep.setAttribute('aria-invalid', 'true');
    erroCep.textContent = 'Formato inválido. Use 00000-000.';
  }

  if (camposEmBranco.length > 0) {
    alert(`Erro ao enviar o pedido! Preencha os seguintes campos obrigatórios:\n\n- ${camposEmBranco.join('\n- ')}`);
    document.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  const nomeCliente = document.getElementById('nome').value;
  alert(`Pedido confirmado com sucesso, ${nomeCliente}!\nTotal pago: ${spanTotal.textContent}`);

  // Reseta carrinho e formulário
  carrinho = [];
  taxaEntregaAtual = 0;
  atualizarInterfaceCarrinho();
  formPedido.reset();
  camposObrigatorios.forEach(({ el }) => el.classList.remove('valido'));
});

// ==========================================
// 5. INICIALIZAÇÃO DA PÁGINA
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  renderizarCardapio();
  atualizarInterfaceCarrinho();

  // Preenche automaticamente com os dados salvos no perfil.html, se existirem
  const perfilSalvo = JSON.parse(localStorage.getItem('usuarioIFome'));
  if (perfilSalvo) {
    if (perfilSalvo.nome) document.getElementById('nome').value = perfilSalvo.nome;
    if (perfilSalvo.telefone) document.getElementById('telefone').value = perfilSalvo.telefone;
    if (perfilSalvo.email) document.getElementById('email').value = perfilSalvo.email;
    if (perfilSalvo.cep) document.getElementById('cep').value = perfilSalvo.cep;
    if (perfilSalvo.endereco) document.getElementById('endereco').value = perfilSalvo.endereco;
    if (perfilSalvo.complemento) document.getElementById('observacoes').value = perfilSalvo.complemento;
    atualizarInterfaceCarrinho();
  }
});

// ==========================================
// MÁSCARA DE TELEFONE E VALIDAÇÃO EM TEMPO REAL
// ==========================================
const inputTelefone = document.getElementById('telefone');
const inputEmail = document.getElementById('email');

if (inputTelefone) {
  inputTelefone.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = v.substring(0, 15);

    const erroTel = document.getElementById('erro-telefone');
    const valido = /^\(\d{2}\) \d{4,5}-\d{4}$/.test(e.target.value);

    if (e.target.value.length === 0) {
      e.target.classList.remove('valido', 'invalido');
      if (erroTel) erroTel.textContent = '';
    } else if (valido) {
      e.target.classList.add('valido');
      e.target.classList.remove('invalido');
      e.target.setAttribute('aria-invalid', 'false');
      if (erroTel) erroTel.textContent = '';
    } else {
      e.target.classList.add('invalido');
      e.target.classList.remove('valido');
      e.target.setAttribute('aria-invalid', 'true');
      if (erroTel) erroTel.textContent = 'Formato esperado: (32) 99999-9999';
    }
  });
}

if (inputEmail) {
  inputEmail.addEventListener('blur', (e) => {
    const erroEmail = document.getElementById('erro-email');
    const valor = e.target.value.trim();
    const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

    if (valor === '') {
      e.target.classList.remove('valido', 'invalido');
      if (erroEmail) erroEmail.textContent = '';
    } else if (valido) {
      e.target.classList.add('valido');
      e.target.classList.remove('invalido');
      e.target.setAttribute('aria-invalid', 'false');
      if (erroEmail) erroEmail.textContent = '';
    } else {
      e.target.classList.add('invalido');
      e.target.classList.remove('valido');
      e.target.setAttribute('aria-invalid', 'true');
      if (erroEmail) erroEmail.textContent = 'Digite um e-mail válido (ex: nome@dominio.com).';
    }
  });
}