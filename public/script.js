function testAPI() {
    fetch('/api/hello')
      .then(res => res.json())
      .then(data => {
        document.getElementById('output').textContent = JSON.stringify(data, null, 2);
      })
      .catch(err => {
        document.getElementById('output').textContent = 'Error: ' + err.message;
      });
  }


  function loadCustomers() {
    fetch('/customers')
      .then(res => res.json())
      .then(customers => {
        const list = document.getElementById('customerList');
        list.innerHTML = '';
        customers.forEach(c => {

        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${c.name}</strong> (${c.email || 'no email'}) - ${c.phone || 'no phone'}
          <button onclick="deleteCustomer(${c.customer_id})">🗑 Delete</button>
          <button onclick="showEditCustomerForm(${c.customer_id}, '${c.name}', '${c.email}', '${c.phone}', \`${c.notes || ''}\`)">✏️ Edit</button>
          <button onclick="toggleNotes(${c.customer_id})">📓 View Notes</button>
          <div id="edit-customer-${c.customer_id}" style="display: none; margin-top: 0.5rem;"></div>
          <div id="customer-notes-${c.customer_id}" style="display: none; margin-top: 0.5rem; font-style: italic; color: #555;">
            ${c.notes ? c.notes.replace(/\n/g, '<br>') : 'No notes available.'}
          </div>
        `;
          list.appendChild(li);
        });
      });
  }

  function toggleNotes(customerId) {
    const notesDiv = document.getElementById(`customer-notes-${customerId}`);
    if (notesDiv.style.display === 'none') {
      notesDiv.style.display = 'block';
    } else {
      notesDiv.style.display = 'none';
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
    container.style.display = 'block';
  }
  
  function submitCustomerEdit(id) {
    const name = document.getElementById(`edit-name-${id}`).value.trim();
    const email = document.getElementById(`edit-email-${id}`).value.trim();
    const phone = document.getElementById(`edit-phone-${id}`).value.trim();
    const notes = document.getElementById(`edit-notes-${id}`).value.trim();
  
    fetch(`/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, notes })
    })
      .then(res => res.json())
      .then(() => loadCustomers())
      .catch(err => console.error('Error updating customer:', err));
  }
  
  function cancelCustomerEdit(id) {
    document.getElementById(`edit-customer-${id}`).style.display = 'none';
  }




  function deleteCustomer(id) {
    if (!confirm('Delete this customer?')) return;
    fetch(`/customers/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => loadCustomers())
      .catch(err => console.error('Error deleting customer:', err));
  }


  loadCustomers();



  document.getElementById('customerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const customer = Object.fromEntries(formData.entries());
  
    const res = await fetch('/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
  
    if (res.ok) {
      e.target.reset();
      loadCustomers();
    }
  });
  

// Load all products on page load
// window.onload = loadProducts;

function loadProducts() {
  fetch('/products')
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('productList');
      list.innerHTML = '';
      data.forEach(product => {
        const li = document.createElement('li');
        li.textContent = `${product.name} (${product.category || 'No category'}) — ${product.description || 'No description'}`;
        list.appendChild(li);
      });
    })
    .catch(err => console.error('Failed to load products:', err));
}

// Handle new product form
document.getElementById('productForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const description = document.getElementById('description').value.trim();
  const category = document.getElementById('category').value.trim();

  fetch('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, category })
  })
    .then(res => res.json())
    .then(data => {
      loadProducts(); // Refresh product list
      document.getElementById('productForm').reset();
    })
    .catch(err => console.error('Error adding product:', err));
});




function loadProductsWithVariants() {
    fetch('/products-with-variants')
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('productWithVariants');
        container.innerHTML = '';
  
        data.forEach(product => {
          const productDiv = document.createElement('div');
          productDiv.style.marginBottom = '2rem';
          productDiv.style.borderBottom = '1px solid #ccc';
          productDiv.style.paddingBottom = '1rem';
  
          // 🔹 Product Header
          const productHeader = document.createElement('h3');
          productHeader.innerHTML = `
            ${product.name} (${product.category || 'No category'})
            <button onclick="deleteProduct(${product.product_id})">🗑 Delete</button>
            <button onclick="showEditProductForm(${product.product_id}, \`${product.name}\`, \`${product.description}\`, \`${product.category}\`)">✏️ Edit</button>
            <button onclick="toggleVariantForm(${product.product_id})">➕ Add Variant</button>
            <button onclick="toggleVariantList(${product.product_id})">👁️ View Variants</button>
          `;
          productDiv.appendChild(productHeader);
  
          // ✏️ Edit Form (hidden by default)
          const editContainer = document.createElement('div');
          editContainer.id = `edit-product-${product.product_id}`;
          editContainer.style.display = 'none';
          editContainer.style.marginTop = '0.5rem';
          productDiv.appendChild(editContainer);
  
          // 📄 Description
          const description = document.createElement('p');
          description.textContent = product.description || 'No description';
          productDiv.appendChild(description);
  
          // ➕ Add Variant Form (initially hidden)
          const variantFormContainer = document.createElement('div');
          variantFormContainer.id = `variant-form-${product.product_id}`;
          variantFormContainer.style.display = 'none';
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
          variantFormContainer.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const size = formData.get('size');
            const unit_price = parseFloat(formData.get('unit_price'));
            const units_in_stock = parseInt(formData.get('units_in_stock'));
  
            fetch('/variants', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ product_id: product.product_id, size, unit_price, units_in_stock })
            })
              .then(res => res.json())
              .then(() => {
                e.target.reset();
                loadProductsWithVariants();
              })
              .catch(err => console.error('Error adding variant:', err));
          });
  
          // 👁️ Variant List (toggleable)
          const variantListContainer = document.createElement('div');
          variantListContainer.id = `variant-list-${product.product_id}`;
          variantListContainer.style.display = 'none';
  
          if (product.variants.length > 0) {
            const variantList = document.createElement('ul');
            product.variants.forEach(variant => {
              const li = document.createElement('li');
              li.innerHTML = `
                <strong>${variant.size}</strong> — $${variant.unit_price.toFixed(2)}
                | In stock: ${variant.units_in_stock}
                | Sold: ${variant.units_sold}
                | SKU: ${variant.sku}
                    <button onclick="deleteVariant(${variant.variant_id})">🗑</button>
                    <button onclick="showEditVariantForm(${variant.variant_id}, \`${variant.size}\`, ${variant.unit_price}, ${variant.units_in_stock})">✏️</button>
                    <input type="number" id="stock-input-${variant.variant_id}" placeholder="+ Stock" style="width: 60px;" />
                    <button onclick="addStock(${variant.variant_id})">➕</button>
                    <div id="edit-variant-${variant.variant_id}" style="display:none; margin-top: 0.5rem;"></div>
              `;
              variantList.appendChild(li);
            });
            variantListContainer.appendChild(variantList);
          } else {
            const noVar = document.createElement('p');
            noVar.textContent = 'No variants available.';
            variantListContainer.appendChild(noVar);
          }
  
          productDiv.appendChild(variantListContainer);
          container.appendChild(productDiv);
        });
      })
      .catch(err => {
        console.error('Error loading products with variants:', err);
      });
  }

  function toggleVariantForm(productId) {
    const formDiv = document.getElementById(`variant-form-${productId}`);
    formDiv.style.display = (formDiv.style.display === 'none') ? 'block' : 'none';
  }
  
  function toggleVariantList(productId) {
    const listDiv = document.getElementById(`variant-list-${productId}`);
    listDiv.style.display = (listDiv.style.display === 'none') ? 'block' : 'none';
  }






  function deleteVariant(id) {
    if (!confirm('Delete this variant?')) return;
    fetch(`/variants/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => loadProductsWithVariants())
      .catch(err => console.error('Error deleting variant:', err));
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
    container.style.display = 'block';
  }
  
  function submitEditVariant(e, id) {
    e.preventDefault();
    const size = document.getElementById(`edit-size-${id}`).value.trim();
    const unit_price = parseFloat(document.getElementById(`edit-price-${id}`).value);
    const units_in_stock = parseInt(document.getElementById(`edit-stock-${id}`).value);
  
    fetch(`/variants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size, unit_price, units_in_stock })
    })
      .then(res => res.json())
      .then(() => loadProductsWithVariants())
      .catch(err => console.error('Error updating variant:', err));
  }
  
  function cancelEditVariant(id) {
    document.getElementById(`edit-variant-${id}`).style.display = 'none';
  }
  
  function addStock(id) {
    const input = document.getElementById(`stock-input-${id}`);
    const qty = parseInt(input.value);
    if (!qty || qty <= 0) return;
  
    fetch(`/variants/${id}/add-stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: qty })
    })
      .then(res => res.json())
      .then(() => {
        input.value = '';
        loadProductsWithVariants();
      })
      .catch(err => console.error('Error adding stock:', err));
  }














// ✅ Move these OUTSIDE the loop

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  fetch(`/products/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => loadProductsWithVariants())
    .catch(err => console.error('Error deleting product:', err));
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
  container.style.display = 'block';
}

function submitProductEdit(id) {
  const name = document.getElementById(`edit-name-${id}`).value.trim();
  const description = document.getElementById(`edit-description-${id}`).value.trim();
  const category = document.getElementById(`edit-category-${id}`).value.trim();

  fetch(`/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, category })
  })
    .then(res => res.json())
    .then(() => loadProductsWithVariants())
    .catch(err => console.error('Error updating product:', err));
}

function cancelProductEdit(id) {
  document.getElementById(`edit-product-${id}`).style.display = 'none';
}
        

  function populateProductDropdown() {
    fetch('/products')
      .then(res => res.json())
      .then(products => {
        const select = document.getElementById('variantProductSelect');
        select.innerHTML = '';
        products.forEach(p => {
          const option = document.createElement('option');
          option.value = p.product_id;
          option.textContent = p.name;
          select.appendChild(option);
        });
      });
  }

  document.getElementById('variantForm').addEventListener('submit', (e) => {
    e.preventDefault();
  
    const product_id = document.getElementById('variantProductSelect').value;
    const size = document.getElementById('variantSize').value.trim();
    const unit_price = parseFloat(document.getElementById('variantPrice').value);
    const units_in_stock = parseInt(document.getElementById('variantStock').value);
  
    fetch('/variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id, size, unit_price, units_in_stock })
    })
      .then(res => res.json())
      .then(data => {
        console.log('Variant added:', data);
        document.getElementById('variantForm').reset();
        loadProductsWithVariants(); // Refresh display
      })
      .catch(err => {
        console.error('Error adding variant:', err);
      });
  });





let orderItems = [];

function populateOrderCustomerDropdown() {
  fetch('/customers')
    .then(res => res.json())
    .then(customers => {
      const select = document.getElementById('orderCustomer');
      select.innerHTML = '<option value="">Select Customer</option>';
      customers.forEach(c => {
        const option = document.createElement('option');
        option.value = c.customer_id;
        option.textContent = c.name;
        select.appendChild(option);
      });
    });
}

function addOrderItem() {
  fetch('/products-with-variants')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('orderItemsContainer');
      const index = orderItems.length;

      const itemDiv = document.createElement('div');
      itemDiv.classList.add('order-item');
      itemDiv.dataset.index = index;

      // Create dropdown of variant options
      const variantSelect = document.createElement('select');
      variantSelect.name = 'variant';
      variantSelect.required = true;

      variantSelect.innerHTML = '<option value="">Select Variant</option>';
      data.forEach(product => {
        product.variants.forEach(variant => {
          const option = document.createElement('option');
          option.value = JSON.stringify({
            variant_id: variant.variant_id,
            unit_price: variant.unit_price,
            product_id: product.product_id
          });
          option.textContent = `${product.name} – ${variant.size} ($${variant.unit_price})`;
          variantSelect.appendChild(option);
        });
      });

      const quantityInput = document.createElement('input');
      quantityInput.type = 'number';
      quantityInput.min = 1;
      quantityInput.placeholder = 'Qty';
      quantityInput.required = true;

      variantSelect.addEventListener('change', updateOrderTotal);
      quantityInput.addEventListener('input', updateOrderTotal);

      itemDiv.appendChild(variantSelect);
      itemDiv.appendChild(quantityInput);
      container.appendChild(itemDiv);

      orderItems.push({ variant_id: null, quantity: 0 }); // placeholder for this line
    });
}

function updateOrderTotal() {
  const items = document.querySelectorAll('.order-item');
  let total = 0;

  items.forEach(div => {
    const select = div.querySelector('select');
    const input = div.querySelector('input');
    if (!select || !input) return;

    const selected = select.value ? JSON.parse(select.value) : null;
    const qty = parseInt(input.value);
    if (selected && qty > 0) {
      total += selected.unit_price * qty;
    }
  });

  document.getElementById('orderTotal').textContent = total.toFixed(2);
}

document.getElementById('orderForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const customer_id = document.getElementById('orderCustomer').value;
  const items = [];

  document.querySelectorAll('.order-item').forEach(div => {
    const select = div.querySelector('select');
    const input = div.querySelector('input');

    if (select && input && select.value) {
      const variantData = JSON.parse(select.value);
      const quantity = parseInt(input.value);

      if (variantData.variant_id && quantity > 0) {
        items.push({
          product_id: variantData.product_id,
          variant_id: variantData.variant_id,
          unit_price: variantData.unit_price,
          quantity,
          subtotal: (variantData.unit_price * quantity)
        });
      }
    }
  });

  const total_price = items.reduce((sum, i) => sum + i.subtotal, 0);

  const payload = {
    customer_id,
    items,
    total_price
  };

  fetch('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(() => {
      alert('✅ Order submitted!');
      document.getElementById('orderForm').reset();
      document.getElementById('orderItemsContainer').innerHTML = '';
      document.getElementById('orderTotal').textContent = '0.00';
    })
    .catch(err => console.error('Error submitting order:', err));
});

window.onload = () => {
    loadProducts();
    loadCustomers();
    loadProductsWithVariants();
    populateProductDropdown(); // ✅ add this line
    populateOrderCustomerDropdown();
  };