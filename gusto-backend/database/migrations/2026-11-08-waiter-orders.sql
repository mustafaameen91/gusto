-- Waiter orders: a waiter's tablet order waiting for the cashier, who turns it into a paid sale.
-- Existing databases: mysql gusto_db < database/migrations/2026-11-08-waiter-orders.sql
-- (schema.sql already contains this table for fresh installs). Safe to run more than once.
USE `gusto_db`;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `WaiterOrders` (
  `idWaiterOrder` int(11) NOT NULL AUTO_INCREMENT,
  `waiterId` int(11) NOT NULL,
  `tableNumber` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `items` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'JSON: [{menuItemId,itemSizeId,quantity,specialInstructions,itemName,sizeName,price}]',
  `status` enum('pending','accepted','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `orderId` int(11) DEFAULT NULL COMMENT 'the sale the cashier made from it',
  `handledBy` int(11) DEFAULT NULL,
  `handledAt` datetime DEFAULT NULL,
  `rejectReason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idWaiterOrder`),
  KEY `idx_waiter_orders_status` (`status`),
  KEY `idx_waiter_orders_waiter` (`waiterId`),
  KEY `fk_waiter_orders_order` (`orderId`),
  KEY `fk_waiter_orders_handled` (`handledBy`),
  CONSTRAINT `fk_waiter_orders_waiter` FOREIGN KEY (`waiterId`) REFERENCES `Staff` (`idStaff`),
  CONSTRAINT `fk_waiter_orders_order` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`idOrder`) ON DELETE SET NULL,
  CONSTRAINT `fk_waiter_orders_handled` FOREIGN KEY (`handledBy`) REFERENCES `Staff` (`idStaff`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
