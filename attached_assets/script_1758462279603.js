// Envio de formulário
document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();
  alert("Mensagem enviada com sucesso! 🚀");
});

// Quando a página carregar
window.addEventListener("load", () => {
  // Cria o mapa
  const map = L.map('map').setView([-23.5505, -46.6333], 13); // São Paulo

  // Mapa base
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Estacionamentos simulados
  const estacionamentos = [
    {
      nome: "Estacionamento Central",
      lat: -23.5505,
      lng: -46.6333,
      vagas: 5,
      descricao: "Próximo à Av. Paulista. Vagas cobertas e seguras."
    },
    {
      nome: "Estacionamento Shopping Luz",
      lat: -23.5450,
      lng: -46.6380,
      vagas: 2,
      descricao: "Dentro do Shopping Luz. Vagas limitadas."
    }
  ];

  // Adiciona marcadores
  estacionamentos.forEach(est => {
    const marker = L.marker([est.lat, est.lng]).addTo(map);
    marker.bindPopup(`<strong>${est.nome}</strong><br/>Vagas disponíveis: ${est.vagas}`);

    marker.on('click', () => {
      document.getElementById('info-estacionamento').style.display = 'block';
      document.getElementById('nome-estacionamento').textContent = est.nome;
      document.getElementById('detalhes-estacionamento').textContent = `${est.descricao} Vagas disponíveis: ${est.vagas}`;
      document.getElementById('reservar-btn').style.display = est.vagas > 0 ? 'inline-block' : 'none';
      
      document.getElementById('reservar-btn').onclick = () => {
        if (est.vagas > 0) {
          alert(`Vaga reservada em ${est.nome}!`);
          est.vagas--;
          marker.setPopupContent(`<strong>${est.nome}</strong><br/>Vagas disponíveis: ${est.vagas}`);
          document.getElementById('reservar-btn').style.display = est.vagas > 0 ? 'inline-block' : 'none';
          document.getElementById('detalhes-estacionamento').textContent = `${est.descricao} Vagas disponíveis: ${est.vagas}`;
        } else {
          alert("Não há vagas disponíveis!");
        }
      };
    });
  });
});
