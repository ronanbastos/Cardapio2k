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
            const precoDezena = item.preco_unitario * 10;
            
            // Card para Pacote com 10 unidades
            const maxDezenas = Math.floor(item.estoque / 10);
            if (maxDezenas >= 1) {
                const elDezena = document.createElement("div");
                elDezena.className = "item";
                elDezena.innerHTML = `
                  <div class="item-info">
                    <h3>${item.nome} (Pacote c/ 10)</h3>
                    <div class="preco">R$${precoDezena.toFixed(2)} o pacote</div>
                    <div class="stock-info">Estoque para ${maxDezenas} pacote(s)</div>
                     ${avisoEncomenda}
                  </div>
                  <div class="controles">
                    <button onclick="alterarQuantidadeDezena(${item.id}, -1)" id="menos-dezena-${item.id}">-</button>
                    <div class="quantidade" id="qtd-dezena-${item.id}">0</div>
                    <button onclick="alterarQuantidadeDezena(${item.id}, 1)" id="mais-dezena-${item.id}">+</button>
                  </div>
                `;
                pacoteContainer.appendChild(elDezena);
            }

            // Card para Cento
            const maxCentos = Math.floor(item.estoque / 100);
            if (maxCentos >= 1) {
                const elCento = document.createElement("div");
                elCento.className = "item";
                elCento.innerHTML = `
                  <div class="item-info">
                    <h3>${item.nome} (cento)</h3>
                    <div class="preco">R$${item.preco_cento.toFixed(2)} o cento</div>
                    <div class="stock-info">Estoque para ${maxCentos} cento(s)</div>
                    ${avisoEncomendaCento}
                  </div>
                  <div class="controles">
                    <button onclick="alterarQuantidadeCento(${item.id}, -1)" id="menos-cento-${item.id}">-</button>
                    <div class="quantidade" id="qtd-cento-${item.id}">0</div>
                    <button onclick="alterarQuantidadeCento(${item.id}, 1)" id="mais-cento-${item.id}">+</button>
                  </div>
                `;
                pacoteContainer.appendChild(elCento);
            }
        } else if (item.tipo === 'cento_misto') {
             const el = document.createElement("div");
             el.className = "item";
             el.innerHTML = `
              <div class="item-info">
                <h3>${item.nome}</h3>
                <div class="preco">R$${item.preco_unitario.toFixed(2)} o cento</div>
                <div class="stock-info">Disponível: ${item.estoque} cento(s)</div>
                ${avisoEncomendaCento}
              </div>
              <div class="controles">
                <button onclick="alterarQuantidade(${item.id}, -1, true)" id="menos-${item.id}-misto">-</button>
                <div class="quantidade" id="qtd-${item.id}-misto">0</div>
                <button onclick="alterarQuantidade(${item.id}, 1, true)" id="mais-${item.id}-misto">+</button>
              </div>
            `;
            pacoteContainer.appendChild(el);
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
      
      const limite = isMisto ? item.estoque : Math.min(item.limite, item.estoque);
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

        const cartKey = `${id}_dezena`;
        if(carrinho[cartKey] === undefined) carrinho[cartKey] = 0;

        const maxDezenas = Math.floor(item.estoque / 10);
        
        let novasDezenas = carrinho[cartKey] + delta;
        if (novasDezenas < 0) novasDezenas = 0;
        if (novasDezenas > maxDezenas) novasDezenas = maxDezenas;

        carrinho[cartKey] = novasDezenas;
        document.getElementById(`qtd-dezena-${id}`).innerText = novasDezenas;

        atualizarBotoes();
        atualizarTotal();
    };

    window.alterarQuantidadeCento = function(id, delta) {
        const item = cardapio.find(i => i.id === id);
        if (!item) return;

        const cartKey = `${id}_cento`;
        if(carrinho[cartKey] === undefined) carrinho[cartKey] = 0;

        const maxCentos = Math.floor(item.estoque / 100);
        
        let novosCentos = carrinho[cartKey] + delta;
        if (novosCentos < 0) novosCentos = 0;
        if (novosCentos > maxCentos) novosCentos = maxCentos;

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
            const cartKeyMisto = `${item.id}_misto`;
            const qtdMisto = carrinho[cartKeyMisto] || 0;
            const menosBtnMisto = document.getElementById(`menos-${item.id}-misto`);
            const maisBtnMisto = document.getElementById(`mais-${item.id}-misto`);
            if(menosBtnMisto) menosBtnMisto.disabled = qtdMisto <= 0;
            if(maisBtnMisto) maisBtnMisto.disabled = qtdMisto >= item.estoque;
        } 
        
        if (item.tipo === 'mini') {
            // Botões do pacote de 10
            const cartKeyDezena = `${item.id}_dezena`;
            const currentDezenas = carrinho[cartKeyDezena] || 0;
            const maxDezenas = Math.floor(item.estoque / 10);
            if (maxDezenas >= 1) {
                const menosBtnDezena = document.getElementById(`menos-dezena-${item.id}`);
                const maisBtnDezena = document.getElementById(`mais-dezena-${item.id}`);
                if(menosBtnDezena) menosBtnDezena.disabled = currentDezenas <= 0;
                if(maisBtnDezena) maisBtnDezena.disabled = currentDezenas >= maxDezenas;
            }

            // Botões do cento
            const cartKeyCento = `${item.id}_cento`;
            const currentCentos = carrinho[cartKeyCento] || 0;
            const maxCentos = Math.floor(item.estoque / 100);
            if (maxCentos >= 1) {
                const menosBtnCento = document.getElementById(`menos-cento-${item.id}`);
                const maisBtnCento = document.getElementById(`mais-cento-${item.id}`);
                if(menosBtnCento) menosBtnCento.disabled = currentCentos <= 0;
                if(maisBtnCento) maisBtnCento.disabled = currentCentos >= maxCentos;
            }
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
            } else if (type === 'dezena') {
                total += qtd * (item.preco_unitario * 10);
            } else if (type === 'misto') {
                total += qtd * item.preco_unitario;
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
          } else if (type === 'dezena') {
              const subtotal = qtd * (item.preco_unitario * 10);
              mensagem += `• ${item.nome} (pacote c/ 10): ${qtd} pacote(s) (R$${subtotal.toFixed(2)})\n`;
              total += subtotal;
          } else if (type === 'misto') {
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