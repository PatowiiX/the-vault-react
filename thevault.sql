ALTER TABLE ordenes 
ADD COLUMN orden_items JSON,
ADD COLUMN payment_id VARCHAR(255),
ADD COLUMN payer_email VARCHAR(255),
ADD COLUMN transaction_data TEXT,
ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0,
ADD COLUMN tracking_number VARCHAR(100),
ADD COLUMN estimated_delivery DATE;
-- ============================================
-- 3. TABLA PARA HISTORIAL DE STOCK
-- ============================================
CREATE TABLE IF NOT EXISTS stock_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    disco_id INT NOT NULL,
    orden_id INT,
    cambio INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    motivo VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disco_id) REFERENCES discos(id),
    FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE SET NULL,
    INDEX idx_disco (disco_id),
    INDEX idx_orden (orden_id)
);