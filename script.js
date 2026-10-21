// ---------- Configurações ----------
const NOTA_MAXIMA = 20;
const NOTA_APROVACAO = 10;
const MAX_PROVAS = 12;

// ---------- Elementos ----------
const $ = (seletor) => document.querySelector(seletor);

const form = $("#form");
const nomeEl = $("#nome");
const qtdEl = $("#qtd");
const notasBox = $("#notas");
const campos = $("#campos");
const erroEl = $("#erro");
const btnCalcular = $("#calcular");
const btnLimpar = $("#limpar");

const vazio = $("#vazio");
const conteudo = $("#conteudo");
const carimbo = $("#carimbo");
const mediaEl = $("#media");
const barra = $("#barra");
const mensagemEl = $("#mensagem");
const historicoBox = $("#historico");
const lista = $("#lista");

const historico = [];

// ---------- Funções auxiliares ----------
const formatar = (n) =>
  n.toLocaleString("pt-PT", { maximumFractionDigits: 1 });

const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function classificar(media) {
  if (media >= 17) return "uma nota excelente";
  if (media >= 14) return "uma boa nota";
  if (media >= NOTA_APROVACAO) return "uma nota suficiente";
  if (media >= 5) return "uma nota negativa";
  return "uma nota muito baixa";
}

function mostrarErro(texto, campo) {
  erroEl.textContent = texto;
  if (campo) {
    campo.classList.add("invalido");
    campo.focus();
  }
}

function limparErro() {
  erroEl.textContent = "";
  document.querySelectorAll(".invalido").forEach((el) => el.classList.remove("invalido"));
}

// ---------- Criar os campos de notas conforme o número de provas ----------
function criarCampos() {
  const total = parseInt(qtdEl.value, 10);

  if (!Number.isInteger(total) || total < 1 || total > MAX_PROVAS) {
    notasBox.hidden = true;
    btnCalcular.hidden = true;
    return;
  }

  // guarda o que já foi escrito para não perder ao mudar o número de provas
  const antigos = [...campos.querySelectorAll("input")].map((i) => i.value);
  campos.innerHTML = "";

  for (let i = 0; i < total; i++) {
    const label = document.createElement("label");
    label.className = "nota";

    const texto = document.createElement("span");
    texto.textContent = `Prova ${i + 1}`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = NOTA_MAXIMA;
    input.step = "0.1";
    input.inputMode = "decimal";
    input.placeholder = "0 a 20";
    input.value = antigos[i] ?? "";

    label.append(texto, input);
    campos.append(label);
  }

  notasBox.hidden = false;
  btnCalcular.hidden = false;
}

// ---------- Validação ----------
function validar() {
  limparErro();

  const nome = nomeEl.value.trim();
  if (nome.length < 2) {
    mostrarErro("Escreve o nome do aluno.", nomeEl);
    return null;
  }

  const total = parseInt(qtdEl.value, 10);
  if (!Number.isInteger(total) || total < 1 || total > MAX_PROVAS) {
    mostrarErro(`Indica entre 1 e ${MAX_PROVAS} provas.`, qtdEl);
    return null;
  }

  const inputs = [...campos.querySelectorAll("input")];
  const notas = [];

  for (let i = 0; i < inputs.length; i++) {
    const valor = parseFloat(inputs[i].value);
    if (Number.isNaN(valor) || valor < 0 || valor > NOTA_MAXIMA) {
      mostrarErro(`A nota da prova ${i + 1} deve estar entre 0 e ${NOTA_MAXIMA}.`, inputs[i]);
      return null;
    }
    notas.push(valor);
  }

  return { nome, notas };
}

// ---------- Animação do número ----------
function animarNumero(destino) {
  if (reduzirMovimento) {
    mediaEl.textContent = formatar(destino);
    return;
  }
  const duracao = 800;
  const inicio = performance.now();

  function passo(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const suave = 1 - Math.pow(1 - progresso, 3);
    mediaEl.textContent = formatar(destino * suave);
    if (progresso < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

// ---------- Mostrar o resultado ----------
function mostrarResultado({ nome, notas }) {
  const soma = notas.reduce((acc, n) => acc + n, 0);
  const media = soma / notas.length;
  const aprovado = media >= NOTA_APROVACAO;

  vazio.hidden = true;
  conteudo.hidden = false;

  // carimbo (reinicia a animação a cada cálculo)
  carimbo.textContent = aprovado ? "Aprovado" : "Reprovado";
  carimbo.className = `carimbo ${aprovado ? "aprovado" : "reprovado"}`;
  void carimbo.offsetWidth;
  carimbo.classList.add("bater");

  // número e barra
  animarNumero(media);
  barra.style.background = aprovado ? "var(--verde)" : "var(--vermelho)";
  barra.style.width = "0%";
  requestAnimationFrame(() => {
    barra.style.width = `${(media / NOTA_MAXIMA) * 100}%`;
  });

  // mensagem com o nome vindo do input (textContent evita código malicioso)
  const forte = document.createElement("strong");
  forte.textContent = nome;
  let final = aprovado ? " e aprovou." : " e reprovou.";
  if (!aprovado) {
    final += ` Faltaram ${formatar(NOTA_APROVACAO - media)} valores para chegar aos ${NOTA_APROVACAO}.`;
  }
  mensagemEl.replaceChildren(
    "O aluno ",
    forte,
    ` teve ${formatar(media)} valores, ${classificar(media)}${final}`
  );

  // estatísticas
  $("#soma").textContent = formatar(soma);
  $("#total").textContent = notas.length;
  $("#maior").textContent = formatar(Math.max(...notas));
  $("#menor").textContent = formatar(Math.min(...notas));

  adicionarAoHistorico(nome, media, aprovado);
}

// ---------- Histórico ----------
function adicionarAoHistorico(nome, media, aprovado) {
  historico.unshift({ nome, media, aprovado });
  historicoBox.hidden = false;
  lista.replaceChildren();

  historico.forEach((item) => {
    const li = document.createElement("li");

    const quem = document.createElement("span");
    quem.textContent = `${item.nome}: ${formatar(item.media)} valores`;

    const estado = document.createElement("span");
    estado.className = `estado ${item.aprovado ? "ok" : "nao"}`;
    estado.textContent = item.aprovado ? "Aprovado" : "Reprovado";

    li.append(quem, estado);
    lista.append(li);
  });
}

// ---------- Eventos ----------
qtdEl.addEventListener("input", criarCampos);
form.addEventListener("input", (e) => e.target.classList.remove("invalido"));

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const dados = validar();
  if (dados) mostrarResultado(dados);
});

btnLimpar.addEventListener("click", () => {
  form.reset();
  campos.innerHTML = "";
  notasBox.hidden = true;
  btnCalcular.hidden = true;
  limparErro();
  conteudo.hidden = true;
  vazio.hidden = false;
  nomeEl.focus();
});
