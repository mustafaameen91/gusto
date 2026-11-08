-- ============================================================================
-- Gusto Restaurant — TEST DATA (for local testing only, do not load in production)
--
-- Run AFTER schema.sql:  mysql -u root -p < database/seed-test-data.sql
-- Safe to run more than once: every row is skipped if it already exists.
--
-- Logins (password for all test staff: 123456)
--   admin@gusto.com / admin123 (created by schema.sql)

--   supervisor@gusto.com     supervisor
--   cashier@gusto.com        cashier
--   kitchen@gusto.com        kitchen
--   waiter@gusto.com         waiter
--   purchases@gusto.com      purchases
--   storage@gusto.com        storage
-- ============================================================================

USE `gusto_db`;
SET NAMES utf8mb4;

-- Staff -------------------------------------------------------------------
INSERT INTO `Staff` (`fullName`, `email`, `phone`, `password`, `role`, `hireDate`, `salary`, `isActive`)
SELECT 'مدير الصالة', 'supervisor@gusto.com', '07700000002', '$2a$10$IosieKTRjSMhqng3iHat2OmoExS/8CeZhhVh6HtUyewwaNaxoFGq.', 'supervisor', CURDATE(), 900000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Staff` WHERE `email` = 'supervisor@gusto.com');
INSERT INTO `Staff` (`fullName`, `email`, `phone`, `password`, `role`, `hireDate`, `salary`, `isActive`)
SELECT 'الكاشير', 'cashier@gusto.com', '07700000003', '$2a$10$IosieKTRjSMhqng3iHat2OmoExS/8CeZhhVh6HtUyewwaNaxoFGq.', 'cashier', CURDATE(), 700000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Staff` WHERE `email` = 'cashier@gusto.com');
INSERT INTO `Staff` (`fullName`, `email`, `phone`, `password`, `role`, `hireDate`, `salary`, `isActive`)
SELECT 'الشيف', 'kitchen@gusto.com', '07700000004', '$2a$10$IosieKTRjSMhqng3iHat2OmoExS/8CeZhhVh6HtUyewwaNaxoFGq.', 'kitchen', CURDATE(), 900000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Staff` WHERE `email` = 'kitchen@gusto.com');
INSERT INTO `Staff` (`fullName`, `email`, `phone`, `password`, `role`, `hireDate`, `salary`, `isActive`)
SELECT 'النادل', 'waiter@gusto.com', '07700000005', '$2a$10$IosieKTRjSMhqng3iHat2OmoExS/8CeZhhVh6HtUyewwaNaxoFGq.', 'waiter', CURDATE(), 500000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Staff` WHERE `email` = 'waiter@gusto.com');
INSERT INTO `Staff` (`fullName`, `email`, `phone`, `password`, `role`, `hireDate`, `salary`, `isActive`)
SELECT 'المشتريات', 'purchases@gusto.com', '07700000006', '$2a$10$IosieKTRjSMhqng3iHat2OmoExS/8CeZhhVh6HtUyewwaNaxoFGq.', 'purchases', CURDATE(), 700000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Staff` WHERE `email` = 'purchases@gusto.com');
INSERT INTO `Staff` (`fullName`, `email`, `phone`, `password`, `role`, `hireDate`, `salary`, `isActive`)
SELECT 'أمين المخزن', 'storage@gusto.com', '07700000007', '$2a$10$IosieKTRjSMhqng3iHat2OmoExS/8CeZhhVh6HtUyewwaNaxoFGq.', 'storage', CURDATE(), 700000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Staff` WHERE `email` = 'storage@gusto.com');

-- Ingredients (main store = Ingredients.currentStock) ----------------------
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'صدر دجاج', 'kg', 40, 10, 80, 7000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'صدر دجاج');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'لحم غنم', 'kg', 25, 5, 50, 18000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'لحم غنم');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'لحم مفروم', 'kg', 20, 5, 40, 14000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'لحم مفروم');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'رز بسمتي', 'kg', 50, 10, 100, 2500, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'رز بسمتي');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'حمص حب', 'kg', 15, 3, 30, 3000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'حمص حب');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'طحينة', 'kg', 10, 2, 20, 6000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'طحينة');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'باذنجان', 'kg', 20, 5, 40, 1000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'باذنجان');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'طماطم', 'kg', 30, 5, 60, 1000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'طماطم');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'خيار', 'kg', 20, 5, 40, 1000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'خيار');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'خس', 'piece', 30, 10, 60, 750, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'خس');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'بقدونس', 'piece', 40, 10, 80, 250, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'بقدونس');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'زيت زيتون', 'liter', 10, 2, 20, 9000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'زيت زيتون');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'خبز عربي', 'piece', 200, 50, 400, 125, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'خبز عربي');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'برتقال', 'kg', 30, 5, 60, 1500, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'برتقال');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'ليمون', 'kg', 15, 3, 30, 2000, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'ليمون');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'نعناع', 'piece', 30, 5, 60, 250, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'نعناع');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'سكر', 'kg', 25, 5, 50, 1250, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'سكر');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'مياه معدنية قنينة', 'piece', 240, 48, 480, 250, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'مياه معدنية قنينة');
INSERT INTO `Ingredients` (`ingredientName`, `unit`, `currentStock`, `minStock`, `maxStock`, `costPerUnit`, `isActive`)
SELECT 'مشروب غازي علبة', 'piece', 240, 48, 480, 600, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Ingredients` WHERE `ingredientName` = 'مشروب غازي علبة');

-- Kitchen internal store (location 2) — drinks deduct their ingredients from here
INSERT INTO `IngredientStock` (`ingredientId`, `locationId`, `quantity`)
SELECT i.`idIngredient`, 2, 15 FROM `Ingredients` i WHERE i.`ingredientName` = 'برتقال'
AND NOT EXISTS (SELECT 1 FROM `IngredientStock` s WHERE s.`ingredientId` = i.`idIngredient` AND s.`locationId` = 2);
INSERT INTO `IngredientStock` (`ingredientId`, `locationId`, `quantity`)
SELECT i.`idIngredient`, 2, 8 FROM `Ingredients` i WHERE i.`ingredientName` = 'ليمون'
AND NOT EXISTS (SELECT 1 FROM `IngredientStock` s WHERE s.`ingredientId` = i.`idIngredient` AND s.`locationId` = 2);
INSERT INTO `IngredientStock` (`ingredientId`, `locationId`, `quantity`)
SELECT i.`idIngredient`, 2, 15 FROM `Ingredients` i WHERE i.`ingredientName` = 'نعناع'
AND NOT EXISTS (SELECT 1 FROM `IngredientStock` s WHERE s.`ingredientId` = i.`idIngredient` AND s.`locationId` = 2);
INSERT INTO `IngredientStock` (`ingredientId`, `locationId`, `quantity`)
SELECT i.`idIngredient`, 2, 10 FROM `Ingredients` i WHERE i.`ingredientName` = 'سكر'
AND NOT EXISTS (SELECT 1 FROM `IngredientStock` s WHERE s.`ingredientId` = i.`idIngredient` AND s.`locationId` = 2);
INSERT INTO `IngredientStock` (`ingredientId`, `locationId`, `quantity`)
SELECT i.`idIngredient`, 2, 96 FROM `Ingredients` i WHERE i.`ingredientName` = 'مياه معدنية قنينة'
AND NOT EXISTS (SELECT 1 FROM `IngredientStock` s WHERE s.`ingredientId` = i.`idIngredient` AND s.`locationId` = 2);
INSERT INTO `IngredientStock` (`ingredientId`, `locationId`, `quantity`)
SELECT i.`idIngredient`, 2, 96 FROM `Ingredients` i WHERE i.`ingredientName` = 'مشروب غازي علبة'
AND NOT EXISTS (SELECT 1 FROM `IngredientStock` s WHERE s.`ingredientId` = i.`idIngredient` AND s.`locationId` = 2);

-- Menu items, sizes and recipes --------------------------------------------

-- مقبلات
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'حمص بالطحينة', 'حمص مع طحينة وزيت زيتون', 4000, 5, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'مقبلات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'حمص بالطحينة') LIMIT 1;
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.15 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'حمص حب'
WHERE m.`itemName` = 'حمص بالطحينة'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.05 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'طحينة'
WHERE m.`itemName` = 'حمص بالطحينة'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.01 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'زيت زيتون'
WHERE m.`itemName` = 'حمص بالطحينة'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'متبل باذنجان', 'باذنجان مشوي مع طحينة', 4000, 5, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'مقبلات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'متبل باذنجان') LIMIT 1;
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.3 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'باذنجان'
WHERE m.`itemName` = 'متبل باذنجان'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.05 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'طحينة'
WHERE m.`itemName` = 'متبل باذنجان'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'كبة مقلية', '4 قطع كبة محشوة باللحم', 6000, 10, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'مقبلات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'كبة مقلية') LIMIT 1;
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.15 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'لحم مفروم'
WHERE m.`itemName` = 'كبة مقلية'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);

-- سلطات
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'فتوش', 'خضار مشكلة مع خبز محمص', 5000, 5, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'سلطات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'فتوش') LIMIT 1;
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.5 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'خس'
WHERE m.`itemName` = 'فتوش'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.2 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'طماطم'
WHERE m.`itemName` = 'فتوش'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.15 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'خيار'
WHERE m.`itemName` = 'فتوش'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 1 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'خبز عربي'
WHERE m.`itemName` = 'فتوش'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'تبولة', 'بقدونس وطماطم وبرغل', 5000, 5, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'سلطات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'تبولة') LIMIT 1;
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 2 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'بقدونس'
WHERE m.`itemName` = 'تبولة'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.15 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'طماطم'
WHERE m.`itemName` = 'تبولة'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.05 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'ليمون'
WHERE m.`itemName` = 'تبولة'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);

-- أطباق رئيسية
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'برياني دجاج', 'رز بسمتي مع دجاج وبهارات', 12000, 20, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'أطباق رئيسية'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'برياني دجاج') LIMIT 1;
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.3 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'صدر دجاج'
WHERE m.`itemName` = 'برياني دجاج'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.25 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'رز بسمتي'
WHERE m.`itemName` = 'برياني دجاج'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'قوزي على تمن', 'لحم غنم مع رز ومكسرات', 18000, 25, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'أطباق رئيسية'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'قوزي على تمن') LIMIT 1;
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.4 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'لحم غنم'
WHERE m.`itemName` = 'قوزي على تمن'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.3 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'رز بسمتي'
WHERE m.`itemName` = 'قوزي على تمن'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'مقلوبة', 'رز مع باذنجان ودجاج', 11000, 20, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'أطباق رئيسية'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'مقلوبة') LIMIT 1;
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.25 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'صدر دجاج'
WHERE m.`itemName` = 'مقلوبة'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.25 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'رز بسمتي'
WHERE m.`itemName` = 'مقلوبة'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.2 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'باذنجان'
WHERE m.`itemName` = 'مقلوبة'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);

-- مشويات
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'كباب لحم', 'كباب مشوي على الفحم', 14000, 15, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'مشويات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'كباب لحم') LIMIT 1;
INSERT INTO `ItemSizes` (`menuItemId`, `sizeName`, `priceAdjustment`, `isDefault`, `isActive`)
SELECT m.`idMenuItem`, 'نفر', 0, 1, 1 FROM `MenuItems` m WHERE m.`itemName` = 'كباب لحم'
AND NOT EXISTS (SELECT 1 FROM `ItemSizes` s WHERE s.`menuItemId` = m.`idMenuItem` AND s.`sizeName` = 'نفر');
INSERT INTO `ItemSizes` (`menuItemId`, `sizeName`, `priceAdjustment`, `isDefault`, `isActive`)
SELECT m.`idMenuItem`, 'نفرين', 12000, 0, 1 FROM `MenuItems` m WHERE m.`itemName` = 'كباب لحم'
AND NOT EXISTS (SELECT 1 FROM `ItemSizes` s WHERE s.`menuItemId` = m.`idMenuItem` AND s.`sizeName` = 'نفرين');
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.3 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'لحم مفروم'
WHERE m.`itemName` = 'كباب لحم'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 2 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'خبز عربي'
WHERE m.`itemName` = 'كباب لحم'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'تكة دجاج', 'قطع دجاج متبلة ومشوية', 12000, 15, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'مشويات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'تكة دجاج') LIMIT 1;
INSERT INTO `ItemSizes` (`menuItemId`, `sizeName`, `priceAdjustment`, `isDefault`, `isActive`)
SELECT m.`idMenuItem`, 'نفر', 0, 1, 1 FROM `MenuItems` m WHERE m.`itemName` = 'تكة دجاج'
AND NOT EXISTS (SELECT 1 FROM `ItemSizes` s WHERE s.`menuItemId` = m.`idMenuItem` AND s.`sizeName` = 'نفر');
INSERT INTO `ItemSizes` (`menuItemId`, `sizeName`, `priceAdjustment`, `isDefault`, `isActive`)
SELECT m.`idMenuItem`, 'نفرين', 10000, 0, 1 FROM `MenuItems` m WHERE m.`itemName` = 'تكة دجاج'
AND NOT EXISTS (SELECT 1 FROM `ItemSizes` s WHERE s.`menuItemId` = m.`idMenuItem` AND s.`sizeName` = 'نفرين');
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.3 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'صدر دجاج'
WHERE m.`itemName` = 'تكة دجاج'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 2 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'خبز عربي'
WHERE m.`itemName` = 'تكة دجاج'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'مشويات مشكلة', 'كباب وتكة ولحم', 25000, 20, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'مشويات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'مشويات مشكلة') LIMIT 1;
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.2 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'لحم مفروم'
WHERE m.`itemName` = 'مشويات مشكلة'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.2 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'صدر دجاج'
WHERE m.`itemName` = 'مشويات مشكلة'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.2 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'لحم غنم'
WHERE m.`itemName` = 'مشويات مشكلة'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);

-- حلويات
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'كنافة', 'كنافة نابلسية بالجبن', 5000, 10, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'حلويات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'كنافة') LIMIT 1;
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'أم علي', 'حلى بالحليب والمكسرات', 5000, 10, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'حلويات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'أم علي') LIMIT 1;

-- مشروبات
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'عصير برتقال طازج', NULL, 3000, 3, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'مشروبات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'عصير برتقال طازج') LIMIT 1;
INSERT INTO `ItemSizes` (`menuItemId`, `sizeName`, `priceAdjustment`, `isDefault`, `isActive`)
SELECT m.`idMenuItem`, 'وسط', 0, 1, 1 FROM `MenuItems` m WHERE m.`itemName` = 'عصير برتقال طازج'
AND NOT EXISTS (SELECT 1 FROM `ItemSizes` s WHERE s.`menuItemId` = m.`idMenuItem` AND s.`sizeName` = 'وسط');
INSERT INTO `ItemSizes` (`menuItemId`, `sizeName`, `priceAdjustment`, `isDefault`, `isActive`)
SELECT m.`idMenuItem`, 'كبير', 1000, 0, 1 FROM `MenuItems` m WHERE m.`itemName` = 'عصير برتقال طازج'
AND NOT EXISTS (SELECT 1 FROM `ItemSizes` s WHERE s.`menuItemId` = m.`idMenuItem` AND s.`sizeName` = 'كبير');
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.4 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'برتقال'
WHERE m.`itemName` = 'عصير برتقال طازج'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.02 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'سكر'
WHERE m.`itemName` = 'عصير برتقال طازج'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'ليمون بالنعناع', NULL, 3000, 3, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'مشروبات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'ليمون بالنعناع') LIMIT 1;
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.15 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'ليمون'
WHERE m.`itemName` = 'ليمون بالنعناع'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 1 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'نعناع'
WHERE m.`itemName` = 'ليمون بالنعناع'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 0.03 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'سكر'
WHERE m.`itemName` = 'ليمون بالنعناع'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'مياه معدنية', NULL, 500, 0, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'مشروبات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'مياه معدنية') LIMIT 1;
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 1 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'مياه معدنية قنينة'
WHERE m.`itemName` = 'مياه معدنية'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);
INSERT INTO `MenuItems` (`categoryId`, `itemName`, `description`, `basePrice`, `preparationTime`, `itemType`, `isAvailable`, `isActive`)
SELECT c.`idCategory`, 'مشروب غازي', NULL, 1000, 0, 'recipe', 1, 1 FROM `Categories` c WHERE c.`categoryName` = 'مشروبات'
AND NOT EXISTS (SELECT 1 FROM `MenuItems` WHERE `itemName` = 'مشروب غازي') LIMIT 1;
INSERT INTO `Recipes` (`menuItemId`, `sizeId`, `ingredientId`, `quantityNeeded`)
SELECT m.`idMenuItem`, NULL, i.`idIngredient`, 1 FROM `MenuItems` m JOIN `Ingredients` i ON i.`ingredientName` = 'مشروب غازي علبة'
WHERE m.`itemName` = 'مشروب غازي'
AND NOT EXISTS (SELECT 1 FROM `Recipes` r WHERE r.`menuItemId` = m.`idMenuItem` AND r.`ingredientId` = i.`idIngredient` AND r.`sizeId` IS NULL);

-- Kitchen portions: orders for kitchen-category items are rejected unless
-- KitchenItemStock has enough portions (carried over from the cafe design).
INSERT INTO `KitchenItemStock` (`menuItemId`, `quantity`)
SELECT m.`idMenuItem`, 50 FROM `MenuItems` m JOIN `Categories` c ON c.`idCategory` = m.`categoryId`
WHERE c.`isKitchen` = 1
AND NOT EXISTS (SELECT 1 FROM `KitchenItemStock` k WHERE k.`menuItemId` = m.`idMenuItem`);

-- Suppliers ---------------------------------------------------------------
INSERT INTO `Suppliers` (`supplierName`, `supplierPhone`, `supplierAddress`, `initialDebt`, `notes`, `isActive`)
SELECT 'مجزرة الرافدين', '07801111111', 'بغداد - الكرادة', 0, 'لحوم ودجاج', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Suppliers` WHERE `supplierName` = 'مجزرة الرافدين');
INSERT INTO `Suppliers` (`supplierName`, `supplierPhone`, `supplierAddress`, `initialDebt`, `notes`, `isActive`)
SELECT 'سوق الخضار المركزي', '07802222222', 'بغداد - جميلة', 0, 'خضار وفواكه', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Suppliers` WHERE `supplierName` = 'سوق الخضار المركزي');
INSERT INTO `Suppliers` (`supplierName`, `supplierPhone`, `supplierAddress`, `initialDebt`, `notes`, `isActive`)
SELECT 'شركة النهرين للمواد الغذائية', '07803333333', 'بغداد - الشورجة', 250000, 'رز وزيوت ومواد جافة', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Suppliers` WHERE `supplierName` = 'شركة النهرين للمواد الغذائية');

-- Credit customers ---------------------------------------------------------
INSERT INTO `Customers` (`fullName`, `phone`, `creditLimit`, `initialDebt`, `dueDays`, `notes`, `isActive`)
SELECT 'شركة الأمل للمقاولات', '07811111111', 1000000, 0, 30, 'حساب آجل للشركة', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Customers` WHERE `fullName` = 'شركة الأمل للمقاولات');
INSERT INTO `Customers` (`fullName`, `phone`, `creditLimit`, `initialDebt`, `dueDays`, `notes`, `isActive`)
SELECT 'أبو أحمد', '07812222222', 200000, 0, 15, 'زبون دائم', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Customers` WHERE `fullName` = 'أبو أحمد');
