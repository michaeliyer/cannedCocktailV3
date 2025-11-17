const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4500;

// Database connection
const db = new sqlite3.Database("./db/cannedCocktailV3.db", (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from cannedCocktailV3!" });
});
//
// === PRODUCTS ROUTES ===
//

// Get all products
app.get("/products", (req, res) => {
  db.all(`SELECT * FROM products`, [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching products:", err.message);
      return res.status(500).json({ error: "Failed to retrieve products" });
    }
    res.json(rows);
  });
});

// Add a new product
app.post("/products", (req, res) => {
  const { name, description, category } = req.body;
  db.run(
    `INSERT INTO products (name, description, category) VALUES (?, ?, ?)`,
    [name, description, category],
    function (err) {
      if (err) {
        console.error("❌ Error adding product:", err.message);
        return res.status(500).json({ error: "Failed to add product" });
      }
      res.json({ product_id: this.lastID });
    }
  );
});

// Update a product
app.put("/products/:id", (req, res) => {
  const { name, description, category } = req.body;
  db.run(
    `UPDATE products SET name = ?, description = ?, category = ? WHERE product_id = ?`,
    [name, description, category, req.params.id],
    function (err) {
      if (err) {
        console.error("❌ Error updating product:", err.message);
        return res.status(500).json({ error: "Failed to update product" });
      }
      res.json({ changes: this.changes });
    }
  );
});

// Delete a product
app.delete("/products/:id", (req, res) => {
  db.run(
    `DELETE FROM products WHERE product_id = ?`,
    [req.params.id],
    function (err) {
      if (err) {
        console.error("❌ Error deleting product:", err.message);
        return res.status(500).json({ error: "Failed to delete product" });
      }
      res.json({ changes: this.changes });
    }
  );
});

// Add Customer
app.post("/customers", (req, res) => {
  const { name, email, phone, notes } = req.body;
  const sql = `INSERT INTO customers (name, email, phone, notes) VALUES (?, ?, ?, ?)`;
  db.run(sql, [name, email, phone, notes], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ customer_id: this.lastID });
  });
});

// Get Customers
app.get("/customers", (req, res) => {
  db.all(`SELECT * FROM customers`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.delete("/customers/:id", (req, res) => {
  db.run(
    `DELETE FROM customers WHERE customer_id = ?`,
    [req.params.id],
    function (err) {
      if (err) {
        console.error("❌ Error deleting customer:", err.message);
        return res.status(500).json({ error: "Failed to delete customer" });
      }
      res.json({ changes: this.changes });
    }
  );
});

app.put("/customers/:id", (req, res) => {
  const { name, email, phone, notes } = req.body;
  db.run(
    `UPDATE customers SET name = ?, email = ?, phone = ?, notes = ? WHERE customer_id = ?`,
    [name, email, phone, notes, req.params.id],
    function (err) {
      if (err) {
        console.error("❌ Error updating customer:", err.message);
        return res.status(500).json({ error: "Failed to update customer" });
      }
      res.json({ changes: this.changes });
    }
  );
});

// Add a new product variant
app.post("/variants", (req, res) => {
  const { product_id, size, unit_price, units_in_stock } = req.body;

  const insertQuery = `
      INSERT INTO product_variants (product_id, size, unit_price, units_in_stock)
      VALUES (?, ?, ?, ?)
    `;

  db.run(
    insertQuery,
    [product_id, size, unit_price, units_in_stock],
    function (err) {
      if (err) {
        console.error("❌ Error adding variant:", err.message);
        return res.status(500).json({ error: "Failed to add variant" });
      }

      const variantId = this.lastID;
      const sku = `SKU-${variantId}`;

      const updateQuery = `
        UPDATE product_variants SET sku = ? WHERE variant_id = ?
      `;

      db.run(updateQuery, [sku, variantId], function (err2) {
        if (err2) {
          console.error("❌ Error updating SKU:", err2.message);
          return res
            .status(500)
            .json({ error: "Variant added but SKU failed" });
        }

        res.json({ variant_id: variantId, sku });
      });
    }
  );
});

app.get("/products-with-variants", (req, res) => {
  const query = `
      SELECT 
        p.product_id, 
        p.name AS product_name,
        p.description,
        p.category,
        v.variant_id,
        v.size,
        v.unit_price,
        v.units_in_stock,
        v.units_sold,
        v.sku
      FROM products p
      LEFT JOIN product_variants v ON p.product_id = v.product_id
      ORDER BY p.product_id, v.variant_id
    `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching products with variants:", err.message);
      return res
        .status(500)
        .json({ error: "Failed to load products with variants" });
    }

    const result = {};

    rows.forEach((row) => {
      const pid = row.product_id;
      if (!result[pid]) {
        result[pid] = {
          product_id: pid,
          name: row.product_name,
          description: row.description,
          category: row.category,
          variants: [],
        };
      }

      if (row.variant_id) {
        result[pid].variants.push({
          variant_id: row.variant_id,
          size: row.size,
          unit_price: row.unit_price,
          units_in_stock: row.units_in_stock,
          units_sold: row.units_sold,
          sku: row.sku,
        });
      }
    });

    res.json(Object.values(result));
  });
});

app.put("/variants/:id", (req, res) => {
  const { size, unit_price, units_in_stock } = req.body;
  db.run(
    `UPDATE product_variants SET size = ?, unit_price = ?, units_in_stock = ? WHERE variant_id = ?`,
    [size, unit_price, units_in_stock, req.params.id],
    function (err) {
      if (err) {
        console.error("❌ Error updating variant:", err.message);
        return res.status(500).json({ error: "Failed to update variant" });
      }
      res.json({ changes: this.changes });
    }
  );
});

app.delete("/variants/:id", (req, res) => {
  db.run(
    `DELETE FROM product_variants WHERE variant_id = ?`,
    [req.params.id],
    function (err) {
      if (err) {
        console.error("❌ Error deleting variant:", err.message);
        return res.status(500).json({ error: "Failed to delete variant" });
      }
      res.json({ changes: this.changes });
    }
  );
});

app.patch("/variants/:id/add-stock", (req, res) => {
  const { quantity } = req.body;
  db.run(
    `UPDATE product_variants SET units_in_stock = units_in_stock + ? WHERE variant_id = ?`,
    [quantity, req.params.id],
    function (err) {
      if (err) {
        console.error("❌ Error adding stock:", err.message);
        return res.status(500).json({ error: "Failed to update stock" });
      }
      res.json({ changes: this.changes });
    }
  );
});

app.post("/orders", (req, res) => {
  const { customer_id, total_price, items } = req.body;

  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  const orderDate = new Date().toISOString();

  const insertOrder = `
      INSERT INTO orders (customer_id, date, total_price)
      VALUES (?, ?, ?)
    `;

  db.run(insertOrder, [customer_id, orderDate, total_price], function (err) {
    if (err) {
      console.error("❌ Error inserting order:", err.message);
      return res.status(500).json({ error: "Failed to create order" });
    }

    const order_id = this.lastID;

    const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

    const updateStock = db.prepare(`
        UPDATE product_variants
        SET units_in_stock = units_in_stock - ?
        WHERE variant_id = ?
      `);

    for (const item of items) {
      insertItem.run([
        order_id,
        item.product_id,
        item.variant_id,
        item.quantity,
        item.unit_price,
        item.subtotal,
      ]);

      updateStock.run([item.quantity, item.variant_id]);
    }

    insertItem.finalize();
    updateStock.finalize();

    res.json({ success: true, order_id });
  });
});

app.get("/orders", (req, res) => {
  const query = `
      SELECT
        o.order_id,
        o.date,
        o.total_price,
        c.name AS customer_name,
        p.name AS product_name,
        v.size,
        oi.quantity,
        oi.unit_price,
        oi.subtotal
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN product_variants v ON oi.variant_id = v.variant_id
      JOIN products p ON oi.product_id = p.product_id
      ORDER BY o.date DESC
    `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error loading orders:", err.message);
      return res.status(500).json({ error: "Failed to retrieve orders" });
    }
    res.json(rows);
  });
});

// === PAYMENTS ROUTES ===

// Get all orders for payment dropdown (simple list)
app.get("/api/orders-list", (req, res) => {
  const query = `
    SELECT DISTINCT
      o.order_id,
      o.date,
      o.total_price,
      c.name AS customer_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    ORDER BY o.date DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error loading orders list:", err.message);
      return res.status(500).json({ error: "Failed to retrieve orders" });
    }
    res.json(rows);
  });
});

// Get orders with payment summaries
app.get("/api/orders-with-balances", (req, res) => {
  const query = `
    SELECT 
      o.order_id,
      o.date,
      o.total_price,
      c.name AS customer_name,
      COALESCE(SUM(p.amount_paid), 0) AS total_paid
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    GROUP BY o.order_id, o.date, o.total_price, c.name
    ORDER BY o.date DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error loading orders with balances:", err.message);
      return res.status(500).json({ error: "Failed to retrieve orders" });
    }

    // Calculate balance_due for each order
    const ordersWithBalances = rows.map((row) => ({
      ...row,
      balance_due: row.total_price - row.total_paid,
      is_paid: row.total_paid >= row.total_price,
    }));

    res.json(ordersWithBalances);
  });
});

// Get payments for a specific order
app.get("/api/payments/order/:order_id", (req, res) => {
  const orderId = req.params.order_id;

  db.all(
    `SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC`,
    [orderId],
    (err, payments) => {
      if (err) {
        console.error("❌ Error fetching payments:", err.message);
        return res.status(500).json({ error: "Failed to retrieve payments" });
      }

      // Calculate total paid
      const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0);

      res.json({
        payments,
        total_paid: totalPaid,
      });
    }
  );
});

// Add a payment
app.post("/api/payments", (req, res) => {
  const { order_id, amount_paid, payment_method, note } = req.body;

  if (!order_id || !amount_paid || !payment_method) {
    return res.status(400).json({
      error: "Missing required fields: order_id, amount_paid, payment_method",
    });
  }

  if (amount_paid <= 0) {
    return res
      .status(400)
      .json({ error: "Payment amount must be greater than 0" });
  }

  // Get order total
  db.get(
    `SELECT total_price FROM orders WHERE order_id = ?`,
    [order_id],
    (err, order) => {
      if (err) {
        console.error("❌ Error fetching order:", err.message);
        return res.status(500).json({ error: "Failed to fetch order" });
      }

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Get current total paid
      db.get(
        `SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM payments WHERE order_id = ?`,
        [order_id],
        (err, result) => {
          if (err) {
            console.error("❌ Error calculating payments:", err.message);
            return res
              .status(500)
              .json({ error: "Failed to calculate current payments" });
          }

          const currentPaid = result.total_paid || 0;
          const remainingBalance = order.total_price - currentPaid;

          if (amount_paid > remainingBalance) {
            return res.status(400).json({
              error: `Payment amount ($${amount_paid.toFixed(
                2
              )}) exceeds remaining balance ($${remainingBalance.toFixed(2)})`,
            });
          }

          const paymentDate = new Date().toISOString();

          // Insert payment
          db.run(
            `INSERT INTO payments (order_id, amount_paid, payment_date, payment_method, note)
             VALUES (?, ?, ?, ?, ?)`,
            [order_id, amount_paid, paymentDate, payment_method, note || null],
            function (err) {
              if (err) {
                console.error("❌ Error adding payment:", err.message);
                return res.status(500).json({ error: "Failed to add payment" });
              }

              // Calculate new balance
              db.get(
                `SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM payments WHERE order_id = ?`,
                [order_id],
                (err, newResult) => {
                  if (err) {
                    console.error(
                      "❌ Error calculating new total:",
                      err.message
                    );
                    return res.status(500).json({
                      error: "Payment added but failed to calculate balance",
                    });
                  }

                  const newTotalPaid = newResult.total_paid || 0;
                  const newBalance = order.total_price - newTotalPaid;

                  res.json({
                    success: true,
                    payment_id: this.lastID,
                    total_paid: newTotalPaid,
                    balance_due: newBalance,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
