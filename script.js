let cardapioData = [];
const cart = new Map(); // Stores { id_type: { item: itemData, quantity: num, price: num, name: string, unit: string } }

document.addEventListener("DOMContentLoaded", () => {
    fetch("db.json")
      .then(res => res.json())
      .then(data => {
        cardapioData = data; // Store data globally
        montarCardapio(data);
        updateCartSummary(); // Initialize cart summary display
      });

    // Event listeners are now attached dynamically inside montarCardapio
    // for future items, but for initial load, they are attached after creation.
    // This is fine as montarCardapio is only called once on load.
});

function updateQuantity(itemId, itemType, change) {
    const item = cardapioData.find(i => i.id === itemId);
    if (!item) return;

    const cartKey = `${itemId}_${itemType}`;
    let currentQty = cart.has(cartKey) ? cart.get(cartKey).quantity : 0;
    let newQty = currentQty + change;

    let pricePerUnit = 0;
    let unitName = "";
    let effectiveLimit = item.limite;

    if (itemType === 'unit') {
        pricePerUnit = item.preco_unitario;
        unitName = "unidade";
    } else if (itemType === 'pack10') {
        pricePerUnit = item.preco_unitario * 10;
        unitName = "pacote c/ 10";
        effectiveLimit = Math.floor(item.limite / 10);
    } else if (itemType === 'cento') {
        pricePerUnit = item.preco_cento;
        unitName = "o cento";
        effectiveLimit = Math.floor(item.limite / 100);
    }

    newQty = Math.max(0, newQty); // Cannot go below 0

    newQty = Math.min(newQty, effectiveLimit); // Apply user's order limit

    if (newQty > 0) {
        cart.set(cartKey, { item: item, quantity: newQty, price: pricePerUnit, name: item.nome, unit: unitName });
    } else {
        cart.delete(cartKey);
    }

    // Update HTML display
    const qtyElement = document.getElementById(`qty-${itemId}-${itemType}`);
    if (qtyElement) {
        qtyElement.textContent = newQty;
    }
    
    const minusBtn = document.getElementById(`minus-${itemId}-${itemType}`);
    const plusBtn = document.getElementById(`plus-${itemId}-${itemType}`);

    if (minusBtn) minusBtn.disabled = newQty === 0;
    if (plusBtn) plusBtn.disabled = newQty >= effectiveLimit;

    updateCartSummary();
}

function updateCartSummary() {
    let totalItems = 0;
    let totalPrice = 0;
    let whatsappMessage = "Olá! Gostaria de fazer o seguinte pedido:\n\n";

    const fazerPedidoBtn = document.getElementById("fazer-pedido");
    fazerPedidoBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Fazer Pedido via WhatsApp'; // Reset to default
    fazerPedidoBtn.disabled = true;

    if (cart.size === 0) {
        whatsappMessage += "Nenhum item selecionado.";
    } else {
        cart.forEach(entry => {
            totalItems += entry.quantity;
            totalPrice += entry.quantity * entry.price;
            whatsappMessage += `${entry.quantity}x ${entry.name} (${entry.unit}) - R$${(entry.quantity * entry.price).toFixed(2)}\n`;
        });
        whatsappMessage += `\nTotal: R$${totalPrice.toFixed(2)}`;
        fazerPedidoBtn.innerHTML = `<i class="fab fa-whatsapp"></i> Fazer Pedido (${totalItems} itens) - R$${totalPrice.toFixed(2)}`;
        fazerPedidoBtn.disabled = false;
    }

    fazerPedidoBtn.onclick = () => {
        const numero = "5521979744099"; // Seu número de WhatsApp
        const url = `https://wa.me/${numero}?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(url, "_blank");
    };
}

function montarCardapio(cardapio) {
    const grandeContainer = document.getElementById("cardapio-grande");
    const pequenoContainer = document.getElementById("cardapio-pequeno");
    const mistoContainer = document.getElementById("cardapio-misto");

    grandeContainer.innerHTML = "";
    pequenoContainer.innerHTML = "";
    mistoContainer.innerHTML = "";
    
    cardapio.forEach(item => {
        const outOfStock = false; // Stock system removed, always false
        const itemHtml = document.createElement("div");
        itemHtml.className = `item ${outOfStock ? 'out-of-stock' : ''}`;
        
        let controlsHtml = '';

        if (item.tipo === 'grande') {
            const currentQty = cart.has(`${item.id}_unit`) ? cart.get(`${item.id}_unit`).quantity : 0;
            const effectiveLimit = item.limite;

            controlsHtml = `
                <div class="control-set">
                    <div class="preco">R$${item.preco_unitario.toFixed(2)} / unidade</div>
                    <div class="controles">
                        <button id="minus-${item.id}-unit" data-id="${item.id}" data-type="unit" class="minus-btn" ${currentQty === 0 ? 'disabled' : ''}>-</button>
                        <div class="quantidade" id="qty-${item.id}-unit">${currentQty}</div>
                        <button id="plus-${item.id}-unit" data-id="${item.id}" data-type="unit" class="plus-btn" ${currentQty >= effectiveLimit ? 'disabled' : ''}>+</button>
                    </div>
                    ${item.limite > 0 ? `<div class="encomenda-info">Limite de compra: ${item.limite} unidades</div>` : ''}
                </div>
            `;
            itemHtml.innerHTML = `
                <div class="item-info">
                    <h3>${item.nome}</h3>
                </div>
                <div class="controles-group">
                    ${controlsHtml}
                </div>
            `;
            grandeContainer.appendChild(itemHtml);
        } else if (item.tipo === 'mini') {
            const currentPackQty = cart.has(`${item.id}_pack10`) ? cart.get(`${item.id}_pack10`).quantity : 0;
            const currentCentoQty = cart.has(`${item.id}_cento`) ? cart.get(`${item.id}_cento`).quantity : 0;
            
            const pack10Price = (item.preco_unitario * 10).toFixed(2);
            const centoPrice = item.preco_cento.toFixed(2);

            const effectivePackLimit = Math.floor(item.limite / 10);
            const effectiveCentoLimit = Math.floor(item.limite / 100);

            controlsHtml = `
                <div class="control-set">
                    <div class="preco">R$${pack10Price} / pacote c/ 10</div>
                    <div class="controles">
                        <button id="minus-${item.id}-pack10" data-id="${item.id}" data-type="pack10" class="minus-btn" ${currentPackQty === 0 ? 'disabled' : ''}>-</button>
                        <div class="quantidade" id="qty-${item.id}-pack10">${currentPackQty}</div>
                        <button id="plus-${item.id}-pack10" data-id="${item.id}" data-type="pack10" class="plus-btn" ${currentPackQty >= effectivePackLimit ? 'disabled' : ''}>+</button>
                    </div>
                </div>
                <div class="control-set">
                    <div class="preco">R$${centoPrice} / o cento</div>
                    <div class="controles">
                        <button id="minus-${item.id}-cento" data-id="${item.id}" data-type="cento" class="minus-btn" ${currentCentoQty === 0 ? 'disabled' : ''}>-</button>
                        <div class="quantidade" id="qty-${item.id}-cento">${currentCentoQty}</div>
                        <button id="plus-${item.id}-cento" data-id="${item.id}" data-type="cento" class="plus-btn" ${currentCentoQty >= effectiveCentoLimit ? 'disabled' : ''}>+</button>
                    </div>
                </div>
                <div class="encomenda-info">Favor consultar disponibilidade para grandes quantidades.</div>
            `;
            itemHtml.innerHTML = `
                <div class="item-info">
                    <h3>${item.nome}</h3>
                </div>
                <div class="controles-group">
                    ${controlsHtml}
                </div>
            `;
            pequenoContainer.appendChild(itemHtml);
        } else if (item.tipo === 'cento_misto') {
            const currentCentoQty = cart.has(`${item.id}_cento`) ? cart.get(`${item.id}_cento`).quantity : 0;
            const effectiveCentoLimit = Math.floor(item.limite / 100);

            controlsHtml = `
                <div class="control-set">
                    <div class="preco">R$${item.preco_cento.toFixed(2)} / o cento</div>
                    <div class="controles">
                        <button id="minus-${item.id}-cento" data-id="${item.id}" data-type="cento" class="minus-btn" ${currentCentoQty === 0 ? 'disabled' : ''}>-</button>
                        <div class="quantidade" id="qty-${item.id}-cento">${currentCentoQty}</div>
                        <button id="plus-${item.id}-cento" data-id="${item.id}" data-type="cento" class="plus-btn" ${currentCentoQty >= effectiveCentoLimit ? 'disabled' : ''}>+</button>
                    </div>
                </div>
            `;
            itemHtml.innerHTML = `
                <div class="item-info">
                    <h3>${item.nome}</h3>
                </div>
                <div class="controles-group">
                    ${controlsHtml}
                </div>
            `;
            mistoContainer.appendChild(itemHtml);
        }
    });

    // Attach event listeners after all items are added to the DOM
    document.querySelectorAll(".minus-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const id = parseInt(e.target.dataset.id);
            const type = e.target.dataset.type;
            updateQuantity(id, type, -1);
        });
    });

    document.querySelectorAll(".plus-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const id = parseInt(e.target.dataset.id);
            const type = e.target.dataset.type;
            updateQuantity(id, type, 1);
        });
    });
}