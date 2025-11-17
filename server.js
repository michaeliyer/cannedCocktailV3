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

// === SALES REPORTS ROUTES ===

// Get sales report with filters
app.get("/api/reports/sales", (req, res) => {
  try {
    const {
      customer_id,
      start_date,
      end_date,
      exact_date,
      product_id,
      variant_id,
      status, // 'open', 'closed', or 'all'
    } = req.query;

    // Debug: Log all incoming parameters
    console.log("📥 Sales Report Request Params:", {
      customer_id,
      start_date,
      end_date,
      exact_date,
      product_id,
      variant_id,
      status,
    });

    let query = `
    SELECT 
      o.order_id,
      o.date,
      o.total_price,
      c.customer_id,
      c.name AS customer_name,
      c.email AS customer_email,
      c.phone AS customer_phone,
      COALESCE(SUM(p.amount_paid), 0) AS total_paid,
      (o.total_price - COALESCE(SUM(p.amount_paid), 0)) AS balance_due,
      CASE 
        WHEN (o.total_price - COALESCE(SUM(p.amount_paid), 0)) <= 0 THEN 'closed'
        ELSE 'open'
      END AS order_status
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    WHERE 1=1
    `;

    let params = [];

    // Filter by customer
    if (customer_id) {
      query += ` AND o.customer_id = ?`;
      params.push(customer_id);
    }

    // Filter by exact date (convert UTC to local date for comparison)
    if (exact_date) {
      // Use SQLite's date() function on the localtime-converted datetime
      // This ensures we compare the local date, not UTC date
      query += ` AND date(datetime(o.date, 'localtime')) = ?`;
      params.push(exact_date);
    }

    // Filter by date range (convert UTC to local date for comparison)
    if (start_date && !exact_date) {
      query += ` AND date(datetime(o.date, 'localtime')) >= ?`;
      params.push(start_date);
    }
    if (end_date && !exact_date) {
      query += ` AND date(datetime(o.date, 'localtime')) <= ?`;
      params.push(end_date);
    }

    // Filter by status (open/closed)
    if (status && status !== "all") {
      // We'll filter this after the query since we need to calculate balance first
    }

    // Filter by product or variant (requires subquery)
    // Check if product_id or variant_id are provided and not empty, and are valid numbers
    const productIdNum =
      product_id && product_id !== "" ? parseInt(product_id) : null;
    const variantIdNum =
      variant_id && variant_id !== "" ? parseInt(variant_id) : null;
    const hasProductFilter = productIdNum !== null && !isNaN(productIdNum);
    const hasVariantFilter = variantIdNum !== null && !isNaN(variantIdNum);

    if (hasProductFilter || hasVariantFilter) {
      // Build WHERE conditions first
      const whereConditions = [];
      const params2 = [];

      if (customer_id) {
        whereConditions.push(`o.customer_id = ?`);
        params2.push(customer_id);
      }

      if (exact_date) {
        whereConditions.push(`date(datetime(o.date, 'localtime')) = ?`);
        params2.push(exact_date);
      }

      if (start_date && !exact_date) {
        whereConditions.push(`date(datetime(o.date, 'localtime')) >= ?`);
        params2.push(start_date);
      }
      if (end_date && !exact_date) {
        whereConditions.push(`date(datetime(o.date, 'localtime')) <= ?`);
        params2.push(end_date);
      }

      if (hasProductFilter) {
        whereConditions.push(`oi.product_id = ?`);
        params2.push(productIdNum);
      }

      if (hasVariantFilter) {
        whereConditions.push(`oi.variant_id = ?`);
        params2.push(variantIdNum);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      query = `
      SELECT DISTINCT
        o.order_id,
        o.date,
        o.total_price,
        c.customer_id,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        COALESCE(payments_sum.total_paid, 0) AS total_paid,
        (o.total_price - COALESCE(payments_sum.total_paid, 0)) AS balance_due,
        CASE 
          WHEN (o.total_price - COALESCE(payments_sum.total_paid, 0)) <= 0 THEN 'closed'
          ELSE 'open'
        END AS order_status
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN (
        SELECT order_id, SUM(amount_paid) AS total_paid
        FROM payments
        GROUP BY order_id
      ) payments_sum ON o.order_id = payments_sum.order_id
      ${whereClause}
    `;

      params = params2;
    } else {
      // Only add GROUP BY if we didn't replace the query
      query += ` GROUP BY o.order_id, o.date, o.total_price, c.customer_id, c.name, c.email, c.phone`;
    }

    query += ` ORDER BY o.date DESC`;

    // Debug logging
    console.log("📊 Sales Report Query:", query);
    console.log("📊 Sales Report Params:", params);
    console.log("📊 Params length:", params.length);
    console.log(
      "📊 Params types:",
      params.map((p) => typeof p)
    );

    // Validate query and params before executing
    if (!query || query.trim() === "") {
      return res.status(500).json({
        error: "Invalid query generated",
        details: "Query is empty",
      });
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error("❌ Error generating sales report:", err.message);
        console.error("❌ Full Query:", query);
        console.error("❌ Params:", params);
        console.error("❌ Params count:", params.length);
        console.error("❌ Stack:", err.stack);
        return res.status(500).json({
          error: "Error generating sales report",
          details: err.message,
          query: query.substring(0, 500), // First 500 chars for debugging
          paramsCount: params.length,
        });
      }

      // Filter by status if needed (after calculating balance)
      let filteredRows = rows;
      if (status && status !== "all") {
        filteredRows = rows.filter((row) => row.order_status === status);
      }

      // Get order items for each order
      const orderIds = filteredRows.map((r) => r.order_id);
      if (orderIds.length === 0) {
        return res.json({
          orders: [],
          summary: {
            total_orders: 0,
            total_revenue: 0,
            total_paid: 0,
            total_outstanding: 0,
            open_orders: 0,
            closed_orders: 0,
          },
        });
      }

      const itemsQuery = `
      SELECT 
        oi.order_id,
        oi.product_id,
        oi.variant_id,
        oi.quantity,
        oi.unit_price,
        oi.subtotal,
        p.name AS product_name,
        v.size AS variant_size
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN product_variants v ON oi.variant_id = v.variant_id
      WHERE oi.order_id IN (${orderIds.map(() => "?").join(",")})
    `;

      db.all(itemsQuery, orderIds, (err, items) => {
        if (err) {
          console.error("❌ Error fetching order items:", err.message);
          return res.status(500).json({ error: "Failed to fetch order items" });
        }

        // Group items by order_id
        const itemsByOrder = {};
        items.forEach((item) => {
          if (!itemsByOrder[item.order_id]) {
            itemsByOrder[item.order_id] = [];
          }
          itemsByOrder[item.order_id].push(item);
        });

        // Attach items to orders
        const ordersWithItems = filteredRows.map((order) => ({
          ...order,
          items: itemsByOrder[order.order_id] || [],
        }));

        // Calculate summary with safe defaults
        const summary = {
          total_orders: ordersWithItems.length || 0,
          total_revenue: ordersWithItems.reduce(
            (sum, o) => sum + (parseFloat(o.total_price) || 0),
            0
          ),
          total_paid: ordersWithItems.reduce(
            (sum, o) => sum + (parseFloat(o.total_paid) || 0),
            0
          ),
          total_outstanding: ordersWithItems.reduce(
            (sum, o) => sum + (parseFloat(o.balance_due) || 0),
            0
          ),
          open_orders: ordersWithItems.filter((o) => o.order_status === "open")
            .length,
          closed_orders: ordersWithItems.filter(
            (o) => o.order_status === "closed"
          ).length,
        };

        res.json({ orders: ordersWithItems, summary });
      });
    });
  } catch (error) {
    console.error("❌ Unhandled error in sales report route:", error);
    console.error("❌ Stack:", error.stack);
    return res.status(500).json({
      error: "Error generating sales report",
      details: error.message,
    });
  }
});

// Get all products for report dropdown
app.get("/api/products-list", (req, res) => {
  db.all(
    `SELECT product_id, name FROM products ORDER BY name`,
    [],
    (err, rows) => {
      if (err) {
        console.error("❌ Error fetching products:", err.message);
        return res.status(500).json({ error: "Failed to fetch products" });
      }
      res.json(rows);
    }
  );
});

// Get all variants for report dropdown
app.get("/api/variants-list", (req, res) => {
  const query = `
    SELECT 
      v.variant_id,
      v.size,
      p.name AS product_name,
      v.unit_price
    FROM product_variants v
    JOIN products p ON v.product_id = p.product_id
    ORDER BY p.name, v.size
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching variants:", err.message);
      return res.status(500).json({ error: "Failed to fetch variants" });
    }
    res.json(rows);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
