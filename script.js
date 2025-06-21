document.addEventListener("DOMContentLoaded", () => {
    let cardapio = [];
    let carrinho = {};

    fetch("db.json")
      .then(res => res.json())
      .then(data => {
        cardapio = data.filter(item => item.estoque > 0);
        
        cardapio.forEach(item => {
          carrinho[item.id] = 0;
        });
        
        montarCardapio();
      });

    function montarCardapio() {
      const grandesContainer = document.getElementById("cardapio-grande");
      const centosContainer = document.getElementById("cardapio-cento");
      grandesContainer.innerHTML = "";
      centosContainer.innerHTML = "";

      const salgadosGrandes = cardapio.filter(item => item.tipo === 'grande');
      const salgadosCento = cardapio.filter(item => item.tipo === 'mini' || item.tipo === 'cento_misto');

      salgadosGrandes.forEach(item => {
        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML = `
          <div class="item-info">
            <h3>${item.nome}</h3>
            <div class="preco">R$${item.preco_unitario.toFixed(2)} cada</div>
          </div>
          <div class="controles">
            <button onclick="alterarQuantidade(${item.id}, -1)" id="menos-${item.id}">-</button>
            <div class="quantidade" id="qtd-${item.id}">0</div>
            <button onclick="alterarQuantidade(${item.id}, 1)" id="mais-${item.id}">+</button>
          </div>
        `;
        grandesContainer.appendChild(el);
      });

      salgadosCento.forEach(item => {
        const el = document.createElement("div");
        el.className = "item";
        const avisoEncomenda = `<div class="encomenda-info">Acima de 2 centos, favor encomendar via WhatsApp.</div>`;

        if (item.tipo === 'mini') {
            const maxCentos = Math.floor(item.estoque / 100);
            if (maxCentos < 1) return; // Não mostra se não tem estoque para pelo menos 1 cento

            el.innerHTML = `
              <div class="item-info">
                <h3>${item.nome}</h3>
                <div class="preco">R$${item.preco_cento.toFixed(2)} o cento</div>
                <div class="stock-info">Estoque para ${maxCentos} cento(s)</div>
                ${avisoEncomenda}
              </div>
              <div class="controles">
                <button onclick="alterarQuantidadeCento(${item.id}, -1)" id="menos-cento-${item.id}">-</button>
                <div class="quantidade" id="qtd-cento-${item.id}">0</div>
                <button onclick="alterarQuantidadeCento(${item.id}, 1)" id="mais-cento-${item.id}">+</button>
              </div>
            `;
        } else if (item.tipo === 'cento_misto') {
             el.innerHTML = `
              <div class="item-info">
                <h3>${item.nome}</h3>
                <div class="preco">R$${item.preco_unitario.toFixed(2)} o cento</div>
                <div class="stock-info">Disponível: ${item.estoque} cento(s)</div>
                ${avisoEncomenda}
              </div>
              <div class="controles">
                <button onclick="alterarQuantidade(${item.id}, -1)" id="menos-${item.id}">-</button>
                <div class="quantidade" id="qtd-${item.id}">0</div>
                <button onclick="alterarQuantidade(${item.id}, 1)" id="mais-${item.id}">+</button>
              </div>
            `;
        }
        centosContainer.appendChild(el);
      });

      atualizarBotoes();
    }

    window.alterarQuantidade = function(id, delta) {
      const item = cardapio.find(i => i.id === id);
      if (!item) return;

      let novaQtd = carrinho[id] + delta;
      if (novaQtd < 0) novaQtd = 0;
      
      const limite = item.tipo === 'cento_misto' ? item.estoque : Math.min(item.limite, item.estoque);
      if (novaQtd > limite) novaQtd = limite;

      carrinho[id] = novaQtd;
      document.getElementById(`qtd-${id}`).innerText = novaQtd;

      atualizarBotoes();
      atualizarTotal();
    };

    window.alterarQuantidadeCento = function(id, delta) {
        const item = cardapio.find(i => i.id === id);
        if (!item) return;

        const maxCentos = Math.floor(item.estoque / 100);
        const currentCentos = carrinho[id] / 100;
        
        let novosCentos = currentCentos + delta;
        if (novosCentos < 0) novosCentos = 0;
        if (novosCentos > maxCentos) novosCentos = maxCentos;

        carrinho[id] = novosCentos * 100;
        document.getElementById(`qtd-cento-${id}`).innerText = novosCentos;

        atualizarBotoes();
        atualizarTotal();
    };

    function atualizarBotoes() {
      cardapio.forEach(item => {
        const qtd = carrinho[item.id];
        
        if (item.tipo === 'grande' || item.tipo === 'cento_misto') {
            const menosBtn = document.getElementById(`menos-${item.id}`);
            const maisBtn = document.getElementById(`mais-${item.id}`);
            if(menosBtn) menosBtn.disabled = qtd <= 0;
            const limite = item.tipo === 'cento_misto' ? item.estoque : Math.min(item.limite, item.estoque);
            if(maisBtn) maisBtn.disabled = qtd >= limite;
        } else if (item.tipo === 'mini') {
            const maxCentos = Math.floor(item.estoque / 100);
            if (maxCentos < 1) return;
            
            const currentCentos = qtd / 100;
            const menosBtn = document.getElementById(`menos-cento-${item.id}`);
            const maisBtn = document.getElementById(`mais-cento-${item.id}`);
            if(menosBtn) menosBtn.disabled = currentCentos <= 0;
            if(maisBtn) maisBtn.disabled = currentCentos >= maxCentos;
        }
      });
    }

    function atualizarTotal() {
      let total = 0;
      for (const id in carrinho) {
        const item = cardapio.find(i => i.id == id);
        if(item) {
            if (item.tipo === 'mini' && carrinho[id] > 0) {
                const numCentos = carrinho[id] / 100;
                total += numCentos * item.preco_cento;
            } else {
                total += carrinho[id] * item.preco_unitario;
            }
        }
      }
      document.getElementById("total").innerText = total.toFixed(2);
    }

    document.getElementById("finalizar").addEventListener("click", () => {
      let mensagem = "🧾 *Pedido de Salgados:*\n\n";
      let total = 0;
      let temPedido = false;

      for (const id in carrinho) {
        const qtd = carrinho[id];
        if (qtd > 0) {
          const item = cardapio.find(i => i.id == id);
          temPedido = true;

          if (item.tipo === 'mini') {
              const numCentos = qtd / 100;
              const subtotal = numCentos * item.preco_cento;
              mensagem += `• ${item.nome}: ${numCentos} cento(s) (R$${subtotal.toFixed(2)})\n`;
              total += subtotal;
          } else if (item.tipo === 'cento_misto') {
              const subtotal = item.preco_unitario * qtd;
              mensagem += `• ${item.nome}: ${qtd} cento(s) (R$${subtotal.toFixed(2)})\n`;
              total += subtotal;
          } else {
              const subtotal = item.preco_unitario * qtd;
              mensagem += `• ${item.nome}: ${qtd} un (R$${subtotal.toFixed(2)})\n`;
              total += subtotal;
          }
        }
      }

      if (!temPedido) {
        alert("Você não adicionou nenhum item ao pedido.");
        return;
      }

      mensagem += `\n💰 *Total: R$${total.toFixed(2)}*`;
      mensagem += `\n\n🔑 *PIX:* [Favor informar sua chave PIX na conversa]`;

      const numero = "5521979744099"; // Número de WhatsApp para receber o pedido
      const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, "_blank");
    });
});