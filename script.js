document.addEventListener("DOMContentLoaded", () => {
    let cardapio = [];
    let carrinho = {};

    fetch("db.json")
      .then(res => res.json())
      .then(data => {
        cardapio = data.filter(item => item.estoque > 0);
        
        cardapio.forEach(item => {
          carrinho[item.id] = 0; // Initialize base quantities
        });
        
        montarCardapio();
      });

    function montarCardapio() {
      const unidadeContainer = document.getElementById("cardapio-unidade");
      const pacoteContainer = document.getElementById("cardapio-pacote");
      unidadeContainer.innerHTML = "";
      pacoteContainer.innerHTML = "";

      const salgadosUnidade = cardapio.filter(item => item.tipo === 'grande' || item.tipo === 'mini');
      const salgadosPacote = cardapio.filter(item => item.tipo === 'mini' || item.tipo === 'cento_misto');

      salgadosUnidade.forEach(item => {
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
        unidadeContainer.appendChild(el);
      });

      salgadosPacote.forEach(item => {
        const avisoEncomenda = `<div class="encomenda-info">Acima de 2 pacotes, favor encomendar via WhatsApp.</div>`;
        const avisoEncomendaCento = `<div class="encomenda-info">Acima de 2 centos, favor encomendar via WhatsApp.</div>`;
        
        if (item.tipo === 'mini') {
            // As per user's latest instruction: "Mini Pizza (Pacote c/ 10) 1.50×10" and "Empadinha (Pacote c/ 10) 1.50×10"
            const precoDezena = 15.00; 
            
            // Card para Pacote com 10 unidades
            const elDezena = document.createElement("div");
            elDezena.className = "item";
            elDezena.innerHTML = `
              <div class="item-info">
                <h3>${item.nome} (Pacote c/ 10)</h3>
                <div class="preco">R$${precoDezena.toFixed(2)} o pacote</div>
                 ${avisoEncomenda}
              </div>
              <div class="controles">
                <button onclick="alterarQuantidadeDezena(${item.id}, -1)" id="menos-dezena-${item.id}">-</button>
                <div class="quantidade" id="qtd-dezena-${item.id}">0</div>
                <button onclick="alterarQuantidadeDezena(${item.id}, 1)" id="mais-dezena-${item.id}">+</button>
              </div>
            `;
            pacoteContainer.appendChild(elDezena);

            // Card para Cento
            const elCento = document.createElement("div");
            elCento.className = "item";
            elCento.innerHTML = `
              <div class="item-info">
                <h3>${item.nome} (cento)</h3>
                <div class="preco">R$${item.preco_cento.toFixed(2)} o cento</div>
                ${avisoEncomendaCento}
              </div>
              <div class="controles">
                <button onclick="alterarQuantidadeCento(${item.id}, -1)" id="menos-cento-${item.id}">-</button>
                <div class="quantidade" id="qtd-cento-${item.id}">0</div>
                <button onclick="alterarQuantidadeCento(${item.id}, 1)" id="mais-cento-${item.id}">+</button>
              </div>
            `;
            pacoteContainer.appendChild(elCento);
            
        } else if (item.tipo === 'cento_misto') {
             // Card for Cento de Salgado Misto
             const elCento = document.createElement("div");
             elCento.className = "item";
             elCento.innerHTML = `
              <div class="item-info">
                <h3>${item.nome}</h3>
                <div class="preco">R$${item.preco_unitario.toFixed(2)} o cento</div>
                ${avisoEncomendaCento}
              </div>
              <div class="controles">
                <button onclick="alterarQuantidade(${item.id}, -1, true)" id="menos-${item.id}-misto">-</button>
                <div class="quantidade" id="qtd-${item.id}-misto">0</div>
                <button onclick="alterarQuantidade(${item.id}, 1, true)" id="mais-${item.id}-misto">+</button>
              </div>
            `;
            pacoteContainer.appendChild(elCento);

            // NEW: Card for Pacote com 10 de Salgado Misto
            const precoDezenaMisto = 7.00; // 10 * 0.70 as per prompt
            const elDezenaMisto = document.createElement("div");
            elDezenaMisto.className = "item";
            elDezenaMisto.innerHTML = `
              <div class="item-info">
                <h3>${item.nome} (Pacote c/ 10)</h3>
                <div class="preco">R$${precoDezenaMisto.toFixed(2)} o pacote</div>
                ${avisoEncomenda}
              </div>
              <div class="controles">
                <button onclick="alterarQuantidadeDezenaMisto(${item.id}, -1)" id="menos-dezena-misto-${item.id}">-</button>
                <div class="quantidade" id="qtd-dezena-misto-${item.id}">0</div>
                <button onclick="alterarQuantidadeDezenaMisto(${item.id}, 1)" id="mais-dezena-misto-${item.id}">+</button>
              </div>
            `;
            pacoteContainer.appendChild(elDezenaMisto);
        }
      });

      atualizarBotoes();
    }

    window.alterarQuantidade = function(id, delta, isMisto = false) {
      const item = cardapio.find(i => i.id === id);
      if (!item) return;
      
      const cartKey = isMisto ? `${id}_misto` : `${id}_unidade`;
      if (carrinho[cartKey] === undefined) carrinho[cartKey] = 0;

      let novaQtd = carrinho[cartKey] + delta;
      if (novaQtd < 0) novaQtd = 0;
      
      // For 'cento_misto' (isMisto = true), use item.limite as the hard limit (e.g., 10 centos)
      // For 'unidade' items, continue to use Math.min(item.limite, item.estoque)
      const limite = isMisto ? item.limite : Math.min(item.limite, item.estoque);
      if (novaQtd > limite) novaQtd = limite;

      carrinho[cartKey] = novaQtd;
      const qtdElId = isMisto ? `qtd-${id}-misto` : `qtd-${id}`;
      document.getElementById(qtdElId).innerText = novaQtd;

      atualizarBotoes();
      atualizarTotal();
    };

    window.alterarQuantidadeDezena = function(id, delta) {
        const item = cardapio.find(i => i.id === id);
        if (!item) return;

        const cartKey = `${id}_dezena`; // For mini items
        if(carrinho[cartKey] === undefined) carrinho[cartKey] = 0;
        
        let novasDezenas = carrinho[cartKey] + delta;
        if (novasDezenas < 0) novasDezenas = 0;
        // Arbitrary high limit for packages of 10, as stock is removed
        if (novasDezenas > 99) novasDezenas = 99;

        carrinho[cartKey] = novasDezenas;
        document.getElementById(`qtd-dezena-${id}`).innerText = novasDezenas;

        atualizarBotoes();
        atualizarTotal();
    };

    window.alterarQuantidadeDezenaMisto = function(id, delta) {
        const item = cardapio.find(i => i.id === id); // This should be the cento_misto item
        if (!item) return;

        const cartKey = `${id}_dezena_misto`; // For cento_misto items 10-pack
        if(carrinho[cartKey] === undefined) carrinho[cartKey] = 0;

        let novasDezenas = carrinho[cartKey] + delta;
        if (novasDezenas < 0) novasDezenas = 0;
        // Limit based on item.limite (10 centos) converted to dezenas (10 * 10 = 100 dezenas)
        if (novasDezenas > (item.limite * 10)) novasDezenas = (item.limite * 10);

        carrinho[cartKey] = novasDezenas;
        document.getElementById(`qtd-dezena-misto-${id}`).innerText = novasDezenas;

        atualizarBotoes();
        atualizarTotal();
    };

    window.alterarQuantidadeCento = function(id, delta) {
        const item = cardapio.find(i => i.id === id);
        if (!item) return;

        const cartKey = `${id}_cento`;
        if(carrinho[cartKey] === undefined) carrinho[cartKey] = 0;
        
        let novosCentos = carrinho[cartKey] + delta;
        if (novosCentos < 0) novosCentos = 0;
        // Arbitrary high limit for centos, as stock is removed
        if (novosCentos > 99) novosCentos = 99;

        carrinho[cartKey] = novosCentos;
        document.getElementById(`qtd-cento-${id}`).innerText = novosCentos;

        atualizarBotoes();
        atualizarTotal();
    };

    function atualizarBotoes() {
      cardapio.forEach(item => {
        if (item.tipo === 'grande' || item.tipo === 'mini') {
            const cartKeyUnidade = `${item.id}_unidade`;
            const qtdUnidade = carrinho[cartKeyUnidade] || 0;
            const menosBtnUnidade = document.getElementById(`menos-${item.id}`);
            const maisBtnUnidade = document.getElementById(`mais-${item.id}`);
            if (menosBtnUnidade) menosBtnUnidade.disabled = qtdUnidade <= 0;
            if (maisBtnUnidade) maisBtnUnidade.disabled = qtdUnidade >= Math.min(item.limite, item.estoque);
        }
        
        if (item.tipo === 'cento_misto') {
            const cartKeyMistoCento = `${item.id}_misto`; // For cento (mixed)
            const qtdMistoCento = carrinho[cartKeyMistoCento] || 0;
            const menosBtnMistoCento = document.getElementById(`menos-${item.id}-misto`);
            const maisBtnMistoCento = document.getElementById(`mais-${item.id}-misto`);
            if(menosBtnMistoCento) menosBtnMistoCento.disabled = qtdMistoCento <= 0;
            // Limit cento_misto by its item.limite (e.g., 10 centos)
            if(maisBtnMistoCento) maisBtnMistoCento.disabled = qtdMistoCento >= item.limite;
            
            // NEW: Dezena buttons for cento_misto
            const cartKeyDezenaMisto = `${item.id}_dezena_misto`;
            const currentDezenasMisto = carrinho[cartKeyDezenaMisto] || 0;
            const dezenaMistoLimit = item.limite * 10; // Limit by item.limite (10 centos) * 10 dezenas = 100 dezenas
            if (dezenaMistoLimit >= 1) { // Check if it's logically possible to order at least one pack
                const menosBtnDezenaMisto = document.getElementById(`menos-dezena-misto-${item.id}`);
                const maisBtnDezenaMisto = document.getElementById(`mais-dezena-misto-${item.id}`);
                if (menosBtnDezenaMisto) menosBtnDezenaMisto.disabled = currentDezenasMisto <= 0;
                if (maisBtnDezenaMisto) maisBtnDezenaMisto.disabled = currentDezenasMisto >= dezenaMistoLimit;
            }
        } 
        
        if (item.tipo === 'mini') {
            // Botões do pacote de 10
            const cartKeyDezena = `${item.id}_dezena`;
            const currentDezenas = carrinho[cartKeyDezena] || 0;
            // No stock limit, use an arbitrary high limit
            const dezenaLimit = 99; 
            const menosBtnDezena = document.getElementById(`menos-dezena-${item.id}`);
            const maisBtnDezena = document.getElementById(`mais-dezena-${item.id}`);
            if(menosBtnDezena) menosBtnDezena.disabled = currentDezenas <= 0;
            if(maisBtnDezena) maisBtnDezena.disabled = currentDezenas >= dezenaLimit;

            // Botões do cento
            const cartKeyCento = `${item.id}_cento`;
            const currentCentos = carrinho[cartKeyCento] || 0;
            // No stock limit, use an arbitrary high limit
            const centoLimit = 99;
            const menosBtnCento = document.getElementById(`menos-cento-${item.id}`);
            const maisBtnCento = document.getElementById(`mais-cento-${item.id}`);
            if(menosBtnCento) menosBtnCento.disabled = currentCentos <= 0;
            if(maisBtnCento) maisBtnCento.disabled = currentCentos >= centoLimit;
        }
      });
    }

    function atualizarTotal() {
      let total = 0;
      for (const cartKey in carrinho) {
        const qtd = carrinho[cartKey];
        if (qtd <= 0) continue;

        const [id, type] = cartKey.split('_');
        const item = cardapio.find(i => i.id == id);
        if(item) {
            if (type === 'cento') {
                total += qtd * item.preco_cento;
            } else if (type === 'dezena') { // For mini items 10-pack
                total += qtd * 15.00; // Updated price for mini 10-pack (1.50 * 10)
            } else if (type === 'dezena_misto') { // For cento_misto 10-pack
                total += qtd * 7.00;
            } else if (type === 'misto') { // For cento_misto cento
                total += qtd * item.preco_unitario; // preco_unitario for cento_misto is the cento price
            } else if (type === 'unidade') {
                total += qtd * item.preco_unitario;
            }
        }
      }
      document.getElementById("total").innerText = total.toFixed(2);
    }

    document.getElementById("finalizar").addEventListener("click", () => {
      let mensagem = "🧾 *Pedido de Salgados:*\n\n";
      let total = 0;
      let temPedido = false;

      for (const cartKey in carrinho) {
        const qtd = carrinho[cartKey];
        if (qtd > 0) {
          const [id, type] = cartKey.split('_');
          const item = cardapio.find(i => i.id == id);
          temPedido = true;

          if (type === 'cento') {
              const subtotal = qtd * item.preco_cento;
              mensagem += `• ${item.nome} (cento): ${qtd} cento(s) (R$${subtotal.toFixed(2)})\n`;
              total += subtotal;
          } else if (type === 'dezena') { // For mini items 10-pack
              const subtotal = qtd * 15.00; // Updated price for mini 10-pack (1.50 * 10)
              mensagem += `• ${item.nome} (pacote c/ 10): ${qtd} pacote(s) (R$${subtotal.toFixed(2)})\n`;
              total += subtotal;
          } else if (type === 'dezena_misto') { // For cento_misto 10-pack
              const subtotal = qtd * 7.00;
              mensagem += `• ${item.nome} (pacote c/ 10): ${qtd} pacote(s) (R$${subtotal.toFixed(2)})\n`;
              total += subtotal;
          } else if (type === 'misto') { // For cento_misto cento
              const subtotal = item.preco_unitario * qtd;
              mensagem += `• ${item.nome}: ${qtd} cento(s) (R$${subtotal.toFixed(2)})\n`;
              total += subtotal;
          } else if (type === 'unidade') {
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