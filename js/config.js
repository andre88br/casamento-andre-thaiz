/* =========================================================
   CONFIGURAÇÃO DO SITE — edite aqui os dados reais
   (tudo marcado com "INVENTADO" é provisório)
   ========================================================= */
window.CONFIG = {
  noivos: { ele: "André", ela: "Thaiz" },

  // Data/hora da cerimônia (fuso de Brasília)
  dataCasamento: "2027-05-01T16:00:00-03:00",
  prazoRSVP: "2027-03-01",

  cerimonia: {
    titulo: "Cerimônia",
    horario: "16:00",
    local: "Local a definir", // INVENTADO
    endereco: "Uberlândia — MG",
    mapsQuery: "Uberlândia, MG",
  },
  festa: {
    titulo: "Festa",
    horario: "18:00",
    local: "Local a definir", // INVENTADO
    endereco: "Uberlândia — MG",
    mapsQuery: "Uberlândia, MG",
  },

  // URL do Web App do Google Apps Script (veja README.md).
  // Enquanto estiver vazio, o site funciona em "modo demonstração"
  // e salva tudo apenas no navegador.
  googleScriptUrl: "",

  pix: {
    chave: "andreethaiz@exemplo.com", // INVENTADO
    nome: "ANDRE E THAIZ",            // máx. 25 caracteres, sem acento
    cidade: "UBERLANDIA",             // máx. 15 caracteres, sem acento
  },
  // Link genérico de pagamento (Mercado Pago, PagSeguro, Stripe…)
  linkPagamento: "https://link.mercadopago.com.br/andreethaiz", // INVENTADO

  // Números da "ficha técnica" — INVENTADOS
  estatisticas: [
    { valor: 312, sufixo: "", label: "Pints de Guinness em Dublin" },
    { valor: 14, sufixo: "", label: "Países visitados juntos" },
    { valor: 87, sufixo: "", label: "Jogos assistidos lado a lado" },
    { valor: 2, sufixo: " anos", label: "Morando na Irlanda" },
  ],

  // Linha do tempo — INVENTADA
  historia: [
    {
      ano: "2022",
      titulo: "Cada um com sua mala",
      texto:
        "Ele saiu de Porto Alegre, ela de Minas Gerais. Dois intercambistas desembarcando em Dublin sem imaginar que o destino já tinha marcado esse encontro.",
      carimbo: "DUB",
      cidade: "Dublin",
    },
    {
      ano: "2022",
      titulo: "O primeiro encontro",
      texto:
        "No intercâmbio, entre aulas de inglês e pints em Temple Bar, um colorado e uma atleticana se esbarraram. Do “where are you from?” ao “você também é brasileira?!” foi um piscar de olhos.",
      carimbo: "TBR",
      cidade: "Temple Bar",
      imagem: "assets/img/pub.jpg",
    },
    {
      ano: "2023",
      titulo: "Inter x Galo de madrugada",
      texto:
        "Assistir jogo do Brasileirão com cinco horas de fuso, ela de preto e branco, ele de vermelho, no mesmo sofá. Nasceu ali a regra de ouro da casa: quem perde lava a louça.",
      carimbo: "IRL",
      cidade: "Dublin",
    },
    {
      ano: "2023",
      titulo: "Mochilão pela Europa",
      texto:
        "Paris, Lisboa, Edimburgo, Amsterdã… 14 países e uma certeza: o melhor destino é sempre aquele em que estamos juntos.",
      carimbo: "CDG",
      cidade: "Paris",
      imagem: "assets/img/paris.jpg",
    },
    {
      ano: "2024",
      titulo: "O pedido em Howth",
      texto:
        "No alto das falésias, com o farol ao fundo e o vento bagunçando tudo, veio o “sim” mais bonito do mundo.",
      carimbo: "HTH",
      cidade: "Howth",
      imagem: "assets/img/proposal.jpg",
    },
    {
      ano: "2027",
      titulo: "A grande final",
      texto:
        "De volta ao Brasil, agora em Uberlândia, para o jogo mais importante das nossas vidas. E você está convocado!",
      carimbo: "UDI",
      cidade: "Uberlândia",
    },
  ],

  galeria: [
    { src: "assets/img/hero.jpg", alt: "Passeio pela Ha'penny Bridge, em Dublin", classe: "wide" },
    { src: "assets/img/cliffs.jpg", alt: "Nas Cliffs of Moher", classe: "tall" },
    { src: "assets/img/pub.jpg", alt: "Brinde num pub de Temple Bar" },
    { src: "assets/img/proposal.jpg", alt: "O pedido em Howth", classe: "tall" },
    { src: "assets/img/paris.jpg", alt: "Selfie em Paris" },
    { src: "assets/img/stadium.jpg", alt: "Nosso estádio dos sonhos", classe: "wide" },
    { src: "assets/img/flatlay.jpg", alt: "Passaporte, cartões de embarque e uma bola" },
  ],

  luaDeMel: "Grécia", // INVENTADO

  // Presentes — INVENTADOS. "cotas" = quantas pessoas podem dar esse presente.
  presentes: [
    // ---- Lua de mel & experiências
    { id: "guinness", cat: "lua", icone: "🍺", nome: "Um pint de Guinness em Temple Bar", desc: "Para matar a saudade de Dublin com um brinde em sua homenagem.", valor: 60, cotas: 20, vendidas: 7 },
    { id: "passagem", cat: "lua", icone: "✈️", nome: "Cota da passagem para a Grécia", desc: "Cada cota nos deixa um pouquinho mais perto de Santorini.", valor: 500, cotas: 12, vendidas: 4 },
    { id: "hotel", cat: "lua", icone: "🏨", nome: "Diária com vista para o Egeu", desc: "Uma noite num hotelzinho branco e azul em Oia.", valor: 650, cotas: 6, vendidas: 1 },
    { id: "barco", cat: "lua", icone: "⛵", nome: "Passeio de barco ao pôr do sol", desc: "Catamarã pela caldeira de Santorini, com direito a mergulho.", valor: 420, cotas: 2, vendidas: 0 },
    { id: "jantar", cat: "lua", icone: "🍷", nome: "Jantar romântico em Oia", desc: "Frutos do mar, vinho local e o pôr do sol mais famoso do mundo.", valor: 320, cotas: 3, vendidas: 1 },
    { id: "upgrade", cat: "lua", icone: "💺", nome: "Upgrade de assento no voo", desc: "Para os noivos chegarem descansados (e sem dor nas costas).", valor: 900, cotas: 2, vendidas: 0 },
    { id: "quadri", cat: "lua", icone: "🛵", nome: "Aluguel de quadriciclo na ilha", desc: "Explorar as praias escondidas com o vento no rosto.", valor: 220, cotas: 2, vendidas: 0 },
    // ---- Casa
    { id: "airfryer", cat: "casa", icone: "🍟", nome: "Air fryer", desc: "Para o pão de queijo sair sempre no ponto.", valor: 450, cotas: 1, vendidas: 0 },
    { id: "panelas", cat: "casa", icone: "🍳", nome: "Jogo de panelas", desc: "Porque agora a cozinha é de dois.", valor: 890, cotas: 1, vendidas: 0 },
    { id: "cafeteira", cat: "casa", icone: "☕", nome: "Cafeteira espresso", desc: "Combustível oficial das manhãs de domingo.", valor: 1200, cotas: 2, vendidas: 1 },
    { id: "tv", cat: "casa", icone: "📺", nome: "Smart TV para os jogos", desc: "Para assistir Inter e Galo em tela grande — de preferência não no mesmo horário.", valor: 600, cotas: 5, vendidas: 2 },
    { id: "cama", cat: "casa", icone: "🛏️", nome: "Jogo de cama king", desc: "Lençóis macios para depois da festa.", valor: 380, cotas: 1, vendidas: 0 },
    { id: "churrasco", cat: "casa", icone: "🥩", nome: "Kit churrasco gaúcho", desc: "Espeto, tábua e faca. O noivo agradece, bah!", valor: 320, cotas: 1, vendidas: 0 },
    { id: "queijo", cat: "casa", icone: "🧀", nome: "Kit queijo canastra & cachaça", desc: "Um pedacinho de Minas na nossa mesa, sô.", valor: 250, cotas: 1, vendidas: 0 },
    // ---- Resenha (os divertidos)
    { id: "camisa-galo", cat: "resenha", icone: "⚫", nome: "Noivo veste a camisa do Galo por 1 dia", desc: "Ele jura que não vai acontecer. Você pode mudar isso.", valor: 1000, cotas: 1, vendidas: 0 },
    { id: "hino-inter", cat: "resenha", icone: "🔴", nome: "Noiva canta o hino do Inter na festa", desc: "Com microfone, coreografia e vídeo garantido.", valor: 1000, cotas: 1, vendidas: 0 },
    { id: "var", cat: "resenha", icone: "📹", nome: "Contratar o VAR para as discussões do casal", desc: "Para revisar quem estava certo. (Spoiler: ela.)", valor: 150, cotas: 10, vendidas: 3 },
    { id: "neutro", cat: "resenha", icone: "🏳️", nome: "Ingresso para um clássico neutro", desc: "Um jogo em que os dois torçam para o mesmo lado. Raridade.", valor: 200, cotas: 4, vendidas: 1 },
    { id: "ressaca", cat: "resenha", icone: "💊", nome: "Kit ressaca pós-festa", desc: "Engov, água de coco e um Full Irish Breakfast.", valor: 90, cotas: 10, vendidas: 2 },
  ],

  // Recados de exemplo exibidos no modo demonstração — INVENTADOS
  recadosExemplo: [
    { nome: "Patrick O'Brien", time: "neutro", mensagem: "Congratulations! Dublin misses you both. Sláinte! 🍀", data: "2026-10-02" },
    { nome: "Tia Cida", time: "galo", mensagem: "Thaiz, minha querida, que Deus abençoe essa união. E André, ainda dá tempo de virar Galo! 🐓", data: "2026-10-10" },
    { nome: "Rafa", time: "inter", mensagem: "Parceiro, casar com atleticana é a maior prova de amor da história do futebol. Orgulho! ❤️", data: "2026-10-15" },
  ],
};
