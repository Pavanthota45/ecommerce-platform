const pool = require("../config/db");


// =====================================================
// GET ALL INVENTORY
// =====================================================

const getAllInventory = async (req, res) => {
    try {
        const [inventory] = await pool.query(`
            SELECT
                p.id AS product_id,
                p.name AS product_name,
                p.brand,
                p.sku,
                p.price,
                p.discount_price,
                p.status AS product_status,
                c.name AS category_name,

                COALESCE(i.stock_quantity, 0) AS stock_quantity,
                COALESCE(i.reserved_quantity, 0) AS reserved_quantity,

                (
                    COALESCE(i.stock_quantity, 0)
                    -
                    COALESCE(i.reserved_quantity, 0)
                ) AS available_quantity,

                CASE
                    WHEN COALESCE(i.stock_quantity, 0) <= 0
                        THEN 'OUT_OF_STOCK'

                    WHEN (
                        COALESCE(i.stock_quantity, 0)
                        -
                        COALESCE(i.reserved_quantity, 0)
                    ) <= 5
                        THEN 'LOW_STOCK'

                    ELSE 'IN_STOCK'
                END AS stock_status

            FROM products p

            LEFT JOIN inventory i
                ON p.id = i.product_id

            LEFT JOIN categories c
                ON p.category_id = c.id

            ORDER BY p.created_at DESC
        `);

        return res.json({
            success: true,
            inventory
        });

    } catch (error) {
        console.error("Get inventory error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch inventory."
        });
    }
};


// =====================================================
// GET INVENTORY FOR ONE PRODUCT
// =====================================================

const getInventoryByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const [inventory] = await pool.query(
            `
            SELECT
                p.id AS product_id,
                p.name AS product_name,
                p.brand,
                p.sku,

                COALESCE(i.stock_quantity, 0) AS stock_quantity,
                COALESCE(i.reserved_quantity, 0) AS reserved_quantity,

                (
                    COALESCE(i.stock_quantity, 0)
                    -
                    COALESCE(i.reserved_quantity, 0)
                ) AS available_quantity

            FROM products p

            LEFT JOIN inventory i
                ON p.id = i.product_id

            WHERE p.id = ?
            `,
            [productId]
        );

        if (inventory.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        return res.json({
            success: true,
            inventory: inventory[0]
        });

    } catch (error) {
        console.error(
            "Get product inventory error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product inventory."
        });
    }
};


// =====================================================
// UPDATE INVENTORY
// =====================================================

const updateInventory = async (req, res) => {
    try {
        const { productId } = req.params;
        const { stock_quantity } = req.body;

        if (stock_quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Stock quantity is required."
            });
        }

        const stockQuantity = Number(stock_quantity);

        if (
            !Number.isInteger(stockQuantity) ||
            stockQuantity < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Stock quantity must be a whole number greater than or equal to 0."
            });
        }

        const [products] = await pool.query(
            `
            SELECT id
            FROM products
            WHERE id = ?
            `,
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const [existingInventory] = await pool.query(
            `
            SELECT
                product_id,
                reserved_quantity
            FROM inventory
            WHERE product_id = ?
            `,
            [productId]
        );

        let reservedQuantity = 0;

        if (existingInventory.length > 0) {
            reservedQuantity = Number(
                existingInventory[0].reserved_quantity || 0
            );
        }

        if (stockQuantity < reservedQuantity) {
            return res.status(400).json({
                success: false,
                message:
                    `Stock cannot be less than reserved quantity (${reservedQuantity}).`
            });
        }

        if (existingInventory.length === 0) {
            await pool.query(
                `
                INSERT INTO inventory
                (
                    product_id,
                    stock_quantity,
                    reserved_quantity
                )
                VALUES (?, ?, 0)
                `,
                [
                    productId,
                    stockQuantity
                ]
            );

        } else {
            await pool.query(
                `
                UPDATE inventory
                SET stock_quantity = ?
                WHERE product_id = ?
                `,
                [
                    stockQuantity,
                    productId
                ]
            );
        }

        const [updatedInventory] = await pool.query(
            `
            SELECT
                product_id,
                stock_quantity,
                reserved_quantity,

                (
                    stock_quantity -
                    reserved_quantity
                ) AS available_quantity

            FROM inventory

            WHERE product_id = ?
            `,
            [productId]
        );

        return res.json({
            success: true,
            message: "Inventory updated successfully.",
            inventory: updatedInventory[0]
        });

    } catch (error) {
        console.error(
            "Update inventory error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update inventory."
        });
    }
};


// =====================================================
// ADD STOCK
// =====================================================

const addStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Quantity is required."
            });
        }

        const addQuantity = Number(quantity);

        if (
            !Number.isInteger(addQuantity) ||
            addQuantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a positive whole number."
            });
        }

        const [products] = await pool.query(
            `
            SELECT id
            FROM products
            WHERE id = ?
            `,
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const [existingInventory] = await pool.query(
            `
            SELECT product_id
            FROM inventory
            WHERE product_id = ?
            `,
            [productId]
        );

        if (existingInventory.length === 0) {
            await pool.query(
                `
                INSERT INTO inventory
                (
                    product_id,
                    stock_quantity,
                    reserved_quantity
                )
                VALUES (?, ?, 0)
                `,
                [
                    productId,
                    addQuantity
                ]
            );

        } else {
            await pool.query(
                `
                UPDATE inventory
                SET stock_quantity =
                    stock_quantity + ?
                WHERE product_id = ?
                `,
                [
                    addQuantity,
                    productId
                ]
            );
        }

        const [updatedInventory] = await pool.query(
            `
            SELECT
                product_id,
                stock_quantity,
                reserved_quantity,

                (
                    stock_quantity -
                    reserved_quantity
                ) AS available_quantity

            FROM inventory

            WHERE product_id = ?
            `,
            [productId]
        );

        return res.json({
            success: true,
            message:
                `${addQuantity} item(s) added to inventory.`,
            inventory: updatedInventory[0]
        });

    } catch (error) {
        console.error(
            "Add stock error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to add stock."
        });
    }
};


// =====================================================
// REDUCE STOCK
// =====================================================

const reduceStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Quantity is required."
            });
        }

        const reduceQuantity = Number(quantity);

        if (
            !Number.isInteger(reduceQuantity) ||
            reduceQuantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a positive whole number."
            });
        }

        const [inventory] = await pool.query(
            `
            SELECT
                product_id,
                stock_quantity,
                reserved_quantity
            FROM inventory
            WHERE product_id = ?
            `,
            [productId]
        );

        if (inventory.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Inventory record not found."
            });
        }

        const currentStock =
            Number(inventory[0].stock_quantity);

        const reservedQuantity =
            Number(inventory[0].reserved_quantity);

        const newStock =
            currentStock - reduceQuantity;

        if (newStock < reservedQuantity) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot reduce stock below reserved quantity (${reservedQuantity}).`
            });
        }

        await pool.query(
            `
            UPDATE inventory
            SET stock_quantity = ?
            WHERE product_id = ?
            `,
            [
                newStock,
                productId
            ]
        );

        const [updatedInventory] = await pool.query(
            `
            SELECT
                product_id,
                stock_quantity,
                reserved_quantity,

                (
                    stock_quantity -
                    reserved_quantity
                ) AS available_quantity

            FROM inventory

            WHERE product_id = ?
            `,
            [productId]
        );

        return res.json({
            success: true,
            message:
                `${reduceQuantity} item(s) removed from inventory.`,
            inventory: updatedInventory[0]
        });

    } catch (error) {
        console.error(
            "Reduce stock error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to reduce stock."
        });
    }
};


module.exports = {
    getAllInventory,
    getInventoryByProduct,
    updateInventory,
    addStock,
    reduceStock
};