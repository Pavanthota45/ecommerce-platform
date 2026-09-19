const pool = require("../config/db");

// ==========================================
// GET MY WISHLIST
// ==========================================
const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        const [wishlistRows] = await pool.query(
            "SELECT id FROM wishlist WHERE user_id = ?",
            [userId]
        );

        if (wishlistRows.length === 0) {
            return res.status(200).json({
                success: true,
                wishlist: [],
                count: 0
            });
        }

        const wishlistId = wishlistRows[0].id;

        const [items] = await pool.query(
            `
            SELECT
                wi.id AS wishlist_item_id,
                p.id AS product_id,
                p.name,
                p.description,
                p.brand,
                p.price,
                p.discount_price,
                p.status,
                c.name AS category_name,
                pi.image_url,
                i.stock_quantity,
                i.reserved_quantity
            FROM wishlist_items wi
            INNER JOIN products p
                ON wi.product_id = p.id
            LEFT JOIN categories c
                ON p.category_id = c.id
            LEFT JOIN product_images pi
                ON p.id = pi.product_id
                AND pi.is_primary = 1
            LEFT JOIN inventory i
                ON p.id = i.product_id
            WHERE wi.wishlist_id = ?
            ORDER BY wi.id DESC
            `,
            [wishlistId]
        );

        const formattedWishlist = items.map((item) => ({
            ...item,
            available_stock: Math.max(
                0,
                Number(item.stock_quantity || 0) -
                Number(item.reserved_quantity || 0)
            )
        }));

        res.status(200).json({
            success: true,
            wishlist: formattedWishlist,
            count: formattedWishlist.length
        });

    } catch (error) {
        console.error("Get wishlist error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load wishlist.",
            error: error.message
        });
    }
};


// ==========================================
// ADD PRODUCT TO WISHLIST
// ==========================================
const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required."
            });
        }

        // Check product
        const [productRows] = await pool.query(
            `
            SELECT id, name, status
            FROM products
            WHERE id = ?
            `,
            [product_id]
        );

        if (productRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        if (productRows[0].status !== "active") {
            return res.status(400).json({
                success: false,
                message: "This product is currently unavailable."
            });
        }

        // Find user's wishlist
        let [wishlistRows] = await pool.query(
            `
            SELECT id
            FROM wishlist
            WHERE user_id = ?
            `,
            [userId]
        );

        let wishlistId;

        // Create wishlist if it doesn't exist
        if (wishlistRows.length === 0) {
            const [wishlistResult] = await pool.query(
                `
                INSERT INTO wishlist (user_id)
                VALUES (?)
                `,
                [userId]
            );

            wishlistId = wishlistResult.insertId;
        } else {
            wishlistId = wishlistRows[0].id;
        }

        // Check if product already exists
        const [existingRows] = await pool.query(
            `
            SELECT id
            FROM wishlist_items
            WHERE wishlist_id = ?
            AND product_id = ?
            `,
            [wishlistId, product_id]
        );

        if (existingRows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Product is already in your wishlist."
            });
        }

        // Add product
        await pool.query(
            `
            INSERT INTO wishlist_items
            (wishlist_id, product_id)
            VALUES (?, ?)
            `,
            [wishlistId, product_id]
        );

        res.status(201).json({
            success: true,
            message: "Product added to wishlist successfully."
        });

    } catch (error) {
        console.error("Add wishlist error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add product to wishlist.",
            error: error.message
        });
    }
};


// ==========================================
// REMOVE PRODUCT FROM WISHLIST
// ==========================================
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const [wishlistRows] = await pool.query(
            `
            SELECT id
            FROM wishlist
            WHERE user_id = ?
            `,
            [userId]
        );

        if (wishlistRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Wishlist not found."
            });
        }

        const wishlistId = wishlistRows[0].id;

        const [result] = await pool.query(
            `
            DELETE FROM wishlist_items
            WHERE wishlist_id = ?
            AND product_id = ?
            `,
            [wishlistId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product is not in your wishlist."
            });
        }

        res.status(200).json({
            success: true,
            message: "Product removed from wishlist successfully."
        });

    } catch (error) {
        console.error("Remove wishlist error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to remove product from wishlist.",
            error: error.message
        });
    }
};


// ==========================================
// CHECK IF PRODUCT IS IN WISHLIST
// ==========================================
const checkWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const [rows] = await pool.query(
            `
            SELECT wi.id
            FROM wishlist_items wi
            INNER JOIN wishlist w
                ON wi.wishlist_id = w.id
            WHERE w.user_id = ?
            AND wi.product_id = ?
            `,
            [userId, productId]
        );

        res.status(200).json({
            success: true,
            in_wishlist: rows.length > 0
        });

    } catch (error) {
        console.error("Check wishlist error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to check wishlist.",
            error: error.message
        });
    }
};


module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlist
};