const pool = require("../config/db");

// ==========================================
// GET CART
// ==========================================

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find user's cart
        const [carts] = await pool.query(
            `SELECT
                id,
                user_id
             FROM cart
             WHERE user_id = ?`,
            [userId]
        );

        // Cart does not exist yet
        if (carts.length === 0) {
            return res.json({
                success: true,
                cart: {
                    id: null,
                    user_id: userId,
                    items: [],
                    item_count: 0,
                    subtotal: 0
                }
            });
        }

        const cart = carts[0];

        // Get cart items with product information
        const [items] = await pool.query(
            `SELECT
                ci.id,
                ci.product_id,
                ci.quantity,

                p.name,
                p.description,
                p.brand,
                p.price,
                p.discount_price,
                p.sku,
                p.status,

                c.name AS category_name,

                i.stock_quantity,
                i.reserved_quantity,

                (
                    SELECT pi.image_url
                    FROM product_images pi
                    WHERE pi.product_id = p.id
                    ORDER BY pi.is_primary DESC, pi.id ASC
                    LIMIT 1
                ) AS image_url

             FROM cart_items ci

             INNER JOIN products p
                ON ci.product_id = p.id

             LEFT JOIN categories c
                ON p.category_id = c.id

             LEFT JOIN inventory i
                ON p.id = i.product_id

             WHERE ci.cart_id = ?

             ORDER BY ci.id DESC`,
            [cart.id]
        );

        let subtotal = 0;
        let itemCount = 0;

        const formattedItems = items.map((item) => {
            const currentPrice =
                item.discount_price !== null &&
                item.discount_price !== undefined &&
                Number(item.discount_price) <
                    Number(item.price)
                    ? Number(item.discount_price)
                    : Number(item.price);

            const quantity = Number(item.quantity);

            const itemTotal =
                currentPrice * quantity;

            subtotal += itemTotal;
            itemCount += quantity;

            return {
                id: item.id,
                product_id: item.product_id,
                quantity,

                name: item.name,
                description: item.description,
                brand: item.brand,

                price: Number(item.price),
                discount_price:
                    item.discount_price !== null
                        ? Number(item.discount_price)
                        : null,

                current_price: currentPrice,

                sku: item.sku,
                status: item.status,

                category_name:
                    item.category_name,

                stock_quantity:
                    Number(item.stock_quantity || 0),

                reserved_quantity:
                    Number(
                        item.reserved_quantity || 0
                    ),

                image_url:
                    item.image_url || null,

                item_total: itemTotal
            };
        });

        res.json({
            success: true,

            cart: {
                id: cart.id,
                user_id: cart.user_id,

                items: formattedItems,

                item_count: itemCount,

                subtotal
            }
        });

    } catch (error) {
        console.error(
            "Get cart error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch cart"
        });
    }
};


// ==========================================
// ADD ITEM TO CART
// ==========================================

const addToCart = async (req, res) => {
    const connection =
        await pool.getConnection();

    try {
        const userId = req.user.id;

        const {
            product_id,
            quantity
        } = req.body;

        // Validate product ID
        if (
            product_id === undefined ||
            product_id === null ||
            product_id === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }

        // Validate quantity
        const requestedQuantity =
            Number(quantity);

        if (
            !Number.isInteger(
                requestedQuantity
            ) ||
            requestedQuantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a positive whole number"
            });
        }

        // Get product
        const [products] =
            await connection.query(
                `SELECT
                    p.id,
                    p.name,
                    p.status,

                    i.stock_quantity,
                    i.reserved_quantity

                 FROM products p

                 LEFT JOIN inventory i
                    ON p.id = i.product_id

                 WHERE p.id = ?`,
                [product_id]
            );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const product = products[0];

        // Check active status
        if (product.status !== "active") {
            return res.status(400).json({
                success: false,
                message:
                    "This product is currently unavailable"
            });
        }

        const stockQuantity =
            Number(
                product.stock_quantity || 0
            );

        const reservedQuantity =
            Number(
                product.reserved_quantity || 0
            );

        const availableStock =
            stockQuantity -
            reservedQuantity;

        if (availableStock <= 0) {
            return res.status(400).json({
                success: false,
                message:
                    "This product is out of stock"
            });
        }

        // Get or create cart
        let cartId;

        const [carts] =
            await connection.query(
                `SELECT id
                 FROM cart
                 WHERE user_id = ?`,
                [userId]
            );

        if (carts.length === 0) {
            const [cartResult] =
                await connection.query(
                    `INSERT INTO cart
                    (user_id)
                    VALUES (?)`,
                    [userId]
                );

            cartId =
                cartResult.insertId;
        } else {
            cartId = carts[0].id;
        }

        // Check if product already exists
        // in cart
        const [existingItems] =
            await connection.query(
                `SELECT
                    id,
                    quantity
                 FROM cart_items
                 WHERE cart_id = ?
                 AND product_id = ?`,
                [
                    cartId,
                    product_id
                ]
            );

        if (existingItems.length > 0) {
            const existingQuantity =
                Number(
                    existingItems[0].quantity
                );

            const newQuantity =
                existingQuantity +
                requestedQuantity;

            if (
                newQuantity >
                availableStock
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Only ${availableStock} item(s) available in stock`
                });
            }

            await connection.query(
                `UPDATE cart_items

                 SET quantity = ?

                 WHERE id = ?`,
                [
                    newQuantity,
                    existingItems[0].id
                ]
            );

            return res.json({
                success: true,
                message:
                    "Cart quantity updated successfully",
                quantity: newQuantity
            });
        }

        // New cart item
        if (
            requestedQuantity >
            availableStock
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Only ${availableStock} item(s) available in stock`
            });
        }

        await connection.query(
            `INSERT INTO cart_items
            (
                cart_id,
                product_id,
                quantity
            )
            VALUES (?, ?, ?)`,
            [
                cartId,
                product_id,
                requestedQuantity
            ]
        );

        res.status(201).json({
            success: true,
            message:
                "Product added to cart successfully",
            quantity:
                requestedQuantity
        });

    } catch (error) {
        console.error(
            "Add to cart error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to add product to cart"
        });

    } finally {
        connection.release();
    }
};


// ==========================================
// UPDATE CART ITEM QUANTITY
// ==========================================

const updateCartItem = async (req, res) => {
    const connection =
        await pool.getConnection();

    try {
        const userId = req.user.id;

        const { productId } =
            req.params;

        const {
            quantity
        } = req.body;

        const newQuantity =
            Number(quantity);

        if (
            !Number.isInteger(
                newQuantity
            ) ||
            newQuantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a positive whole number"
            });
        }

        // Find cart
        const [carts] =
            await connection.query(
                `SELECT id
                 FROM cart
                 WHERE user_id = ?`,
                [userId]
            );

        if (carts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const cartId =
            carts[0].id;

        // Get product stock
        const [products] =
            await connection.query(
                `SELECT
                    p.id,
                    p.status,
                    i.stock_quantity,
                    i.reserved_quantity

                 FROM products p

                 LEFT JOIN inventory i
                    ON p.id = i.product_id

                 WHERE p.id = ?`,
                [productId]
            );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const product =
            products[0];

        if (product.status !== "active") {
            return res.status(400).json({
                success: false,
                message:
                    "This product is currently unavailable"
            });
        }

        const availableStock =
            Number(
                product.stock_quantity || 0
            ) -
            Number(
                product.reserved_quantity || 0
            );

        if (
            newQuantity >
            availableStock
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Only ${availableStock} item(s) available in stock`
            });
        }

        // Check cart item
        const [items] =
            await connection.query(
                `SELECT id
                 FROM cart_items
                 WHERE cart_id = ?
                 AND product_id = ?`,
                [
                    cartId,
                    productId
                ]
            );

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Product is not in your cart"
            });
        }

        await connection.query(
            `UPDATE cart_items

             SET quantity = ?

             WHERE cart_id = ?
             AND product_id = ?`,
            [
                newQuantity,
                cartId,
                productId
            ]
        );

        res.json({
            success: true,
            message:
                "Cart quantity updated successfully",
            quantity:
                newQuantity
        });

    } catch (error) {
        console.error(
            "Update cart item error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update cart item"
        });

    } finally {
        connection.release();
    }
};


// ==========================================
// REMOVE ITEM FROM CART
// ==========================================

const removeCartItem = async (req, res) => {
    try {
        const userId = req.user.id;

        const { productId } =
            req.params;

        const [carts] =
            await pool.query(
                `SELECT id
                 FROM cart
                 WHERE user_id = ?`,
                [userId]
            );

        if (carts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const cartId =
            carts[0].id;

        const [result] =
            await pool.query(
                `DELETE FROM cart_items

                 WHERE cart_id = ?
                 AND product_id = ?`,
                [
                    cartId,
                    productId
                ]
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Product is not in your cart"
            });
        }

        res.json({
            success: true,
            message:
                "Product removed from cart successfully"
        });

    } catch (error) {
        console.error(
            "Remove cart item error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to remove cart item"
        });
    }
};


// ==========================================
// CLEAR CART
// ==========================================

const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const [carts] =
            await pool.query(
                `SELECT id
                 FROM cart
                 WHERE user_id = ?`,
                [userId]
            );

        if (carts.length === 0) {
            return res.json({
                success: true,
                message: "Cart is already empty"
            });
        }

        const cartId =
            carts[0].id;

        await pool.query(
            `DELETE FROM cart_items
             WHERE cart_id = ?`,
            [cartId]
        );

        res.json({
            success: true,
            message:
                "Cart cleared successfully"
        });

    } catch (error) {
        console.error(
            "Clear cart error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to clear cart"
        });
    }
};


module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
};