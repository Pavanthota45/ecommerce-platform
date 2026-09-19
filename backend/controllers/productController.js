const pool = require("../config/db");


// ======================================================
// GET ALL PRODUCTS
// Supports:
// search
// category_id
// min_price
// max_price
// brand
// sort
// ======================================================

const getProducts = async (req, res) => {
    try {
        const {
            search,
            category_id,
            min_price,
            max_price,
            brand,
            sort
        } = req.query;

        let query = `
            SELECT
                p.id,
                p.category_id,
                p.name,
                p.description,
                p.brand,
                p.price,
                p.discount_price,
                p.sku,
                p.status,
                p.created_at,

                c.name AS category_name,

                pi.image_url,

                COALESCE(i.stock_quantity, 0) AS stock_quantity,
                COALESCE(i.reserved_quantity, 0) AS reserved_quantity,

                (
                    COALESCE(i.stock_quantity, 0)
                    -
                    COALESCE(i.reserved_quantity, 0)
                ) AS available_stock

            FROM products p

            LEFT JOIN categories c
                ON p.category_id = c.id

            LEFT JOIN product_images pi
                ON p.id = pi.product_id
                AND pi.is_primary = 1

            LEFT JOIN inventory i
                ON p.id = i.product_id

            WHERE p.status = 'active'
        `;

        const queryParams = [];


        // ==================================================
        // SEARCH
        // ==================================================

        if (search && search.trim() !== "") {

            query += `
                AND (
                    p.name LIKE ?
                    OR p.description LIKE ?
                    OR p.brand LIKE ?
                    OR p.sku LIKE ?
                    OR c.name LIKE ?
                )
            `;

            const searchValue = `%${search.trim()}%`;

            queryParams.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );
        }


        // ==================================================
        // CATEGORY FILTER
        // ==================================================

        if (category_id) {

            const categoryId = Number(category_id);

            if (
                !Number.isInteger(categoryId) ||
                categoryId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category ID."
                });
            }

            query += `
                AND p.category_id = ?
            `;

            queryParams.push(categoryId);
        }


        // ==================================================
        // MINIMUM PRICE
        // ==================================================

        if (min_price !== undefined) {

            const minPrice = Number(min_price);

            if (
                Number.isNaN(minPrice) ||
                minPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid minimum price."
                });
            }

            query += `
                AND COALESCE(
                    p.discount_price,
                    p.price
                ) >= ?
            `;

            queryParams.push(minPrice);
        }


        // ==================================================
        // MAXIMUM PRICE
        // ==================================================

        if (max_price !== undefined) {

            const maxPrice = Number(max_price);

            if (
                Number.isNaN(maxPrice) ||
                maxPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid maximum price."
                });
            }

            query += `
                AND COALESCE(
                    p.discount_price,
                    p.price
                ) <= ?
            `;

            queryParams.push(maxPrice);
        }


        // ==================================================
        // BRAND FILTER
        // ==================================================

        if (brand && brand.trim() !== "") {

            query += `
                AND p.brand = ?
            `;

            queryParams.push(
                brand.trim()
            );
        }


        // ==================================================
        // SORTING
        // ==================================================

        switch (sort) {

            case "price_asc":

                query += `
                    ORDER BY
                        COALESCE(
                            p.discount_price,
                            p.price
                        ) ASC
                `;

                break;


            case "price_desc":

                query += `
                    ORDER BY
                        COALESCE(
                            p.discount_price,
                            p.price
                        ) DESC
                `;

                break;


            case "name_asc":

                query += `
                    ORDER BY
                        p.name ASC
                `;

                break;


            case "name_desc":

                query += `
                    ORDER BY
                        p.name DESC
                `;

                break;


            case "newest":

                query += `
                    ORDER BY
                        p.created_at DESC
                `;

                break;


            case "oldest":

                query += `
                    ORDER BY
                        p.created_at ASC
                `;

                break;


            default:

                query += `
                    ORDER BY
                        p.created_at DESC
                `;

                break;
        }


        // ==================================================
        // EXECUTE QUERY
        // ==================================================

        const [products] = await pool.query(
            query,
            queryParams
        );


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {

        console.error(
            "Get products error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products."
        });
    }
};



// ======================================================
// GET PRODUCT BY ID
// ======================================================

const getProductById = async (req, res) => {

    try {

        const productId = Number(
            req.params.id
        );


        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }


        const [products] = await pool.query(
            `
            SELECT
                p.id,
                p.category_id,
                p.name,
                p.description,
                p.brand,
                p.price,
                p.discount_price,
                p.sku,
                p.status,
                p.created_at,

                c.name AS category_name,

                COALESCE(
                    i.stock_quantity,
                    0
                ) AS stock_quantity,

                COALESCE(
                    i.reserved_quantity,
                    0
                ) AS reserved_quantity,

                (
                    COALESCE(
                        i.stock_quantity,
                        0
                    )
                    -
                    COALESCE(
                        i.reserved_quantity,
                        0
                    )
                ) AS available_stock

            FROM products p

            LEFT JOIN categories c
                ON p.category_id = c.id

            LEFT JOIN inventory i
                ON p.id = i.product_id

            WHERE p.id = ?
            `,
            [productId]
        );


        if (products.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }


        const product = products[0];


        // Get all product images

        const [images] = await pool.query(
            `
            SELECT
                id,
                image_url,
                is_primary
            FROM product_images
            WHERE product_id = ?
            ORDER BY
                is_primary DESC,
                id ASC
            `,
            [productId]
        );


        product.images = images;


        return res.status(200).json({
            success: true,
            product
        });

    } catch (error) {

        console.error(
            "Get product by ID error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product."
        });
    }
};



// ======================================================
// CREATE PRODUCT
// ADMIN ONLY
// ======================================================

const createProduct = async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        const {
            category_id,
            name,
            description,
            brand,
            price,
            discount_price,
            sku,
            status,
            stock_quantity
        } = req.body;


        if (
            !category_id ||
            !name ||
            price === undefined ||
            !sku
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Category, name, price and SKU are required."
            });
        }


        const categoryId =
            Number(category_id);

        const productPrice =
            Number(price);

        const discountPrice =
            discount_price === null ||
            discount_price === undefined ||
            discount_price === ""
                ? null
                : Number(discount_price);

        const stockQuantity =
            stock_quantity === undefined ||
            stock_quantity === ""
                ? 0
                : Number(stock_quantity);


        if (
            !Number.isInteger(categoryId) ||
            categoryId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID."
            });
        }


        if (
            Number.isNaN(productPrice) ||
            productPrice < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product price."
            });
        }


        if (
            discountPrice !== null &&
            (
                Number.isNaN(discountPrice) ||
                discountPrice < 0 ||
                discountPrice > productPrice
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Discount price must be between 0 and the original price."
            });
        }


        if (
            !Number.isInteger(stockQuantity) ||
            stockQuantity < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock quantity."
            });
        }


        // Check category

        const [categories] =
            await connection.query(
                `
                SELECT id
                FROM categories
                WHERE id = ?
                `,
                [categoryId]
            );


        if (categories.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }


        // Check SKU

        const [existingSku] =
            await connection.query(
                `
                SELECT id
                FROM products
                WHERE sku = ?
                `,
                [sku]
            );


        if (existingSku.length > 0) {

            return res.status(409).json({
                success: false,
                message: "SKU already exists."
            });
        }


        await connection.beginTransaction();


        const [result] =
            await connection.query(
                `
                INSERT INTO products
                (
                    category_id,
                    name,
                    description,
                    brand,
                    price,
                    discount_price,
                    sku,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    categoryId,
                    name,
                    description || null,
                    brand || null,
                    productPrice,
                    discountPrice,
                    sku,
                    status === "inactive"
                        ? "inactive"
                        : "active"
                ]
            );


        const productId =
            result.insertId;


        await connection.query(
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


        await connection.commit();


        return res.status(201).json({
            success: true,
            message: "Product created successfully.",
            product: {
                id: productId,
                category_id: categoryId,
                name,
                description:
                    description || null,
                brand:
                    brand || null,
                price: productPrice,
                discount_price:
                    discountPrice,
                sku,
                status:
                    status === "inactive"
                        ? "inactive"
                        : "active",
                stock_quantity:
                    stockQuantity
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Create product error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create product."
        });

    } finally {

        connection.release();
    }
};



// ======================================================
// UPDATE PRODUCT
// ADMIN ONLY
// ======================================================

const updateProduct = async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        const productId =
            Number(req.params.id);


        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }


        const {
            category_id,
            name,
            description,
            brand,
            price,
            discount_price,
            sku,
            status,
            stock_quantity
        } = req.body;


        const [existingProducts] =
            await connection.query(
                `
                SELECT *
                FROM products
                WHERE id = ?
                `,
                [productId]
            );


        if (existingProducts.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }


        const existingProduct =
            existingProducts[0];


        const categoryId =
            category_id === undefined
                ? existingProduct.category_id
                : Number(category_id);


        const productName =
            name === undefined
                ? existingProduct.name
                : name;


        const productDescription =
            description === undefined
                ? existingProduct.description
                : description;


        const productBrand =
            brand === undefined
                ? existingProduct.brand
                : brand;


        const productPrice =
            price === undefined
                ? Number(existingProduct.price)
                : Number(price);


        const discountPrice =
            discount_price === undefined
                ? existingProduct.discount_price
                : (
                    discount_price === null ||
                    discount_price === ""
                        ? null
                        : Number(discount_price)
                );


        const productSku =
            sku === undefined
                ? existingProduct.sku
                : sku;


        const productStatus =
            status === undefined
                ? existingProduct.status
                : status;


        if (
            !Number.isInteger(categoryId) ||
            categoryId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID."
            });
        }


        if (
            !productName ||
            productName.trim() === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Product name is required."
            });
        }


        if (
            Number.isNaN(productPrice) ||
            productPrice < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product price."
            });
        }


        if (
            discountPrice !== null &&
            (
                Number.isNaN(discountPrice) ||
                discountPrice < 0 ||
                discountPrice > productPrice
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Discount price must be between 0 and the original price."
            });
        }


        if (
            !["active", "inactive"]
                .includes(productStatus)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product status."
            });
        }


        // Check category

        const [categories] =
            await connection.query(
                `
                SELECT id
                FROM categories
                WHERE id = ?
                `,
                [categoryId]
            );


        if (categories.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }


        // Check SKU

        const [existingSku] =
            await connection.query(
                `
                SELECT id
                FROM products
                WHERE sku = ?
                AND id != ?
                `,
                [
                    productSku,
                    productId
                ]
            );


        if (existingSku.length > 0) {

            return res.status(409).json({
                success: false,
                message: "SKU already exists."
            });
        }


        await connection.beginTransaction();


        await connection.query(
            `
            UPDATE products
            SET
                category_id = ?,
                name = ?,
                description = ?,
                brand = ?,
                price = ?,
                discount_price = ?,
                sku = ?,
                status = ?
            WHERE id = ?
            `,
            [
                categoryId,
                productName,
                productDescription || null,
                productBrand || null,
                productPrice,
                discountPrice,
                productSku,
                productStatus,
                productId
            ]
        );


        // Update inventory only when supplied

        if (
            stock_quantity !== undefined
        ) {

            const stockQuantity =
                Number(stock_quantity);


            if (
                !Number.isInteger(stockQuantity) ||
                stockQuantity < 0
            ) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid stock quantity."
                });
            }


            const [inventory] =
                await connection.query(
                    `
                    SELECT
                        reserved_quantity
                    FROM inventory
                    WHERE product_id = ?
                    `,
                    [productId]
                );


            if (inventory.length === 0) {

                await connection.query(
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

                const reservedQuantity =
                    Number(
                        inventory[0]
                            .reserved_quantity
                    );


                if (
                    stockQuantity <
                    reservedQuantity
                ) {

                    await connection.rollback();

                    return res.status(400).json({
                        success: false,
                        message:
                            "Stock cannot be lower than reserved quantity."
                    });
                }


                await connection.query(
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
        }


        await connection.commit();


        return res.status(200).json({
            success: true,
            message:
                "Product updated successfully."
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Update product error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update product."
        });

    } finally {

        connection.release();
    }
};



// ======================================================
// DELETE PRODUCT
// ADMIN ONLY
// ======================================================

const deleteProduct = async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        const productId =
            Number(req.params.id);


        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }


        const [products] =
            await connection.query(
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


        // Don't delete products that have
        // already been used in orders.

        const [orderItems] =
            await connection.query(
                `
                SELECT id
                FROM order_items
                WHERE product_id = ?
                LIMIT 1
                `,
                [productId]
            );


        if (orderItems.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "This product cannot be deleted because it exists in an order. Set the product to inactive instead."
            });
        }


        await connection.beginTransaction();


        await connection.query(
            `
            DELETE FROM product_images
            WHERE product_id = ?
            `,
            [productId]
        );


        await connection.query(
            `
            DELETE FROM inventory
            WHERE product_id = ?
            `,
            [productId]
        );


        await connection.query(
            `
            DELETE FROM products
            WHERE id = ?
            `,
            [productId]
        );


        await connection.commit();


        return res.status(200).json({
            success: true,
            message:
                "Product deleted successfully."
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Delete product error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete product."
        });

    } finally {

        connection.release();
    }
};



module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};