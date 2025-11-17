// Toggle section visibility
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  // Find the button that triggered this (it's in the same container)
  const container = section.closest(".section-container");
  const button = container.querySelector(".toggle-btn");

  if (section.style.display === "none" || section.style.display === "") {
    section.style.display = "block";
    if (button) button.classList.add("expanded");
  } else {
    section.style.display = "none";
    if (button) button.classList.remove("expanded");
  }
}

function testAPI() {
  fetch("/api/hello")
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("output").textContent = JSON.stringify(
        data,
        null,
        2
      );
    })
    .catch((err) => {
      document.getElementById("output").textContent = "Error: " + err.message;
    });
}

function loadCustomers() {
  fetch("/customers")
    .then((res) => res.json())
    .then((customers) => {
      const list = document.getElementById("customerList");
      list.innerHTML = "";
      customers.forEach((c) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${c.name}</strong> (${c.email || "no email"}) - ${
          c.phone || "no phone"
        }
          <button onclick="deleteCustomer(${c.customer_id})">🗑 Delete</button>
          <button onclick="showEditCustomerForm(${c.customer_id}, '${
          c.name
        }', '${c.email}', '${c.phone}', \`${c.notes || ""}\`)">✏️ Edit</button>
          <button onclick="toggleNotes(${c.customer_id})">📓 View Notes</button>
          <div id="edit-customer-${
            c.customer_id
          }" style="display: none; margin-top: 0.5rem;"></div>
          <div id="customer-notes-${
            c.customer_id
          }" style="display: none; margin-top: 0.5rem; font-style: italic; color: #555;">
            ${c.notes ? c.notes.replace(/\n/g, "<br>") : "No notes available."}
          </div>
        `;
        list.appendChild(li);
      });
    });
}

function toggleNotes(customerId) {
  const notesDiv = document.getElementById(`customer-notes-${customerId}`);
  if (notesDiv.style.display === "none") {
    notesDiv.style.display = "block";
  } else {
    notesDiv.style.display = "none";
  }
}

function showEditCustomerForm(id, name, email, phone, notes) {
  const container = document.getElementById(`edit-customer-${id}`);
  container.innerHTML = `
      <input type="text" id="edit-name-${id}" value="${name}" />
      <input type="text" id="edit-email-${id}" value="${email}" />
      <input type="text" id="edit-phone-${id}" value="${phone}" />
      <input type="text" id="edit-notes-${id}" value="${notes}" />
      <button onclick="submitCustomerEdit(${id})">✅ Save</button>
      <button onclick="cancelCustomerEdit(${id})">❌ Cancel</button>
    `;
  container.style.display = "block";
}

function submitCustomerEdit(id) {
  const name = document.getElementById(`edit-name-${id}`).value.trim();
  const email = document.getElementById(`edit-email-${id}`).value.trim();
  const phone = document.getElementById(`edit-phone-${id}`).value.trim();
  const notes = document.getElementById(`edit-notes-${id}`).value.trim();

  fetch(`/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, notes }),
  })
    .then((res) => res.json())
    .then(() => loadCustomers())
    .catch((err) => console.error("Error updating customer:", err));
}

function cancelCustomerEdit(id) {
  document.getElementById(`edit-customer-${id}`).style.display = "none";
}

function deleteCustomer(id) {
  if (!confirm("Delete this customer?")) return;
  fetch(`/customers/${id}`, { method: "DELETE" })
    .then((res) => res.json())
    .then(() => loadCustomers())
    .catch((err) => console.error("Error deleting customer:", err));
}

loadCustomers();

document
  .getElementById("customerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const customer = Object.fromEntries(formData.entries());

    const res = await fetch("/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    });

    if (res.ok) {
      e.target.reset();
      loadCustomers();
    }
  });

// Load all products on page load
// window.onload = loadProducts;

function loadProducts() {
  fetch("/products")
    .then((res) => res.json())
    .then((data) => {
      const list = document.getElementById("productList");
      list.innerHTML = "";
      data.forEach((product) => {
        const li = document.createElement("li");
        li.textContent = `${product.name} (${
          product.category || "No category"
        }) — ${product.description || "No description"}`;
        list.appendChild(li);
      });
    })
    .catch((err) => console.error("Failed to load products:", err));
}

// Handle new product form
document.getElementById("productForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value.trim();

  fetch("/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, category }),
  })
    .then((res) => res.json())
    .then((data) => {
      loadProducts(); // Refresh product list
      document.getElementById("productForm").reset();
    })
    .catch((err) => console.error("Error adding product:", err));
});

function loadProductsWithVariants() {
  fetch("/products-with-variants")
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById("productWithVariants");
      container.innerHTML = "";

      data.forEach((product) => {
        const productDiv = document.createElement("div");
        productDiv.style.marginBottom = "2rem";
        productDiv.style.borderBottom = "1px solid #ccc";
        productDiv.style.paddingBottom = "1rem";

        // 🔹 Product Header
        const productHeader = document.createElement("h3");
        productHeader.innerHTML = `
            ${product.name} (${product.category || "No category"})
            <button onclick="deleteProduct(${
              product.product_id
            })">🗑 Delete</button>
            <button onclick="showEditProductForm(${product.product_id}, \`${
          product.name
        }\`, \`${product.description}\`, \`${
          product.category
        }\`)">✏️ Edit</button>
            <button onclick="toggleVariantForm(${
              product.product_id
            })">➕ Add Variant</button>
            <button onclick="toggleVariantList(${
              product.product_id
            })">👁️ View Variants</button>
          `;
        productDiv.appendChild(productHeader);

        // ✏️ Edit Form (hidden by default)
        const editContainer = document.createElement("div");
        editContainer.id = `edit-product-${product.product_id}`;
        editContainer.style.display = "none";
        editContainer.style.marginTop = "0.5rem";
        productDiv.appendChild(editContainer);

        // 📄 Description
        const description = document.createElement("p");
        description.textContent = product.description || "No description";
        productDiv.appendChild(description);

        // ➕ Add Variant Form (initially hidden)
        const variantFormContainer = document.createElement("div");
        variantFormContainer.id = `variant-form-${product.product_id}`;
        variantFormContainer.style.display = "none";
        variantFormContainer.innerHTML = `
            <form id="variantForm-${product.product_id}">
              <input type="text" placeholder="Size" name="size" required />
              <input type="number" placeholder="Price" name="unit_price" step="0.01" required />
              <input type="number" placeholder="Stock" name="units_in_stock" required />
              <button type="submit">Add Variant</button>
            </form>
          `;
        productDiv.appendChild(variantFormContainer);

        // Handle variant submission
        variantFormContainer
          .querySelector("form")
          .addEventListener("submit", function (e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const size = formData.get("size");
            const unit_price = parseFloat(formData.get("unit_price"));
            const units_in_stock = parseInt(formData.get("units_in_stock"));

            fetch("/variants", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                product_id: product.product_id,
                size,
                unit_price,
                units_in_stock,
              }),
            })
              .then((res) => res.json())
              .then(() => {
                e.target.reset();
                loadProductsWithVariants();
              })
              .catch((err) => console.error("Error adding variant:", err));
          });

        // 👁️ Variant List (toggleable)
        const variantListContainer = document.createElement("div");
        variantListContainer.id = `variant-list-${product.product_id}`;
        variantListContainer.style.display = "none";

        if (product.variants.length > 0) {
          const variantList = document.createElement("ul");
          product.variants.forEach((variant) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${
                  variant.size
                }</strong> — $${variant.unit_price.toFixed(2)}
                | In stock: ${variant.units_in_stock}
                | Sold: ${variant.units_sold}
                | SKU: ${variant.sku}
                    <button onclick="deleteVariant(${
                      variant.variant_id
                    })">🗑</button>
                    <button onclick="showEditVariantForm(${
                      variant.variant_id
                    }, \`${variant.size}\`, ${variant.unit_price}, ${
              variant.units_in_stock
            })">✏️</button>
                    <input type="number" id="stock-input-${
                      variant.variant_id
                    }" placeholder="+ Stock" style="width: 60px;" />
                    <button onclick="addStock(${
                      variant.variant_id
                    })">➕</button>
                    <div id="edit-variant-${
                      variant.variant_id
                    }" style="display:none; margin-top: 0.5rem;"></div>
              `;
            variantList.appendChild(li);
          });
          variantListContainer.appendChild(variantList);
        } else {
          const noVar = document.createElement("p");
          noVar.textContent = "No variants available.";
          variantListContainer.appendChild(noVar);
        }

        productDiv.appendChild(variantListContainer);
        container.appendChild(productDiv);
      });
    })
    .catch((err) => {
      console.error("Error loading products with variants:", err);
    });
}

function toggleVariantForm(productId) {
  const formDiv = document.getElementById(`variant-form-${productId}`);
  formDiv.style.display = formDiv.style.display === "none" ? "block" : "none";
}

function toggleVariantList(productId) {
  const listDiv = document.getElementById(`variant-list-${productId}`);
  listDiv.style.display = listDiv.style.display === "none" ? "block" : "none";
}

function deleteVariant(id) {
  if (!confirm("Delete this variant?")) return;
  fetch(`/variants/${id}`, { method: "DELETE" })
    .then((res) => res.json())
    .then(() => loadProductsWithVariants())
    .catch((err) => console.error("Error deleting variant:", err));
}

function showEditVariantForm(id, size, price, stock) {
  const container = document.getElementById(`edit-variant-${id}`);
  container.innerHTML = `
      <form onsubmit="submitEditVariant(event, ${id})">
        <input type="text" id="edit-size-${id}" value="${size}" required />
        <input type="number" step="0.01" id="edit-price-${id}" value="${price}" required />
        <input type="number" id="edit-stock-${id}" value="${stock}" required />
        <button type="submit">✅ Save</button>
        <button type="button" onclick="cancelEditVariant(${id})">❌ Cancel</button>
      </form>
    `;
  container.style.display = "block";
}

function submitEditVariant(e, id) {
  e.preventDefault();
  const size = document.getElementById(`edit-size-${id}`).value.trim();
  const unit_price = parseFloat(
    document.getElementById(`edit-price-${id}`).value
  );
  const units_in_stock = parseInt(
    document.getElementById(`edit-stock-${id}`).value
  );

  fetch(`/variants/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ size, unit_price, units_in_stock }),
  })
    .then((res) => res.json())
    .then(() => loadProductsWithVariants())
    .catch((err) => console.error("Error updating variant:", err));
}

function cancelEditVariant(id) {
  document.getElementById(`edit-variant-${id}`).style.display = "none";
}

function addStock(id) {
  const input = document.getElementById(`stock-input-${id}`);
  const qty = parseInt(input.value);
  if (!qty || qty <= 0) return;

  fetch(`/variants/${id}/add-stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: qty }),
  })
    .then((res) => res.json())
    .then(() => {
      input.value = "";
      loadProductsWithVariants();
    })
    .catch((err) => console.error("Error adding stock:", err));
}

// ✅ Move these OUTSIDE the loop

function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  fetch(`/products/${id}`, { method: "DELETE" })
    .then((res) => res.json())
    .then(() => loadProductsWithVariants())
    .catch((err) => console.error("Error deleting product:", err));
}

function showEditProductForm(id, name, description, category) {
  const container = document.getElementById(`edit-product-${id}`);
  container.innerHTML = `
    <input type="text" id="edit-name-${id}" value="${name}" />
    <input type="text" id="edit-description-${id}" value="${description}" />
    <input type="text" id="edit-category-${id}" value="${category}" />
    <button onclick="submitProductEdit(${id})">✅ Save</button>
    <button onclick="cancelProductEdit(${id})">❌ Cancel</button>
  `;
  container.style.display = "block";
}

function submitProductEdit(id) {
  const name = document.getElementById(`edit-name-${id}`).value.trim();
  const description = document
    .getElementById(`edit-description-${id}`)
    .value.trim();
  const category = document.getElementById(`edit-category-${id}`).value.trim();

  fetch(`/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, category }),
  })
    .then((res) => res.json())
    .then(() => loadProductsWithVariants())
    .catch((err) => console.error("Error updating product:", err));
}

function cancelProductEdit(id) {
  document.getElementById(`edit-product-${id}`).style.display = "none";
}

function populateProductDropdown() {
  fetch("/products")
    .then((res) => res.json())
    .then((products) => {
      const select = document.getElementById("variantProductSelect");
      select.innerHTML = "";
      products.forEach((p) => {
        const option = document.createElement("option");
        option.value = p.product_id;
        option.textContent = p.name;
        select.appendChild(option);
      });
    });
}

document.getElementById("variantForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const product_id = document.getElementById("variantProductSelect").value;
  const size = document.getElementById("variantSize").value.trim();
  const unit_price = parseFloat(document.getElementById("variantPrice").value);
  const units_in_stock = parseInt(
    document.getElementById("variantStock").value
  );

  fetch("/variants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id, size, unit_price, units_in_stock }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Variant added:", data);
      document.getElementById("variantForm").reset();
      loadProductsWithVariants(); // Refresh display
    })
    .catch((err) => {
      console.error("Error adding variant:", err);
    });
});

let orderItems = [];

function populateOrderCustomerDropdown() {
  fetch("/customers")
    .then((res) => res.json())
    .then((customers) => {
      const select = document.getElementById("orderCustomer");
      select.innerHTML = '<option value="">Select Customer</option>';
      customers.forEach((c) => {
        const option = document.createElement("option");
        option.value = c.customer_id;
        option.textContent = c.name;
        select.appendChild(option);
      });
    });
}

function addOrderItem() {
  fetch("/products-with-variants")
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById("orderItemsContainer");
      // Use current number of items in DOM as index (more reliable)
      const index = container.children.length;

      const itemDiv = document.createElement("div");
      itemDiv.classList.add("order-item");
      itemDiv.dataset.index = index;

      // Create dropdown of variant options
      const variantSelect = document.createElement("select");
      variantSelect.name = "variant";
      variantSelect.required = true;

      variantSelect.innerHTML = '<option value="">Select Variant</option>';
      data.forEach((product) => {
        product.variants.forEach((variant) => {
          const option = document.createElement("option");
          option.value = JSON.stringify({
            variant_id: variant.variant_id,
            unit_price: variant.unit_price,
            product_id: product.product_id,
          });
          option.textContent = `${product.name} – ${variant.size} ($${variant.unit_price})`;
          variantSelect.appendChild(option);
        });
      });

      const quantityInput = document.createElement("input");
      quantityInput.type = "number";
      quantityInput.min = 1;
      quantityInput.placeholder = "Qty";
      quantityInput.required = true;

      variantSelect.addEventListener("change", updateOrderTotal);
      quantityInput.addEventListener("input", updateOrderTotal);

      // Create remove button
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "❌ Remove";
      removeButton.classList.add("remove-item-btn");
      removeButton.onclick = () => removeOrderItem(itemDiv, index);

      itemDiv.appendChild(variantSelect);
      itemDiv.appendChild(quantityInput);
      itemDiv.appendChild(removeButton);
      container.appendChild(itemDiv);

      orderItems.push({ variant_id: null, quantity: 0 }); // placeholder for this line
    });
}

function removeOrderItem(itemDiv, index) {
  // Remove from DOM
  itemDiv.remove();

  // Remove from orderItems array if index is valid
  if (index >= 0 && index < orderItems.length) {
    orderItems.splice(index, 1);
  }

  // Re-index remaining items
  const container = document.getElementById("orderItemsContainer");
  const remainingItems = container.querySelectorAll(".order-item");
  remainingItems.forEach((item, idx) => {
    item.dataset.index = idx;
    // Update the remove button's onclick to use the new index
    const removeBtn = item.querySelector(".remove-item-btn");
    if (removeBtn) {
      removeBtn.onclick = () => removeOrderItem(item, idx);
    }
  });

  // Update total after removal
  updateOrderTotal();
}

function updateOrderTotal() {
  const items = document.querySelectorAll(".order-item");
  let total = 0;

  items.forEach((div) => {
    const select = div.querySelector("select");
    const input = div.querySelector("input");
    if (!select || !input) return;

    const selected = select.value ? JSON.parse(select.value) : null;
    const qty = parseInt(input.value);
    if (selected && qty > 0) {
      total += selected.unit_price * qty;
    }
  });

  document.getElementById("orderTotal").textContent = total.toFixed(2);
}

document.getElementById("orderForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const customer_id = document.getElementById("orderCustomer").value;
  const items = [];

  document.querySelectorAll(".order-item").forEach((div) => {
    const select = div.querySelector("select");
    const input = div.querySelector("input");

    if (select && input && select.value) {
      const variantData = JSON.parse(select.value);
      const quantity = parseInt(input.value);

      if (variantData.variant_id && quantity > 0) {
        items.push({
          product_id: variantData.product_id,
          variant_id: variantData.variant_id,
          unit_price: variantData.unit_price,
          quantity,
          subtotal: variantData.unit_price * quantity,
        });
      }
    }
  });

  const total_price = items.reduce((sum, i) => sum + i.subtotal, 0);

  const payload = {
    customer_id,
    items,
    total_price,
  };

  fetch("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then(() => {
      alert("✅ Order submitted!");
      document.getElementById("orderForm").reset();
      document.getElementById("orderItemsContainer").innerHTML = "";
      document.getElementById("orderTotal").textContent = "0.00";
      orderItems = []; // Clear the orderItems array
    })
    .catch((err) => console.error("Error submitting order:", err));
});

function loadAllOrders() {
  fetch("/orders")
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.querySelector("#ordersTable tbody");
      tbody.innerHTML = "";

      let lastOrderId = null;

      data.forEach((row) => {
        const tr = document.createElement("tr");

        // Grouping orders with rowspan logic (basic approach)
        tr.innerHTML = `
            <td>${row.order_id !== lastOrderId ? row.order_id : ""}</td>
            <td>${
              row.order_id !== lastOrderId
                ? new Date(row.date).toLocaleString()
                : ""
            }</td>
            <td>${row.order_id !== lastOrderId ? row.customer_name : ""}</td>
            <td>${row.product_name}</td>
            <td>${row.size}</td>
            <td>${row.quantity}</td>
            <td>$${row.unit_price.toFixed(2)}</td>
            <td>$${row.subtotal.toFixed(2)}</td>
            <td>${
              row.order_id !== lastOrderId
                ? `$${row.total_price.toFixed(2)}`
                : ""
            }</td>
          `;

        lastOrderId = row.order_id;
        tbody.appendChild(tr);
      });
    })
    .catch((err) => {
      console.error("Error loading orders:", err);
    });
}

// === PAYMENT FUNCTIONS ===

let ordersList = [];

function populatePaymentDropdowns() {
  fetch("/api/orders-list")
    .then((res) => res.json())
    .then((orders) => {
      ordersList = orders;
      const paymentSelect = document.getElementById("paymentOrder");
      const viewSelect = document.getElementById("viewPaymentsOrder");

      // Clear and populate both dropdowns
      [paymentSelect, viewSelect].forEach((select) => {
        select.innerHTML = '<option value="">Select Order</option>';
        orders.forEach((order) => {
          const option = document.createElement("option");
          option.value = order.order_id;
          option.textContent = `Order #${order.order_id} - ${
            order.customer_name
          } ($${order.total_price.toFixed(2)})`;
          select.appendChild(option);
        });
      });
    })
    .catch((err) => console.error("Error loading orders:", err));
}

// Update balance info when order is selected
document.getElementById("paymentOrder").addEventListener("change", (e) => {
  const orderId = e.target.value;
  if (!orderId) {
    document.getElementById("orderBalanceInfo").innerHTML = "";
    return;
  }

  fetch(`/api/payments/order/${orderId}`)
    .then((res) => res.json())
    .then((data) => {
      const order = ordersList.find((o) => o.order_id == orderId);
      if (!order) return;

      const totalPaid = data.total_paid || 0;
      const balance = order.total_price - totalPaid;

      document.getElementById("orderBalanceInfo").innerHTML = `
        <strong>Order Total:</strong> $${order.total_price.toFixed(2)}<br>
        <strong>Total Paid:</strong> $${totalPaid.toFixed(2)}<br>
        <strong>Balance Due:</strong> $${balance.toFixed(2)}
      `;

      // Set max amount to balance
      document.getElementById("paymentAmount").max = balance;
    })
    .catch((err) => {
      console.error("Error fetching payment info:", err);
    });
});

// Handle payment form submission
document.getElementById("paymentForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const orderId = document.getElementById("paymentOrder").value;
  const amount = parseFloat(document.getElementById("paymentAmount").value);
  const method = document.getElementById("paymentMethod").value;
  const note = document.getElementById("paymentNote").value;

  if (!orderId) {
    alert("Please select an order");
    return;
  }

  fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: orderId,
      amount_paid: amount,
      payment_method: method,
      note: note || null,
    }),
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.error) {
        document.getElementById("paymentStatus").innerHTML = `
          <p style="color: red;">Error: ${result.error}</p>
        `;
      } else {
        document.getElementById("paymentStatus").innerHTML = `
          <p style="color: green;">
            ✅ Payment added successfully!<br>
            Total Paid: $${result.total_paid.toFixed(2)}<br>
            Balance Due: $${result.balance_due.toFixed(2)}
          </p>
        `;
        document.getElementById("paymentForm").reset();
        document.getElementById("orderBalanceInfo").innerHTML = "";

        // Refresh dropdowns and update balance info if order still selected
        populatePaymentDropdowns();
        if (orderId) {
          setTimeout(() => {
            document.getElementById("paymentOrder").value = orderId;
            document
              .getElementById("paymentOrder")
              .dispatchEvent(new Event("change"));
          }, 100);
        }
      }
    })
    .catch((err) => {
      console.error("Error adding payment:", err);
      document.getElementById("paymentStatus").innerHTML = `
        <p style="color: red;">Error adding payment</p>
      `;
    });
});

function viewPaymentHistory() {
  const orderId = document.getElementById("viewPaymentsOrder").value;
  if (!orderId) {
    alert("Please select an order");
    return;
  }

  fetch(`/api/payments/order/${orderId}`)
    .then((res) => res.json())
    .then((data) => {
      const order = ordersList.find((o) => o.order_id == orderId);
      const historyDiv = document.getElementById("paymentHistory");

      if (data.payments.length === 0) {
        historyDiv.innerHTML = `<p>No payments recorded for this order.</p>`;
        return;
      }

      const totalPaid = data.total_paid || 0;
      const balance = order ? order.total_price - totalPaid : 0;

      let html = `
        <h3>Payment History for Order #${orderId}</h3>
        <p><strong>Order Total:</strong> $${
          order ? order.total_price.toFixed(2) : "N/A"
        }</p>
        <p><strong>Total Paid:</strong> $${totalPaid.toFixed(2)}</p>
        <p><strong>Balance Due:</strong> $${balance.toFixed(2)}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 0.5rem;">Date</th>
              <th style="border: 1px solid #ddd; padding: 0.5rem;">Amount</th>
              <th style="border: 1px solid #ddd; padding: 0.5rem;">Method</th>
              <th style="border: 1px solid #ddd; padding: 0.5rem;">Note</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.payments.forEach((payment) => {
        html += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 0.5rem;">${new Date(
              payment.payment_date
            ).toLocaleString()}</td>
            <td style="border: 1px solid #ddd; padding: 0.5rem;">$${payment.amount_paid.toFixed(
              2
            )}</td>
            <td style="border: 1px solid #ddd; padding: 0.5rem;">${
              payment.payment_method
            }</td>
            <td style="border: 1px solid #ddd; padding: 0.5rem;">${
              payment.note || "-"
            }</td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      historyDiv.innerHTML = html;
    })
    .catch((err) => {
      console.error("Error fetching payment history:", err);
      document.getElementById("paymentHistory").innerHTML = `
        <p style="color: red;">Error loading payment history</p>
      `;
    });
}

// === ORDERS WITH BALANCES ===

function toggleOrdersWithBalances() {
  const section = document.getElementById("ordersWithBalances");
  const toggleText = document.getElementById("ordersToggleText");

  if (section.style.display === "none") {
    section.style.display = "block";
    toggleText.textContent = "Hide";
    loadOrdersWithBalances();
  } else {
    section.style.display = "none";
    toggleText.textContent = "Show";
  }
}

function loadOrdersWithBalances() {
  fetch("/api/orders-with-balances")
    .then((res) => {
      if (!res.ok) {
        return res.json().then((data) => {
          throw new Error(data.error || `HTTP error! status: ${res.status}`);
        });
      }
      return res.json();
    })
    .then((orders) => {
      const tbody = document.querySelector("#ordersBalancesTable tbody");
      tbody.innerHTML = "";

      // Check if response has error property
      if (orders.error) {
        throw new Error(orders.error);
      }

      if (!Array.isArray(orders)) {
        throw new Error("Invalid response format");
      }

      if (orders.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="border: 1px solid #ddd; padding: 0.5rem; text-align: center;">
              No orders found
            </td>
          </tr>
        `;
        return;
      }

      orders.forEach((order) => {
        const tr = document.createElement("tr");
        const isPaid = order.is_paid;
        const balanceDue = order.balance_due || 0;

        // Highlight unpaid orders in red
        if (!isPaid && balanceDue > 0) {
          tr.style.backgroundColor = "#ffebee";
        } else if (isPaid) {
          tr.style.backgroundColor = "#e8f5e9";
        }

        tr.innerHTML = `
          <td style="border: 1px solid #ddd; padding: 0.5rem;">${
            order.order_id
          }</td>
          <td style="border: 1px solid #ddd; padding: 0.5rem;">${new Date(
            order.date
          ).toLocaleDateString()}</td>
          <td style="border: 1px solid #ddd; padding: 0.5rem;">${
            order.customer_name
          }</td>
          <td style="border: 1px solid #ddd; padding: 0.5rem;">$${order.total_price.toFixed(
            2
          )}</td>
          <td style="border: 1px solid #ddd; padding: 0.5rem;">$${order.total_paid.toFixed(
            2
          )}</td>
          <td style="border: 1px solid #ddd; padding: 0.5rem; font-weight: ${
            balanceDue > 0 ? "bold" : "normal"
          };">$${balanceDue.toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 0.5rem;">
            ${isPaid ? "✅ Paid" : "⚠️ Unpaid"}
          </td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch((err) => {
      console.error("Error loading orders with balances:", err);
      const tbody = document.querySelector("#ordersBalancesTable tbody");
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="border: 1px solid #ddd; padding: 0.5rem; color: red; text-align: center;">
            Error: ${err.message || "Failed to load orders"}
          </td>
        </tr>
      `;
    });
}

// === SALES REPORTS FUNCTIONS ===

function populateReportDropdowns() {
  // Populate customer dropdown
  fetch("/customers")
    .then((res) => res.json())
    .then((customers) => {
      const select = document.getElementById("reportCustomer");
      customers.forEach((customer) => {
        const option = document.createElement("option");
        option.value = customer.customer_id;
        option.textContent = customer.name;
        select.appendChild(option);
      });
    })
    .catch((err) => console.error("Error loading customers:", err));

  // Populate product dropdown
  fetch("/api/products-list")
    .then((res) => res.json())
    .then((products) => {
      const select = document.getElementById("reportProduct");
      products.forEach((product) => {
        const option = document.createElement("option");
        option.value = product.product_id;
        option.textContent = product.name;
        select.appendChild(option);
      });
    })
    .catch((err) => console.error("Error loading products:", err));

  // Populate variant dropdown
  fetch("/api/variants-list")
    .then((res) => res.json())
    .then((variants) => {
      const select = document.getElementById("reportVariant");
      variants.forEach((variant) => {
        const option = document.createElement("option");
        option.value = variant.variant_id;
        option.textContent = `${variant.product_name} - ${
          variant.size
        } ($${variant.unit_price.toFixed(2)})`;
        select.appendChild(option);
      });
    })
    .catch((err) => console.error("Error loading variants:", err));
}

function clearReportFilters() {
  document.getElementById("reportCustomer").value = "";
  document.getElementById("reportStatus").value = "all";
  document.getElementById("reportExactDate").value = "";
  document.getElementById("reportStartDate").value = "";
  document.getElementById("reportEndDate").value = "";
  document.getElementById("reportProduct").value = "";
  document.getElementById("reportVariant").value = "";
  document.getElementById("salesReportResults").style.display = "none";
}

document.getElementById("salesReportForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const params = new URLSearchParams();

  const customerId = document.getElementById("reportCustomer").value;
  if (customerId) params.append("customer_id", customerId);

  const status = document.getElementById("reportStatus").value;
  if (status) params.append("status", status);

  const exactDate = document.getElementById("reportExactDate").value;
  if (exactDate) params.append("exact_date", exactDate);

  const startDate = document.getElementById("reportStartDate").value;
  if (startDate) params.append("start_date", startDate);

  const endDate = document.getElementById("reportEndDate").value;
  if (endDate) params.append("end_date", endDate);

  const productId = document.getElementById("reportProduct").value;
  if (productId) params.append("product_id", productId);

  const variantId = document.getElementById("reportVariant").value;
  if (variantId) params.append("variant_id", variantId);

  // Validate date filters
  if (exactDate && (startDate || endDate)) {
    alert("Please use either Exact Date OR Date Range, not both.");
    return;
  }

  if (startDate && endDate && startDate > endDate) {
    alert("Start date must be before end date.");
    return;
  }

  fetch(`/api/reports/sales?${params.toString()}`)
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || `HTTP ${res.status}`);
      }
      return data;
    })
    .then((data) => {
      if (data.error) {
        const errorMsg = data.details || data.error || "Unknown error";
        alert("Error: " + errorMsg);
        console.error("Report error:", data);
        return;
      }

      displaySalesReport(data);
    })
    .catch((err) => {
      console.error("Error generating report:", err);
      alert("Error generating report: " + err.message);
    });
});

function displaySalesReport(data) {
  const resultsDiv = document.getElementById("salesReportResults");
  resultsDiv.style.display = "block";

  // Display summary with safe defaults
  const summary = data.summary || {
    total_orders: 0,
    total_revenue: 0,
    total_paid: 0,
    total_outstanding: 0,
    open_orders: 0,
    closed_orders: 0,
  };

  const summaryContent = document.getElementById("summaryContent");
  summaryContent.innerHTML = `
    <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 8px">
      <div style="font-size: 0.9rem; opacity: 0.9">Total Orders</div>
      <div style="font-size: 2rem; font-weight: bold">${
        summary.total_orders || 0
      }</div>
    </div>
    <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 8px">
      <div style="font-size: 0.9rem; opacity: 0.9">Total Revenue</div>
      <div style="font-size: 2rem; font-weight: bold">$${(
        summary.total_revenue || 0
      ).toFixed(2)}</div>
    </div>
    <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 8px">
      <div style="font-size: 0.9rem; opacity: 0.9">Total Paid</div>
      <div style="font-size: 2rem; font-weight: bold">$${(
        summary.total_paid || 0
      ).toFixed(2)}</div>
    </div>
    <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 8px">
      <div style="font-size: 0.9rem; opacity: 0.9">Outstanding</div>
      <div style="font-size: 2rem; font-weight: bold">$${(
        summary.total_outstanding || 0
      ).toFixed(2)}</div>
    </div>
    <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 8px">
      <div style="font-size: 0.9rem; opacity: 0.9">Open Orders</div>
      <div style="font-size: 2rem; font-weight: bold">${
        summary.open_orders || 0
      }</div>
    </div>
    <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 8px">
      <div style="font-size: 0.9rem; opacity: 0.9">Closed Orders</div>
      <div style="font-size: 2rem; font-weight: bold">${
        summary.closed_orders || 0
      }</div>
    </div>
  `;

  // Display orders table
  const ordersTableDiv = document.getElementById("reportOrdersTable");
  if (data.orders.length === 0) {
    ordersTableDiv.innerHTML = `
      <p style="text-align: center; padding: 2rem; color: #666">No orders found matching your criteria.</p>
    `;
    return;
  }

  let tableHTML = `
    <table style="width: 100%; border-collapse: collapse">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Date</th>
          <th>Customer</th>
          <th>Items</th>
          <th>Total</th>
          <th>Paid</th>
          <th>Balance</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.orders.forEach((order) => {
    const isOpen = order.order_status === "open";
    const rowColor = isOpen ? "#ffebee" : "#e8f5e9";

    const itemsList = order.items
      .map(
        (item) =>
          `${item.product_name} - ${item.variant_size} (x${item.quantity})`
      )
      .join(", ");

    tableHTML += `
      <tr style="background-color: ${rowColor}">
        <td>${order.order_id}</td>
        <td>${new Date(order.date).toLocaleDateString()}</td>
        <td>
          <strong>${order.customer_name}</strong><br>
          <small style="color: #666">${order.customer_email || ""} ${
      order.customer_phone || ""
    }</small>
        </td>
        <td><small>${itemsList || "No items"}</small></td>
        <td>$${order.total_price.toFixed(2)}</td>
        <td>$${order.total_paid.toFixed(2)}</td>
        <td style="font-weight: ${
          order.balance_due > 0 ? "bold" : "normal"
        }">$${order.balance_due.toFixed(2)}</td>
        <td>${isOpen ? "⚠️ Open" : "✅ Closed"}</td>
      </tr>
    `;
  });

  tableHTML += `</tbody></table>`;
  ordersTableDiv.innerHTML = tableHTML;

  // Scroll to results
  resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}

window.onload = () => {
  loadProducts();
  loadCustomers();
  loadProductsWithVariants();
  populateProductDropdown();
  populateOrderCustomerDropdown();
  populatePaymentDropdowns();
  populateReportDropdowns();
};
