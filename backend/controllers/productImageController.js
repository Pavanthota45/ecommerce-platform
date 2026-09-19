const pool = require("../config/db");


// ==========================================
// GET ALL IMAGES FOR A PRODUCT
// ==========================================

const getProductImages = async (req, res) => {
    try {

        const { productId } = req.params;

        // Check whether product exists
        const [products] = await pool.query(
            "SELECT id, name FROM products WHERE id = ?",
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Get product images
        const [images] = await pool.query(
            `SELECT
                id,
                product_id,
                image_url,
                is_primary
             FROM product_images
             WHERE product_id = ?
             ORDER BY is_primary DESC, id ASC`,
            [productId]
        );

        res.json({
            success: true,
            product: products[0],
            count: images.length,
            images
        });

    } catch (error) {

        console.error(
            "Get product images error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch product images"
        });
    }
};


// ==========================================
// ADD PRODUCT IMAGE
// ==========================================

const addProductImage = async (req, res) => {
    try {

        const { productId } = req.params;

        const {
            image_url,
            is_primary
        } = req.body;


        // Validate image URL
        if (!image_url || !image_url.trim()) {

            return res.status(400).json({
                success: false,
                message: "Image URL is required"
            });
        }


        // Check product
        const [products] = await pool.query(
            "SELECT id FROM products WHERE id = ?",
            [productId]
        );

        if (products.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        // Check existing images
        const [existingImages] = await pool.query(
            `SELECT id
             FROM product_images
             WHERE product_id = ?`,
            [productId]
        );


        /*
         * If this is the first image,
         * automatically make it primary.
         */
        let primaryValue = false;

        if (existingImages.length === 0) {
            primaryValue = true;
        } else if (is_primary === true) {

            // Remove primary status from other images

            await pool.query(
                `UPDATE product_images
                 SET is_primary = FALSE
                 WHERE product_id = ?`,
                [productId]
            );

            primaryValue = true;

        } else {
            primaryValue = false;
        }


        // Insert image
        const [result] = await pool.query(
            `INSERT INTO product_images
            (
                product_id,
                image_url,
                is_primary
            )
            VALUES (?, ?, ?)`,
            [
                productId,
                image_url.trim(),
                primaryValue
            ]
        );


        res.status(201).json({
            success: true,
            message: "Product image added successfully",
            image: {
                id: result.insertId,
                product_id: Number(productId),
                image_url: image_url.trim(),
                is_primary: primaryValue
            }
        });

    } catch (error) {

        console.error(
            "Add product image error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to add product image"
        });
    }
};


// ==========================================
// SET PRIMARY IMAGE
// ==========================================

const setPrimaryImage = async (req, res) => {
    const connection = await pool.getConnection();

    try {

        const {
            productId,
            imageId
        } = req.params;


        // Check image
        const [images] = await connection.query(
            `SELECT id
             FROM product_images
             WHERE id = ?
             AND product_id = ?`,
            [
                imageId,
                productId
            ]
        );


        if (images.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Product image not found"
            });
        }


        await connection.beginTransaction();


        // Remove primary from all product images

        await connection.query(
            `UPDATE product_images
             SET is_primary = FALSE
             WHERE product_id = ?`,
            [productId]
        );


        // Set selected image as primary

        await connection.query(
            `UPDATE product_images
             SET is_primary = TRUE
             WHERE id = ?
             AND product_id = ?`,
            [
                imageId,
                productId
            ]
        );


        await connection.commit();


        res.json({
            success: true,
            message: "Primary image updated successfully"
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Set primary image error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to set primary image"
        });

    } finally {

        connection.release();

    }
};


// ==========================================
// DELETE PRODUCT IMAGE
// ==========================================

const deleteProductImage = async (req, res) => {
    const connection = await pool.getConnection();

    try {

        const {
            productId,
            imageId
        } = req.params;


        // Find image
        const [images] = await connection.query(
            `SELECT
                id,
                image_url,
                is_primary
             FROM product_images
             WHERE id = ?
             AND product_id = ?`,
            [
                imageId,
                productId
            ]
        );


        if (images.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Product image not found"
            });
        }


        const image = images[0];


        await connection.beginTransaction();


        // Delete image

        await connection.query(
            `DELETE FROM product_images
             WHERE id = ?
             AND product_id = ?`,
            [
                imageId,
                productId
            ]
        );


        /*
         * If the deleted image was primary,
         * automatically select another image
         * as the primary image.
         */

        if (image.is_primary) {

            const [remainingImages] =
                await connection.query(
                    `SELECT id
                     FROM product_images
                     WHERE product_id = ?
                     ORDER BY id ASC
                     LIMIT 1`,
                    [productId]
                );


            if (remainingImages.length > 0) {

                await connection.query(
                    `UPDATE product_images
                     SET is_primary = TRUE
                     WHERE id = ?`,
                    [
                        remainingImages[0].id
                    ]
                );
            }
        }


        await connection.commit();


        res.json({
            success: true,
            message: "Product image deleted successfully"
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Delete product image error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete product image"
        });

    } finally {

        connection.release();

    }
};


module.exports = {
    getProductImages,
    addProductImage,
    setPrimaryImage,
    deleteProductImage
};