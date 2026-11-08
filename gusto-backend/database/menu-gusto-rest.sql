-- ============================================================================
-- Gusto menu — replaces the whole menu with the one on https://gusto-rest.com
-- Source: data/menu.json version 1 (2026-10-05-2)
--
-- Run on the server:  sudo mysql < gusto-backend/database/menu-gusto-rest.sql
--
-- Old menu:
--   * dishes never sold are DELETED (with their sizes, recipes and kitchen stock)
--   * dishes that appear in past sales are HIDDEN (isActive = 0) so old receipts,
--     reports and the books stay correct — MySQL refuses to delete them anyway
--   * empty old categories are deleted, the rest hidden
--   * waiter orders still waiting for the cashier are cancelled (they hold old dishes)
-- New menu: restaurant categories go to the kitchen (isKitchen = 1), cafe/bar
-- categories to the drinks screen (isKitchen = 0). Dishes with options get sizes:
-- basePrice = cheapest option, each size adds the difference.
-- Photos: /menu/<file>.jpg, shipped in gusto-frontend/public/menu (see CREDITS.md there).
-- Everything runs in one transaction: on any error nothing changes.
-- ============================================================================

USE `gusto_db`;
SET NAMES utf8mb4;
START TRANSACTION;

-- 1) Old menu -----------------------------------------------------------------
UPDATE WaiterOrders SET status = 'cancelled', handledAt = NOW(), rejectReason = 'تغيير القائمة' WHERE status = 'pending';
DELETE FROM MenuItems
  WHERE idMenuItem NOT IN (SELECT menuItemId FROM (SELECT DISTINCT menuItemId FROM OrderItems) AS sold);
DELETE FROM KitchenItemStock;
UPDATE MenuItems SET isActive = 0, isAvailable = 0;
UPDATE ItemSizes SET isActive = 0;
DELETE FROM Categories
  WHERE idCategory NOT IN (SELECT categoryId FROM (SELECT DISTINCT categoryId FROM MenuItems) AS used);
UPDATE Categories SET isActive = 0;

-- 2) New menu -----------------------------------------------------------------

-- ==== مطعم غوستو / GUSTO Restaurant — المطبخ

-- الفطور الصباحي (Breakfast)
INSERT INTO Categories (categoryName, description, displayOrder, isActive, isKitchen) VALUES ('الفطور الصباحي', 'Breakfast', 1, 1, 1);
SET @cat = LAST_INSERT_ID();
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'كاهي', 'عجينة الكاهي المقرمشة على الطريقة العراقية', 1500, '/menu/kahi.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'كاهي وقيمر', 'كاهي مقرمش مع قيمر طازج', 3000, '/menu/kahi-geymar.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'قيمر وعسل', 'قيمر طازج مع العسل الطبيعي', 3000, '/menu/geymar-honey.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'لحم بعجين', 'عجينة رقيقة مع اللحم المتبّل', 2000, '/menu/lahm-bi-ajeen.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'بيدا تركية', 'بيدا تركية طازجة من الفرن', 4000, '/menu/turkish-pide.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'فطيرة غوستو بالجبن', 'فطيرة غوستو المميزة محشوة بالجبن', 3000, '/menu/gusto-pie-cheese.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'فطيرة غوستو بالقشطة', 'فطيرة غوستو المميزة بالقشطة', 3000, '/menu/gusto-pie-cream.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'فطيرة غوستو نوتيلا', 'فطيرة غوستو المميزة بالنوتيلا', 3500, '/menu/gusto-pie-nutella.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'فطيرة لحم وجبن', 'فطيرة باللحم المتبّل والجبن', 2500, '/menu/meat-cheese-pie.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'فطيرة باللحم', 'فطيرة باللحم المتبّل', 2000, '/menu/meat-pie.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'مناقيش', 'مناقيش طازجة من الفرن', 1500, '/menu/manakish.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'كبة سراي', 'كبة برغل بغدادية محشوة باللحم', 3000, '/menu/kubba-saray.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'باقلاء', 'تشريب الباقلاء على الطريقة العراقية', 3000, '/menu/bagilla.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'باقلاء بالدهن الحر', 'باقلاء عراقية بالدهن الحر', 4000, '/menu/bagilla-dihin.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'وجبة فلافل صاج', 'فلافل مقرمشة بخبز الصاج', 2500, '/menu/falafel-saj.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'فطور سيت مينيو', 'تشكيلة فطور غوستو المتكاملة', 7000, '/menu/breakfast-set.jpg', 'recipe', 1, 1);
SET @item = LAST_INSERT_ID();
INSERT INTO ItemSizes (menuItemId, sizeName, priceAdjustment, isDefault, isActive) VALUES (@item, 'لشخص واحد', 0, 1, 1), (@item, 'لشخصين', 8000, 0, 1), (@item, 'لأربعة أشخاص', 13000, 0, 1);

-- لحم بعجين (Lahm Bi Ajeen)
INSERT INTO Categories (categoryName, description, displayOrder, isActive, isKitchen) VALUES ('لحم بعجين', 'Lahm Bi Ajeen', 2, 1, 1);
SET @cat = LAST_INSERT_ID();
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'لحم بعجين وسط', 'عجينة رقيقة مع اللحم المتبّل، تُقدَّم سادة أو بإضافة', 2000, '/menu/lahm-bi-ajeen-medium.jpg', 'recipe', 1, 1);
SET @item = LAST_INSERT_ID();
INSERT INTO ItemSizes (menuItemId, sizeName, priceAdjustment, isDefault, isActive) VALUES (@item, 'سادة', 0, 1, 1), (@item, 'بيض', 500, 0, 1), (@item, 'جبن', 500, 0, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'لحم بعجين دبل', 'طبقة لحم مضاعفة، تُقدَّم سادة أو بإضافة', 4000, '/menu/lahm-bi-ajeen-double.jpg', 'recipe', 1, 1);
SET @item = LAST_INSERT_ID();
INSERT INTO ItemSizes (menuItemId, sizeName, priceAdjustment, isDefault, isActive) VALUES (@item, 'سادة', 0, 1, 1), (@item, 'بيض', 500, 0, 1), (@item, 'جبن', 500, 0, 1);

-- بيتزا (Pizza)
INSERT INTO Categories (categoryName, description, displayOrder, isActive, isKitchen) VALUES ('بيتزا', 'Pizza', 3, 1, 1);
SET @cat = LAST_INSERT_ID();
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'بيتزا لحم مثروم', 'بيتزا باللحم المثروم المتبّل والجبن', 7000, '/menu/pizza-minced-meat.jpg', 'recipe', 1, 1);
SET @item = LAST_INSERT_ID();
INSERT INTO ItemSizes (menuItemId, sizeName, priceAdjustment, isDefault, isActive) VALUES (@item, 'وسط', 0, 1, 1), (@item, 'كبير', 3000, 0, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'بيتزا كص دجاج', 'بيتزا بكص الدجاج والجبن', 7000, '/menu/pizza-chicken-gus.jpg', 'recipe', 1, 1);
SET @item = LAST_INSERT_ID();
INSERT INTO ItemSizes (menuItemId, sizeName, priceAdjustment, isDefault, isActive) VALUES (@item, 'وسط', 0, 1, 1), (@item, 'كبير', 3000, 0, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'بيتزا كص لحم', 'بيتزا بكص اللحم والجبن', 8000, '/menu/pizza-meat-gus.jpg', 'recipe', 1, 1);
SET @item = LAST_INSERT_ID();
INSERT INTO ItemSizes (menuItemId, sizeName, priceAdjustment, isDefault, isActive) VALUES (@item, 'وسط', 0, 1, 1), (@item, 'كبير', 4000, 0, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'بيتزا خضار', 'بيتزا بالخضار الطازجة والجبن', 5000, '/menu/pizza-vegetable.jpg', 'recipe', 1, 1);
SET @item = LAST_INSERT_ID();
INSERT INTO ItemSizes (menuItemId, sizeName, priceAdjustment, isDefault, isActive) VALUES (@item, 'وسط', 0, 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'بيتزا مارجريتا', 'صلصة طماطم وجبن موزاريلا', 5000, '/menu/pizza-margherita.jpg', 'recipe', 1, 1);
SET @item = LAST_INSERT_ID();
INSERT INTO ItemSizes (menuItemId, sizeName, priceAdjustment, isDefault, isActive) VALUES (@item, 'وسط', 0, 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'بيتزا ميكس', 'تشكيلة غوستو المميزة من اللحوم والخضار', 8000, '/menu/pizza-mix.jpg', 'recipe', 1, 1);
SET @item = LAST_INSERT_ID();
INSERT INTO ItemSizes (menuItemId, sizeName, priceAdjustment, isDefault, isActive) VALUES (@item, 'وسط', 0, 1, 1), (@item, 'كبير', 4000, 0, 1);

-- المقبلات (Appetizers)
INSERT INTO Categories (categoryName, description, displayOrder, isActive, isKitchen) VALUES ('المقبلات', 'Appetizers', 4, 1, 1);
SET @cat = LAST_INSERT_ID();
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'طبق مقبلات', 'تشكيلة مقبلات غوستو الطازجة', 2000, '/menu/appetizers-platter.jpg', 'recipe', 1, 1);
SET @item = LAST_INSERT_ID();
INSERT INTO ItemSizes (menuItemId, sizeName, priceAdjustment, isDefault, isActive) VALUES (@item, 'صغير', 0, 1, 1), (@item, 'وسط', 1000, 0, 1), (@item, 'كبير', 3000, 0, 1);

-- الكص (Gus)
INSERT INTO Categories (categoryName, description, displayOrder, isActive, isKitchen) VALUES ('الكص', 'Gus', 5, 1, 1);
SET @cat = LAST_INSERT_ID();
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'تشريب كص', 'خبز مشرّب بالمرق مع كص اللحم — للنفر', 8000, '/menu/tashreeb-gus.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'كص على تمن', 'كص لحم على تمن عراقي — للنفر', 9000, '/menu/gus-rice.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'كص لحم بالوزن', 'كص لحم غوستو يُباع بالوزن', 12000, '/menu/gus-meat-kilo.jpg', 'recipe', 1, 1);
SET @item = LAST_INSERT_ID();
INSERT INTO ItemSizes (menuItemId, sizeName, priceAdjustment, isDefault, isActive) VALUES (@item, 'ربع كيلو', 0, 1, 1), (@item, 'نص كيلو', 13000, 0, 1), (@item, 'كيلو', 38000, 0, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'كص لحم صمون حجري', 'ساندويتش كص لحم بصمون حجري', 4000, '/menu/gus-samoon-stone.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'كص لحم صمون كهربائي', 'ساندويتش كص لحم بصمون كهربائي', 5000, '/menu/gus-samoon-electric.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'ريزو غوستو باللحم', 'ريزو غوستو المميز باللحم', 7000, '/menu/rizo-gusto.jpg', 'recipe', 1, 1);

-- فنكر (Fries)
INSERT INTO Categories (categoryName, description, displayOrder, isActive, isKitchen) VALUES ('فنكر', 'Fries', 6, 1, 1);
SET @cat = LAST_INSERT_ID();
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'طبق فنكر', 'أصابع بطاطا مقلية مقرمشة', 3000, '/menu/fries-plate.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'فنكر جبن وصوص', 'أصابع بطاطا مقلية مع الجبن والصوص', 3500, '/menu/fries-cheese-sauce.jpg', 'recipe', 1, 1);

-- ==== غوستو كافيه / GUSTO Cafe — البار (شاشة المشروبات)

-- مشروبات ساخنة (Hot Drinks)
INSERT INTO Categories (categoryName, description, displayOrder, isActive, isKitchen) VALUES ('مشروبات ساخنة', 'Hot Drinks', 7, 1, 0);
SET @cat = LAST_INSERT_ID();
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'قهوة تركية', NULL, 2000, '/menu/turkish-coffee.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'اسبريسو', NULL, 2500, '/menu/espresso.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'كابتشينو', NULL, 3000, '/menu/cappuccino.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'لاتيه', NULL, 3500, '/menu/latte.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'هوت شوكلت', NULL, 3500, '/menu/hot-chocolate.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'شاي', NULL, 1000, '/menu/tea.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'شاي أعشاب', NULL, 1500, '/menu/herbal-tea.jpg', 'recipe', 1, 1);

-- مشروبات باردة (Cold Drinks)
INSERT INTO Categories (categoryName, description, displayOrder, isActive, isKitchen) VALUES ('مشروبات باردة', 'Cold Drinks', 8, 1, 0);
SET @cat = LAST_INSERT_ID();
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'آيس كوفي', NULL, 3500, '/menu/iced-coffee.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'آيس لاتيه', NULL, 4000, '/menu/iced-latte.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'فرابيه', NULL, 4500, '/menu/frappe.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'موهيتو', NULL, 4000, '/menu/mojito.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'مشروبات غازية', NULL, 1000, '/menu/soft-drink.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'ماء', NULL, 500, '/menu/water.jpg', 'recipe', 1, 1);

-- عصائر طازجة (Fresh Juices)
INSERT INTO Categories (categoryName, description, displayOrder, isActive, isKitchen) VALUES ('عصائر طازجة', 'Fresh Juices', 9, 1, 0);
SET @cat = LAST_INSERT_ID();
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'عصير برتقال', NULL, 3000, '/menu/orange-juice.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'عصير رمان', NULL, 4000, '/menu/pomegranate-juice.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'ليمون بالنعناع', NULL, 3000, '/menu/lemon-mint.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'عصير جزر', NULL, 3000, '/menu/carrot-juice.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'كوكتيل فواكه', NULL, 4000, '/menu/mixed-juice.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'سموذي فراولة', NULL, 4500, '/menu/strawberry-smoothie.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'سموذي مانجو', NULL, 4500, '/menu/mango-smoothie.jpg', 'recipe', 1, 1);

-- أركيلة (Shisha)
INSERT INTO Categories (categoryName, description, displayOrder, isActive, isKitchen) VALUES ('أركيلة', 'Shisha', 10, 1, 0);
SET @cat = LAST_INSERT_ID();
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'أركيلة تفاحتين', NULL, 6000, '/menu/shisha-double-apple.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'أركيلة نعناع', NULL, 6000, '/menu/shisha-mint.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'أركيلة عنب', NULL, 6000, '/menu/shisha-grape.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'أركيلة ليمون', NULL, 6000, '/menu/shisha-lemon.jpg', 'recipe', 1, 1);
INSERT INTO MenuItems (categoryId, itemName, description, basePrice, imageUrl, itemType, isAvailable, isActive) VALUES (@cat, 'أركيلة بطيخ', NULL, 6000, '/menu/shisha-watermelon.jpg', 'recipe', 1, 1);

COMMIT;

-- Check: the new menu
SELECT c.categoryName AS category, IF(c.isKitchen, 'kitchen', 'bar') AS screen, COUNT(m.idMenuItem) AS dishes
  FROM Categories c LEFT JOIN MenuItems m ON m.categoryId = c.idCategory AND m.isActive = 1
  WHERE c.isActive = 1 GROUP BY c.idCategory ORDER BY c.displayOrder;
