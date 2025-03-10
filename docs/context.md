## Overview

This document specifies the integration of a Point-of-Sale (POS) inventory system using Neon for the database backend. The system provides:

- Real-time inventory dashboard for employees
- Enhanced controls for managers
- Barcode scanning integration
- Automated stock alerts
- Financial reporting
- WebSocket-based real-time synchronization

## Database Schema (Neon)

### Core Tables

#### Users
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('employee', 'manager')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Products
```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Transactions
```sql
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Inventory Logs
```sql
CREATE TABLE inventory_logs (
    log_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id),
    change INTEGER NOT NULL,
    reason TEXT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Database Operations

#### Update Stock After Sale
```sql
BEGIN;
UPDATE products
SET stock_quantity = stock_quantity - 1,
    updated_at = CURRENT_TIMESTAMP
WHERE product_id = 123
  AND stock_quantity > 0;

INSERT INTO inventory_logs (product_id, change, reason)
VALUES (123, -1, 'Sale transaction');
COMMIT;
```

## API Endpoints

### Products

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/products` | GET | List all products | All |
| `/api/products/{barcode}` | GET | Get product by barcode | All |
| `/api/products/{id}` | PUT | Update product | Manager |
| `/api/products` | POST | Create product | Manager |

### Transactions

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/transactions` | POST | Process sale | All |
| `/api/transactions` | GET | View history | Manager |
| `/api/inventory/alerts` | GET | Low stock alerts | Manager |

## Real-Time Sync Implementation

### WebSocket Server
```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
    });
    ws.on('close', () => console.log('Client disconnected'));
});
```

### Client Integration
```javascript
const socket = new WebSocket('ws://yourdomain.com:8080');

socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'inventory_update') {
        // Update UI with new stock levels
        updateProductDisplay(data.payload);
    }
});
```

## User Roles & Permissions

### Role Types
- **Employee**: Basic operations (view products, process sales)
- **Manager**: Full access (inventory management, reporting)

### Permission Middleware
```javascript
function authorize(requiredRole) {
    return (req, res, next) => {
        if (req.user.role !== requiredRole) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }
        next();
    };
}
```

## Automated Stock Alerts

### Alert Query
```sql
SELECT product_id, name, stock_quantity, low_stock_threshold
FROM products
WHERE stock_quantity <= low_stock_threshold;
```

### Alert Process
1. Background job runs alert query periodically
2. Alerts pushed to WebSocket clients
3. Dashboard updates in real-time
4. Managers notified of low stock items

## Integration Points

- WebSocket service maintains real-time UI updates
- Role-based middleware secures API endpoints
- Barcode scanning integrates with product lookup API
- Background jobs monitor stock levels
- Transaction processing updates inventory in real-time

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [WebSocket Best Practices](https://websockets.spec.whatwg.org/)
- [API Security Guidelines](https://owasp.org/www-project-api-security/)
```
