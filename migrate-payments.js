const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./db/cannedCocktailV3.db", (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

console.log("🔄 Adding payments table...");

db.run(
  `CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    amount_paid REAL NOT NULL,
    payment_date TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
  )`,
  (err) => {
    if (err) {
      console.error("❌ Error creating payments table:", err.message);
      db.close();
      process.exit(1);
    } else {
      console.log("✅ Payments table created successfully!");
      db.close();
    }
  }
);

