-- ============================================================================
-- Gusto Restaurant — full database schema (fresh install)
--
-- Consolidates the original schema.sql plus every file in migrations/ and the
-- database/add-* / update-* scripts into one file, taken from the final
-- structure of the original system. Do NOT run the old migration files on top.
--
-- Run: mysql -u root -p < database/schema.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `gusto_db`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gusto_db`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `Accounts` (
  `idAccount` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accountType` enum('ASSET','LIABILITY','EQUITY','REVENUE','COGS','EXPENSE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `parentId` int(11) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idAccount`),
  UNIQUE KEY `uq_accounts_code` (`code`),
  KEY `idx_accounts_parent` (`parentId`),
  CONSTRAINT `fk_accounts_parent` FOREIGN KEY (`parentId`) REFERENCES `Accounts` (`idAccount`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `Categories` (
  `idCategory` int(11) NOT NULL AUTO_INCREMENT,
  `categoryName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `displayOrder` int(11) DEFAULT '0',
  `imageUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `isKitchen` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idCategory`),
  KEY `idx_order` (`displayOrder`),
  KEY `idx_active` (`isActive`),
  KEY `idx_isKitchen` (`isKitchen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `CustomerReceiptAllocations` (
  `idAllocation` bigint(20) NOT NULL AUTO_INCREMENT,
  `customerReceiptId` bigint(20) NOT NULL,
  `orderId` int(11) NOT NULL,
  `amountApplied` decimal(12,2) NOT NULL,
  PRIMARY KEY (`idAllocation`),
  KEY `idx_alloc_receipt` (`customerReceiptId`),
  KEY `idx_alloc_order` (`orderId`),
  CONSTRAINT `fk_alloc_order` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`idOrder`),
  CONSTRAINT `fk_alloc_receipt` FOREIGN KEY (`customerReceiptId`) REFERENCES `CustomerReceipts` (`idCustomerReceipt`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `CustomerReceipts` (
  `idCustomerReceipt` bigint(20) NOT NULL AUTO_INCREMENT,
  `customerId` int(11) NOT NULL,
  `receiptDate` datetime NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `paymentMethod` enum('cash','card','bank_transfer','wallet') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `dailyReceiptId` int(11) DEFAULT NULL,
  `recordedBy` int(11) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idCustomerReceipt`),
  KEY `idx_cr_customer` (`customerId`),
  KEY `idx_cr_date` (`receiptDate`),
  KEY `fk_cr_daily` (`dailyReceiptId`),
  KEY `fk_cr_staff` (`recordedBy`),
  CONSTRAINT `fk_cr_customer` FOREIGN KEY (`customerId`) REFERENCES `Customers` (`idCustomer`),
  CONSTRAINT `fk_cr_daily` FOREIGN KEY (`dailyReceiptId`) REFERENCES `DailyReceipts` (`idDailyReceipt`) ON DELETE SET NULL,
  CONSTRAINT `fk_cr_staff` FOREIGN KEY (`recordedBy`) REFERENCES `Staff` (`idStaff`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `Customers` (
  `idCustomer` int(11) NOT NULL AUTO_INCREMENT,
  `fullName` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creditLimit` decimal(12,2) DEFAULT '0.00',
  `initialDebt` decimal(12,2) DEFAULT '0.00',
  `dueDays` int(11) DEFAULT '0',
  `isActive` tinyint(1) DEFAULT '1',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idCustomer`),
  KEY `idx_customer_phone` (`phone`),
  KEY `idx_customer_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `DailyReceipts` (
  `idDailyReceipt` int(11) NOT NULL AUTO_INCREMENT,
  `receiptDate` date NOT NULL,
  `shiftNumber` int(11) DEFAULT '1' COMMENT 'Shift number for the day (1, 2, 3, etc.)',
  `openingCash` decimal(10,2) DEFAULT '0.00',
  `totalSales` decimal(10,2) DEFAULT '0.00',
  `totalExpenses` decimal(10,2) DEFAULT '0.00',
  `closingCash` decimal(10,2) DEFAULT '0.00',
  `expectedCash` decimal(10,2) DEFAULT '0.00',
  `discrepancy` decimal(10,2) DEFAULT '0.00' COMMENT 'closing - expected',
  `openedBy` int(11) DEFAULT NULL,
  `closedBy` int(11) DEFAULT NULL,
  `openedAt` timestamp NULL DEFAULT NULL,
  `closedAt` timestamp NULL DEFAULT NULL,
  `isClosed` tinyint(1) DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idDailyReceipt`),
  KEY `openedBy` (`openedBy`),
  KEY `closedBy` (`closedBy`),
  KEY `idx_date` (`receiptDate`),
  KEY `idx_closed` (`isClosed`),
  KEY `idx_receipt_date` (`receiptDate`),
  CONSTRAINT `dailyreceipts_ibfk_1` FOREIGN KEY (`openedBy`) REFERENCES `Staff` (`idStaff`) ON DELETE SET NULL,
  CONSTRAINT `dailyreceipts_ibfk_2` FOREIGN KEY (`closedBy`) REFERENCES `Staff` (`idStaff`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ExpenseCategories` (
  `idExpenseCategory` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `defaultAccountId` int(11) NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`idExpenseCategory`),
  UNIQUE KEY `uq_exp_cat_name` (`name`),
  KEY `fk_exp_cat_account` (`defaultAccountId`),
  CONSTRAINT `fk_exp_cat_account` FOREIGN KEY (`defaultAccountId`) REFERENCES `Accounts` (`idAccount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `Expenses` (
  `idExpense` int(11) NOT NULL AUTO_INCREMENT,
  `expenseDate` date NOT NULL,
  `expenseCategoryId` int(11) DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Supplies, Utilities, Maintenance, etc',
  `amount` decimal(10,2) NOT NULL,
  `paidFromAccountId` int(11) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `receiptNumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photoUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recordedBy` int(11) NOT NULL,
  `supplierId` int(11) DEFAULT NULL,
  `dailyReceiptId` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `journalEntryId` int(11) DEFAULT NULL,
  PRIMARY KEY (`idExpense`),
  KEY `dailyReceiptId` (`dailyReceiptId`),
  KEY `idx_date` (`expenseDate`),
  KEY `idx_category` (`category`),
  KEY `idx_recorded_by` (`recordedBy`),
  KEY `idx_expense_supplier` (`supplierId`),
  KEY `fk_expenses_cat` (`expenseCategoryId`),
  KEY `fk_expenses_paidfrom` (`paidFromAccountId`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`recordedBy`) REFERENCES `Staff` (`idStaff`),
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`dailyReceiptId`) REFERENCES `DailyReceipts` (`idDailyReceipt`) ON DELETE SET NULL,
  CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`supplierId`) REFERENCES `Suppliers` (`idSupplier`) ON DELETE SET NULL,
  CONSTRAINT `fk_expenses_cat` FOREIGN KEY (`expenseCategoryId`) REFERENCES `ExpenseCategories` (`idExpenseCategory`) ON DELETE SET NULL,
  CONSTRAINT `fk_expenses_paidfrom` FOREIGN KEY (`paidFromAccountId`) REFERENCES `Accounts` (`idAccount`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `FiscalPeriods` (
  `idPeriod` int(11) NOT NULL AUTO_INCREMENT,
  `year` smallint(6) NOT NULL,
  `month` tinyint(4) NOT NULL,
  `isClosed` tinyint(1) DEFAULT '0',
  `closedAt` timestamp NULL DEFAULT NULL,
  `closedBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`idPeriod`),
  UNIQUE KEY `uq_period` (`year`,`month`),
  KEY `idx_period_closed` (`isClosed`),
  KEY `fk_period_closedby` (`closedBy`),
  CONSTRAINT `fk_period_closedby` FOREIGN KEY (`closedBy`) REFERENCES `Staff` (`idStaff`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `IngredientStock` (
  `idIngredientStock` int(11) NOT NULL AUTO_INCREMENT,
  `ingredientId` int(11) NOT NULL,
  `locationId` int(11) NOT NULL,
  `quantity` decimal(12,3) NOT NULL DEFAULT '0.000',
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idIngredientStock`),
  UNIQUE KEY `uk_ingredient_location` (`ingredientId`,`locationId`),
  KEY `idx_location` (`locationId`),
  CONSTRAINT `fk_is_ingredient` FOREIGN KEY (`ingredientId`) REFERENCES `Ingredients` (`idIngredient`) ON DELETE CASCADE,
  CONSTRAINT `fk_is_location` FOREIGN KEY (`locationId`) REFERENCES `StorageLocations` (`idStorageLocation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `Ingredients` (
  `idIngredient` int(11) NOT NULL AUTO_INCREMENT,
  `ingredientName` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'kg, liter, piece, gram, ml',
  `currentStock` decimal(10,3) DEFAULT '0.000',
  `minStock` decimal(10,3) DEFAULT '0.000',
  `maxStock` decimal(10,3) DEFAULT '0.000',
  `costPerUnit` decimal(10,2) DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idIngredient`),
  KEY `idx_stock` (`currentStock`),
  KEY `idx_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `InventoryTransactions` (
  `idTransaction` int(11) NOT NULL AUTO_INCREMENT,
  `ingredientId` int(11) NOT NULL,
  `transactionType` enum('purchase','usage','adjustment','waste') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,3) NOT NULL COMMENT 'positive for add, negative for subtract',
  `costPerUnit` decimal(10,2) DEFAULT NULL,
  `totalCost` decimal(10,2) DEFAULT NULL,
  `orderId` int(11) DEFAULT NULL COMMENT 'if auto-deducted from order',
  `dailyReceiptId` int(11) DEFAULT NULL COMMENT 'shift whose cost of goods this belongs to',
  `transactionDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `recordedBy` int(11) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`idTransaction`),
  KEY `recordedBy` (`recordedBy`),
  KEY `idx_ingredient` (`ingredientId`),
  KEY `idx_type` (`transactionType`),
  KEY `idx_order` (`orderId`),
  KEY `idx_it_shift` (`dailyReceiptId`),
  KEY `idx_date` (`transactionDate`),
  CONSTRAINT `inventorytransactions_ibfk_1` FOREIGN KEY (`ingredientId`) REFERENCES `Ingredients` (`idIngredient`),
  CONSTRAINT `inventorytransactions_ibfk_2` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`idOrder`) ON DELETE SET NULL,
  CONSTRAINT `inventorytransactions_ibfk_3` FOREIGN KEY (`recordedBy`) REFERENCES `Staff` (`idStaff`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ItemSizes` (
  `idItemSize` int(11) NOT NULL AUTO_INCREMENT,
  `menuItemId` int(11) NOT NULL,
  `sizeName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Small, Medium, Large',
  `priceAdjustment` decimal(10,2) DEFAULT '0.00' COMMENT 'added to base price',
  `isDefault` tinyint(1) DEFAULT '0',
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idItemSize`),
  KEY `idx_menu_item` (`menuItemId`),
  KEY `idx_default` (`isDefault`),
  CONSTRAINT `itemsizes_ibfk_1` FOREIGN KEY (`menuItemId`) REFERENCES `MenuItems` (`idMenuItem`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `JournalEntries` (
  `idJournalEntry` bigint(20) NOT NULL AUTO_INCREMENT,
  `entryDate` datetime NOT NULL,
  `periodId` int(11) DEFAULT NULL,
  `dailyReceiptId` int(11) DEFAULT NULL,
  `sourceType` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'e.g. SHIFT_POST, EXPENSE, OTHER',
  `sourceId` bigint(20) DEFAULT NULL,
  `status` enum('DRAFT','POSTED','REVERSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `memo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `postedBy` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `postedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idJournalEntry`),
  KEY `idx_journal_status` (`status`),
  KEY `idx_journal_date` (`entryDate`),
  KEY `idx_journal_daily` (`dailyReceiptId`),
  KEY `idx_journal_source` (`sourceType`,`sourceId`),
  KEY `fk_journal_period` (`periodId`),
  KEY `fk_journal_createdby` (`createdBy`),
  KEY `fk_journal_postedby` (`postedBy`),
  CONSTRAINT `fk_journal_createdby` FOREIGN KEY (`createdBy`) REFERENCES `Staff` (`idStaff`) ON DELETE SET NULL,
  CONSTRAINT `fk_journal_daily` FOREIGN KEY (`dailyReceiptId`) REFERENCES `DailyReceipts` (`idDailyReceipt`) ON DELETE SET NULL,
  CONSTRAINT `fk_journal_period` FOREIGN KEY (`periodId`) REFERENCES `FiscalPeriods` (`idPeriod`) ON DELETE SET NULL,
  CONSTRAINT `fk_journal_postedby` FOREIGN KEY (`postedBy`) REFERENCES `Staff` (`idStaff`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `JournalLines` (
  `idJournalLine` bigint(20) NOT NULL AUTO_INCREMENT,
  `journalEntryId` bigint(20) NOT NULL,
  `accountId` int(11) NOT NULL,
  `debit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `credit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `lineMemo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refType` enum('ORDER','PAYMENT','PURCHASE','EXPENSE','CUSTOMER_RECEIPT','SUPPLIER_PAYMENT','INVENTORY_TX') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refId` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`idJournalLine`),
  KEY `idx_lines_journal` (`journalEntryId`),
  KEY `idx_lines_account` (`accountId`),
  CONSTRAINT `fk_lines_account` FOREIGN KEY (`accountId`) REFERENCES `Accounts` (`idAccount`),
  CONSTRAINT `fk_lines_journal` FOREIGN KEY (`journalEntryId`) REFERENCES `JournalEntries` (`idJournalEntry`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `KitchenItemStock` (
  `idKitchenItemStock` int(11) NOT NULL AUTO_INCREMENT,
  `menuItemId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idKitchenItemStock`),
  UNIQUE KEY `uk_menu_item` (`menuItemId`),
  CONSTRAINT `fk_kis_menu_item` FOREIGN KEY (`menuItemId`) REFERENCES `MenuItems` (`idMenuItem`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `MenuItems` (
  `idMenuItem` int(11) NOT NULL AUTO_INCREMENT,
  `categoryId` int(11) NOT NULL,
  `itemName` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `basePrice` decimal(10,2) NOT NULL,
  `imageUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preparationTime` int(11) DEFAULT '0' COMMENT 'in minutes',
  `itemType` enum('recipe','harmony') COLLATE utf8mb4_unicode_ci DEFAULT 'recipe' COMMENT 'recipe=has ingredients, harmony=manual inventory',
  `isInventoryItem` tinyint(1) DEFAULT '0' COMMENT 'for harmony items in inventory',
  `isAvailable` tinyint(1) DEFAULT '1',
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idMenuItem`),
  KEY `idx_category` (`categoryId`),
  KEY `idx_type` (`itemType`),
  KEY `idx_available` (`isAvailable`),
  KEY `idx_active` (`isActive`),
  CONSTRAINT `menuitems_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `Categories` (`idCategory`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `OrderItems` (
  `idOrderItem` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) NOT NULL,
  `menuItemId` int(11) NOT NULL,
  `itemSizeId` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL COMMENT 'price at time of order',
  `specialInstructions` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','preparing','ready','completed','cancelled','returned') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `preparedAt` timestamp NULL DEFAULT NULL,
  `completedAt` timestamp NULL DEFAULT NULL,
  `cancelledAt` timestamp NULL DEFAULT NULL,
  `preparedBy` int(11) DEFAULT NULL COMMENT 'FK to Staff - who prepared this item',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idOrderItem`),
  KEY `itemSizeId` (`itemSizeId`),
  KEY `idx_order` (`orderId`),
  KEY `idx_menu_item` (`menuItemId`),
  KEY `fk_orderitem_preparedby` (`preparedBy`),
  KEY `idx_orderitem_status` (`status`),
  KEY `idx_orderitem_order_status` (`orderId`,`status`),
  CONSTRAINT `fk_orderitem_preparedby` FOREIGN KEY (`preparedBy`) REFERENCES `Staff` (`idStaff`) ON DELETE SET NULL,
  CONSTRAINT `orderitems_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`idOrder`) ON DELETE CASCADE,
  CONSTRAINT `orderitems_ibfk_2` FOREIGN KEY (`menuItemId`) REFERENCES `MenuItems` (`idMenuItem`),
  CONSTRAINT `orderitems_ibfk_3` FOREIGN KEY (`itemSizeId`) REFERENCES `ItemSizes` (`idItemSize`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `OrderReturnItems` (
  `idOrderReturnItem` int(11) NOT NULL AUTO_INCREMENT,
  `orderReturnId` int(11) NOT NULL,
  `orderItemId` int(11) DEFAULT NULL,
  `menuItemId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '1',
  `refundAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `disposition` enum('wasted','returned_to_stock') NOT NULL DEFAULT 'wasted',
  `replacementMenuItemId` int(11) DEFAULT NULL,
  `replacementItemSizeId` int(11) DEFAULT NULL,
  `replacementQuantity` int(11) DEFAULT NULL,
  `replacementPrice` decimal(14,2) DEFAULT NULL,
  PRIMARY KEY (`idOrderReturnItem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS `OrderReturns` (
  `idOrderReturn` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) NOT NULL,
  `returnDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processedBy` int(11) DEFAULT NULL,
  `returnType` enum('refund','exchange','waste') NOT NULL DEFAULT 'refund',
  `refundMethod` enum('cash','credit') NOT NULL DEFAULT 'cash',
  `customerId` int(11) DEFAULT NULL,
  `totalRefundAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `notes` text,
  `dailyReceiptId` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idOrderReturn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS `Orders` (
  `idOrder` int(11) NOT NULL AUTO_INCREMENT,
  `orderNumber` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderType` enum('cashier','qr','card') COLLATE utf8mb4_unicode_ci DEFAULT 'cashier',
  `tableNumber` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerId` int(11) DEFAULT NULL,
  `customerName` varchar(220) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerPhone` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `saleType` enum('cash','drive_through','credit','in_dine') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `dailyReceiptId` int(11) DEFAULT NULL,
  `postedJournalEntryId` bigint(20) DEFAULT NULL,
  `status` enum('pending','preparing','ready','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `totalAmount` decimal(10,2) NOT NULL,
  `cashierId` int(11) DEFAULT NULL,
  `discount` decimal(10,2) NOT NULL,
  `discountType` enum('amount','percentage') COLLATE utf8mb4_unicode_ci DEFAULT 'amount',
  `orderDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `preparedAt` timestamp NULL DEFAULT NULL,
  `completedAt` timestamp NULL DEFAULT NULL,
  `cancelledAt` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`idOrder`),
  UNIQUE KEY `orderNumber` (`orderNumber`),
  KEY `idx_order_number` (`orderNumber`),
  KEY `idx_status` (`status`),
  KEY `idx_cashier` (`cashierId`),
  KEY `idx_date` (`orderDate`),
  KEY `fk_orders_customer` (`customerId`),
  KEY `fk_orders_daily` (`dailyReceiptId`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customerId`) REFERENCES `Customers` (`idCustomer`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_daily` FOREIGN KEY (`dailyReceiptId`) REFERENCES `DailyReceipts` (`idDailyReceipt`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`cashierId`) REFERENCES `Staff` (`idStaff`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `OtherIncomes` (
  `idOtherIncome` int(11) NOT NULL AUTO_INCREMENT,
  `incomeDate` date NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `incomeAccountId` int(11) NOT NULL COMMENT 'FK to Accounts — نوع الإيراد من دليل الحسابات (إيرادات)',
  `paymentMethod` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash' COMMENT 'cash = صندوق, bank = بنك',
  `dailyReceiptId` int(11) DEFAULT NULL,
  `recordedBy` int(11) DEFAULT NULL,
  `notes` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idOtherIncome`),
  KEY `idx_oi_date` (`incomeDate`),
  KEY `idx_oi_daily` (`dailyReceiptId`),
  KEY `idx_oi_account` (`incomeAccountId`),
  CONSTRAINT `fk_oi_daily` FOREIGN KEY (`dailyReceiptId`) REFERENCES `DailyReceipts` (`idDailyReceipt`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='إيرادات خارجية — مرتبطة بنوع الحساب (إيرادات) من دليل الحسابات';
CREATE TABLE IF NOT EXISTS `Payments` (
  `idPayment` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) NOT NULL,
  `cashierId` int(11) NOT NULL,
  `paymentMethod` enum('cash','card','bank_transfer','wallet') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `amountReceived` decimal(10,2) NOT NULL,
  `changeDue` decimal(10,2) DEFAULT '0.00',
  `paymentDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `receiptNumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`idPayment`),
  UNIQUE KEY `receiptNumber` (`receiptNumber`),
  KEY `idx_order` (`orderId`),
  KEY `idx_cashier` (`cashierId`),
  KEY `idx_date` (`paymentDate`),
  KEY `idx_receipt` (`receiptNumber`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`idOrder`),
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`cashierId`) REFERENCES `Staff` (`idStaff`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `PostingSettings` (
  `idPosting` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `cashAccountId` int(11) NOT NULL,
  `bankAccountId` int(11) DEFAULT NULL,
  `arAccountId` int(11) NOT NULL,
  `apAccountId` int(11) NOT NULL,
  `inventoryAccountId` int(11) NOT NULL,
  `cogsAccountId` int(11) NOT NULL,
  `wastageAccountId` int(11) NOT NULL,
  `salesBeveragesAccountId` int(11) NOT NULL,
  `salesDessertsAccountId` int(11) NOT NULL,
  `tipsAccountId` int(11) DEFAULT NULL,
  `otherIncomeAccountId` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idPosting`),
  UNIQUE KEY `uq_posting_name` (`name`),
  KEY `fk_post_cash` (`cashAccountId`),
  KEY `fk_post_bank` (`bankAccountId`),
  KEY `fk_post_ar` (`arAccountId`),
  KEY `fk_post_ap` (`apAccountId`),
  KEY `fk_post_inv` (`inventoryAccountId`),
  KEY `fk_post_cogs` (`cogsAccountId`),
  KEY `fk_post_waste` (`wastageAccountId`),
  KEY `fk_post_salesb` (`salesBeveragesAccountId`),
  KEY `fk_post_salesd` (`salesDessertsAccountId`),
  KEY `fk_post_tips` (`tipsAccountId`),
  CONSTRAINT `fk_post_ap` FOREIGN KEY (`apAccountId`) REFERENCES `Accounts` (`idAccount`),
  CONSTRAINT `fk_post_ar` FOREIGN KEY (`arAccountId`) REFERENCES `Accounts` (`idAccount`),
  CONSTRAINT `fk_post_bank` FOREIGN KEY (`bankAccountId`) REFERENCES `Accounts` (`idAccount`),
  CONSTRAINT `fk_post_cash` FOREIGN KEY (`cashAccountId`) REFERENCES `Accounts` (`idAccount`),
  CONSTRAINT `fk_post_cogs` FOREIGN KEY (`cogsAccountId`) REFERENCES `Accounts` (`idAccount`),
  CONSTRAINT `fk_post_inv` FOREIGN KEY (`inventoryAccountId`) REFERENCES `Accounts` (`idAccount`),
  CONSTRAINT `fk_post_salesb` FOREIGN KEY (`salesBeveragesAccountId`) REFERENCES `Accounts` (`idAccount`),
  CONSTRAINT `fk_post_salesd` FOREIGN KEY (`salesDessertsAccountId`) REFERENCES `Accounts` (`idAccount`),
  CONSTRAINT `fk_post_tips` FOREIGN KEY (`tipsAccountId`) REFERENCES `Accounts` (`idAccount`),
  CONSTRAINT `fk_post_waste` FOREIGN KEY (`wastageAccountId`) REFERENCES `Accounts` (`idAccount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `PurchaseItems` (
  `idPurchaseItem` int(11) NOT NULL AUTO_INCREMENT,
  `purchaseId` int(11) NOT NULL COMMENT 'رقم أمر الشراء',
  `ingredientId` int(11) NOT NULL COMMENT 'المكون',
  `orderedQuantity` decimal(10,3) NOT NULL COMMENT 'الكمية المطلوبة',
  `receivedQuantity` decimal(10,3) DEFAULT '0.000' COMMENT 'الكمية المستلمة',
  `unitPrice` decimal(10,2) NOT NULL COMMENT 'سعر الوحدة',
  `totalPrice` decimal(10,2) GENERATED ALWAYS AS ((`orderedQuantity` * `unitPrice`)) STORED COMMENT 'السعر الإجمالي',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT 'ملاحظات',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idPurchaseItem`),
  KEY `idx_purchase_id` (`purchaseId`),
  KEY `idx_ingredient_id` (`ingredientId`),
  CONSTRAINT `purchaseitems_ibfk_1` FOREIGN KEY (`purchaseId`) REFERENCES `Purchases` (`idPurchase`) ON DELETE CASCADE,
  CONSTRAINT `purchaseitems_ibfk_2` FOREIGN KEY (`ingredientId`) REFERENCES `Ingredients` (`idIngredient`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول أصناف أوامر الشراء';
CREATE TABLE IF NOT EXISTS `Purchases` (
  `idPurchase` int(11) NOT NULL AUTO_INCREMENT,
  `purchaseNumber` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'رقم أمر الشراء',
  `supplierName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'اسم المورد',
  `supplierPhone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'هاتف المورد',
  `supplierId` int(11) DEFAULT NULL,
  `totalAmount` decimal(10,2) DEFAULT '0.00' COMMENT 'المبلغ الإجمالي',
  `purchaseDate` date NOT NULL COMMENT 'تاريخ الطلب',
  `expectedDeliveryDate` date DEFAULT NULL COMMENT 'تاريخ التسليم المتوقع',
  `status` enum('pending','partially_received','received','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT 'الحالة',
  `paymentType` enum('cash','credit') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'credit' COMMENT 'cash = pay now, credit = pay later',
  `createdBy` int(11) DEFAULT NULL COMMENT 'من أنشأ الطلب',
  `receivedBy` int(11) DEFAULT NULL COMMENT 'من استلم الطلب',
  `receivedAt` datetime DEFAULT NULL COMMENT 'وقت الاستلام',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT 'ملاحظات',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idPurchase`),
  UNIQUE KEY `purchaseNumber` (`purchaseNumber`),
  KEY `createdBy` (`createdBy`),
  KEY `receivedBy` (`receivedBy`),
  KEY `idx_purchase_number` (`purchaseNumber`),
  KEY `idx_status` (`status`),
  KEY `idx_purchase_date` (`purchaseDate`),
  KEY `idx_purchase_supplier` (`supplierId`),
  CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `Staff` (`idStaff`) ON DELETE SET NULL,
  CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`receivedBy`) REFERENCES `Staff` (`idStaff`) ON DELETE SET NULL,
  CONSTRAINT `purchases_ibfk_3` FOREIGN KEY (`supplierId`) REFERENCES `Suppliers` (`idSupplier`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول أوامر الشراء';
CREATE TABLE IF NOT EXISTS `Recipes` (
  `idRecipe` int(11) NOT NULL AUTO_INCREMENT,
  `menuItemId` int(11) NOT NULL,
  `sizeId` int(11) DEFAULT NULL COMMENT 'NULL=base recipe, or specific size ID',
  `ingredientId` int(11) NOT NULL,
  `quantityNeeded` decimal(10,3) NOT NULL COMMENT 'amount needed per serving',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idRecipe`),
  UNIQUE KEY `unique_recipe` (`menuItemId`,`ingredientId`,`sizeId`),
  KEY `idx_menu_item` (`menuItemId`),
  KEY `idx_ingredient` (`ingredientId`),
  KEY `idx_size` (`sizeId`),
  CONSTRAINT `recipes_ibfk_1` FOREIGN KEY (`menuItemId`) REFERENCES `MenuItems` (`idMenuItem`) ON DELETE CASCADE,
  CONSTRAINT `recipes_ibfk_2` FOREIGN KEY (`ingredientId`) REFERENCES `Ingredients` (`idIngredient`),
  CONSTRAINT `recipes_ibfk_3` FOREIGN KEY (`sizeId`) REFERENCES `ItemSizes` (`idItemSize`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ShiftCashCounts` (
  `idShiftCashCount` int(11) NOT NULL AUTO_INCREMENT,
  `dailyReceiptId` int(11) NOT NULL,
  `denomination` decimal(12,2) NOT NULL COMMENT 'e.g. 250, 500, 1000, 5000, 10000, 25000, 50000',
  `quantity` int(11) NOT NULL DEFAULT '0',
  `lineTotal` decimal(12,2) GENERATED ALWAYS AS ((`denomination` * `quantity`)) STORED,
  PRIMARY KEY (`idShiftCashCount`),
  KEY `idx_shift_cash_daily` (`dailyReceiptId`),
  CONSTRAINT `fk_shiftcash_daily` FOREIGN KEY (`dailyReceiptId`) REFERENCES `DailyReceipts` (`idDailyReceipt`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='عد العملات عند إقفال الشفت (فئات: ٢٥٠، ٥٠٠، ١٠٠٠، ...)';
CREATE TABLE IF NOT EXISTS `Staff` (
  `idStaff` int(11) NOT NULL AUTO_INCREMENT,
  `fullName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','cashier','kitchen','waiter','purchases','storage','supervisor') COLLATE utf8mb4_unicode_ci DEFAULT 'cashier',
  `hireDate` date NOT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `lastLogin` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idStaff`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `StorageLocations` (
  `idStorageLocation` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'main, kitchen_internal',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idStorageLocation`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `SupplierCredits` (
  `idCredit` int(11) NOT NULL AUTO_INCREMENT,
  `supplierId` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `creditDate` date NOT NULL,
  `creditType` enum('return','credit','advance','refund','other') COLLATE utf8mb4_unicode_ci DEFAULT 'credit',
  `description` text COLLATE utf8mb4_unicode_ci,
  `purchaseId` int(11) DEFAULT NULL,
  `recordedBy` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idCredit`),
  KEY `purchaseId` (`purchaseId`),
  KEY `recordedBy` (`recordedBy`),
  KEY `idx_supplier_credit` (`supplierId`),
  KEY `idx_credit_date` (`creditDate`),
  CONSTRAINT `suppliercredits_ibfk_1` FOREIGN KEY (`supplierId`) REFERENCES `Suppliers` (`idSupplier`) ON DELETE CASCADE,
  CONSTRAINT `suppliercredits_ibfk_2` FOREIGN KEY (`purchaseId`) REFERENCES `Purchases` (`idPurchase`) ON DELETE SET NULL,
  CONSTRAINT `suppliercredits_ibfk_3` FOREIGN KEY (`recordedBy`) REFERENCES `Staff` (`idStaff`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `SupplierPayments` (
  `idPayment` int(11) NOT NULL AUTO_INCREMENT,
  `supplierId` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paymentDate` date NOT NULL,
  `paymentMethod` enum('cash','bank_transfer','check') COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `paidFromAccountId` int(11) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `recordedBy` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idPayment`),
  KEY `recordedBy` (`recordedBy`),
  KEY `idx_supplier_payment` (`supplierId`),
  KEY `idx_payment_date` (`paymentDate`),
  KEY `fk_supplierpayments_paidfrom` (`paidFromAccountId`),
  CONSTRAINT `fk_supplierpayments_paidfrom` FOREIGN KEY (`paidFromAccountId`) REFERENCES `Accounts` (`idAccount`) ON DELETE SET NULL,
  CONSTRAINT `supplierpayments_ibfk_1` FOREIGN KEY (`supplierId`) REFERENCES `Suppliers` (`idSupplier`) ON DELETE CASCADE,
  CONSTRAINT `supplierpayments_ibfk_2` FOREIGN KEY (`recordedBy`) REFERENCES `Staff` (`idStaff`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `SupplierServiceInvoiceItems` (
  `idSupplierServiceInvoiceItem` int(11) NOT NULL AUTO_INCREMENT,
  `invoiceId` int(11) NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'اسم الخدمة أو الوصف (تنظيف، صيانة، ماء، ...)',
  `amount` decimal(14,2) NOT NULL,
  PRIMARY KEY (`idSupplierServiceInvoiceItem`),
  KEY `idx_ssii_invoice` (`invoiceId`),
  CONSTRAINT `fk_ssii_invoice` FOREIGN KEY (`invoiceId`) REFERENCES `SupplierServiceInvoices` (`idSupplierServiceInvoice`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='بنود فاتورة الخدمات — خدمة واحدة في كل سطر';
CREATE TABLE IF NOT EXISTS `SupplierServiceInvoices` (
  `idSupplierServiceInvoice` int(11) NOT NULL AUTO_INCREMENT,
  `supplierId` int(11) NOT NULL,
  `invoiceDate` date NOT NULL,
  `dueDate` date DEFAULT NULL,
  `notes` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`idSupplierServiceInvoice`),
  KEY `idx_ssi_supplier` (`supplierId`),
  CONSTRAINT `fk_ssi_supplier` FOREIGN KEY (`supplierId`) REFERENCES `Suppliers` (`idSupplier`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='فاتورة خدمات لمورد — رأس الفاتورة (يمكن أن تحتوي عدة خدمات)';
CREATE TABLE IF NOT EXISTS `SupplierTransfers` (
  `idSupplierTransfer` int(11) NOT NULL AUTO_INCREMENT,
  `fromSupplierId` int(11) NOT NULL,
  `toSupplierId` int(11) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `transferDate` date NOT NULL,
  `notes` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recordedBy` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idSupplierTransfer`),
  KEY `idx_st_from` (`fromSupplierId`),
  KEY `idx_st_to` (`toSupplierId`),
  KEY `idx_st_date` (`transferDate`),
  CONSTRAINT `fk_st_from` FOREIGN KEY (`fromSupplierId`) REFERENCES `Suppliers` (`idSupplier`),
  CONSTRAINT `fk_st_to` FOREIGN KEY (`toSupplierId`) REFERENCES `Suppliers` (`idSupplier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `Suppliers` (
  `idSupplier` int(11) NOT NULL AUTO_INCREMENT,
  `supplierName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierPhone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplierAddress` text COLLATE utf8mb4_unicode_ci,
  `initialDebt` decimal(10,2) DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idSupplier`),
  KEY `idx_supplier_name` (`supplierName`),
  KEY `idx_supplier_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `Tips` (
  `idTip` int(11) NOT NULL AUTO_INCREMENT,
  `tipDate` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `accountId` int(11) DEFAULT NULL,
  `orderId` int(11) DEFAULT NULL,
  `dailyReceiptId` int(11) DEFAULT NULL COMMENT 'shift the tip was taken in',
  `recordedBy` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idTip`),
  KEY `recordedBy` (`recordedBy`),
  KEY `idx_tip_date` (`tipDate`),
  KEY `idx_tip_order` (`orderId`),
  KEY `fk_tips_account` (`accountId`),
  CONSTRAINT `fk_tips_account` FOREIGN KEY (`accountId`) REFERENCES `Accounts` (`idAccount`) ON DELETE SET NULL,
  CONSTRAINT `tips_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`idOrder`) ON DELETE SET NULL,
  CONSTRAINT `tips_ibfk_2` FOREIGN KEY (`recordedBy`) REFERENCES `Staff` (`idStaff`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `Transfers` (
  `idTransfer` int(11) NOT NULL AUTO_INCREMENT,
  `fromLocationId` int(11) NOT NULL,
  `toLocationId` int(11) NOT NULL,
  `ingredientId` int(11) NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `transferredBy` int(11) DEFAULT NULL,
  `transferredAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`idTransfer`),
  KEY `idx_from` (`fromLocationId`),
  KEY `idx_to` (`toLocationId`),
  KEY `idx_ingredient` (`ingredientId`),
  KEY `idx_date` (`transferredAt`),
  KEY `fk_t_staff` (`transferredBy`),
  CONSTRAINT `fk_t_from` FOREIGN KEY (`fromLocationId`) REFERENCES `StorageLocations` (`idStorageLocation`),
  CONSTRAINT `fk_t_ingredient` FOREIGN KEY (`ingredientId`) REFERENCES `Ingredients` (`idIngredient`),
  CONSTRAINT `fk_t_staff` FOREIGN KEY (`transferredBy`) REFERENCES `Staff` (`idStaff`) ON DELETE SET NULL,
  CONSTRAINT `fk_t_to` FOREIGN KEY (`toLocationId`) REFERENCES `StorageLocations` (`idStorageLocation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SETUP DATA (chart of accounts, posting settings, expense categories, storage)
-- Restaurant: 4101 = drinks sales, 4102 = food sales.
-- ============================================================================

INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (1,'1000','الأصول','ASSET',NULL,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (2,'2000','الخصوم','LIABILITY',NULL,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (3,'3000','حقوق الملكية','EQUITY',NULL,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (4,'4000','الإيرادات','REVENUE',NULL,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (5,'5000','تكلفة المبيعات','COGS',NULL,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (6,'6000','مصاريف تشغيلية','EXPENSE',NULL,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (7,'1100','الأصول المتداولة','ASSET',1,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (8,'1200','الذمم المدينة','ASSET',1,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (9,'1300','المخزون','ASSET',1,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (10,'2100','الذمم الدائنة','LIABILITY',2,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (11,'2200','مصاريف مستحقة','LIABILITY',2,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (12,'4100','إيرادات المبيعات','REVENUE',4,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (13,'1101','الصندوق','ASSET',7,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (14,'1102','البنك','ASSET',7,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (15,'1201','ذمم مدينة - عملاء آجِل','ASSET',8,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (16,'1301','مخزون مواد أولية','ASSET',9,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (17,'1302','مخزون مواد تعبئة/استهلاكية','ASSET',9,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (18,'2101','ذمم دائنة - موردين','LIABILITY',10,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (19,'2201','مصاريف مستحقة','LIABILITY',11,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (20,'4101','إيرادات مبيعات المشروبات','REVENUE',12,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (21,'4102','إيرادات مبيعات المأكولات','REVENUE',12,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (22,'5101','تكلفة المبيعات - مواد','COGS',5,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (23,'5103','هدر/تالف مخزون','COGS',5,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (24,'6101','إيجار','EXPENSE',6,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (25,'6102','كهرباء','EXPENSE',6,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (26,'6103','ماء','EXPENSE',6,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (27,'6104','إنترنت','EXPENSE',6,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (28,'6105','منظفات','EXPENSE',6,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (29,'6106','صيانة','EXPENSE',6,1,NOW(),NOW());
INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (30,'6108','مصاريف تشغيلية أخرى','EXPENSE',6,1,NOW(),NOW());

INSERT IGNORE INTO `Accounts` (`idAccount`, `code`, `name`, `accountType`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES (31,'2300','إكراميات مستحقة للموظفين','LIABILITY',2,1,NOW(),NOW());

INSERT IGNORE INTO `PostingSettings` (`idPosting`, `name`, `cashAccountId`, `bankAccountId`, `arAccountId`, `apAccountId`, `inventoryAccountId`, `cogsAccountId`, `wastageAccountId`, `salesBeveragesAccountId`, `salesDessertsAccountId`, `tipsAccountId`, `createdAt`) VALUES (1,'default',13,14,15,18,16,22,23,20,21,31,NOW());

INSERT IGNORE INTO `ExpenseCategories` (`idExpenseCategory`, `name`, `defaultAccountId`, `isActive`) VALUES (1,'ايجار',24,1);
INSERT IGNORE INTO `ExpenseCategories` (`idExpenseCategory`, `name`, `defaultAccountId`, `isActive`) VALUES (2,'كهرباء',25,1);
INSERT IGNORE INTO `ExpenseCategories` (`idExpenseCategory`, `name`, `defaultAccountId`, `isActive`) VALUES (3,'ماء',26,1);
INSERT IGNORE INTO `ExpenseCategories` (`idExpenseCategory`, `name`, `defaultAccountId`, `isActive`) VALUES (4,'انترنت',27,1);
INSERT IGNORE INTO `ExpenseCategories` (`idExpenseCategory`, `name`, `defaultAccountId`, `isActive`) VALUES (5,'تنظيف',28,1);
INSERT IGNORE INTO `ExpenseCategories` (`idExpenseCategory`, `name`, `defaultAccountId`, `isActive`) VALUES (6,'صيانه',29,1);
INSERT IGNORE INTO `ExpenseCategories` (`idExpenseCategory`, `name`, `defaultAccountId`, `isActive`) VALUES (7,'اخرى',30,1);

INSERT IGNORE INTO `StorageLocations` (`idStorageLocation`, `name`, `code`, `isActive`, `createdAt`) VALUES (1,'المخزن الرئيسي','main',1,NOW());
INSERT IGNORE INTO `StorageLocations` (`idStorageLocation`, `name`, `code`, `isActive`, `createdAt`) VALUES (2,'مخزن المطبخ (داخلي)','kitchen_internal',1,NOW());

-- Default admin user — email: admin@gusto.com, password: admin123
-- CHANGE THIS PASSWORD after first login.
INSERT INTO `Staff` (`fullName`, `email`, `phone`, `password`, `role`, `hireDate`, `salary`, `isActive`)
SELECT 'Admin', 'admin@gusto.com', '0000000000', '$2a$10$BraWD4Yj.HqClNMEPPbRdughi70PqAy0RN4b/szvv6LQ8E9vFHBMS', 'admin', CURDATE(), 0, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Staff` WHERE `email` = 'admin@gusto.com');

-- Starter restaurant categories (isKitchen = 1 sends items to the kitchen screen)
INSERT INTO `Categories` (`categoryName`, `description`, `displayOrder`, `isActive`, `isKitchen`)
SELECT * FROM (
  SELECT 'مقبلات' AS categoryName, 'Appetizers' AS description, 1 AS displayOrder, 1 AS isActive, 1 AS isKitchen
  UNION ALL SELECT 'سلطات', 'Salads', 2, 1, 1
  UNION ALL SELECT 'أطباق رئيسية', 'Main dishes', 3, 1, 1
  UNION ALL SELECT 'مشويات', 'Grills', 4, 1, 1
  UNION ALL SELECT 'حلويات', 'Desserts', 5, 1, 1
  UNION ALL SELECT 'مشروبات', 'Drinks', 6, 1, 0
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM `Categories`);

SET FOREIGN_KEY_CHECKS = 1;
