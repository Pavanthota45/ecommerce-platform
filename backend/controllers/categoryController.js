const pool = require("../config/db");

// ===============================
// GET ALL CATEGORIES
// ===============================

const getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(
            `SELECT
                id,
                name,
                description,
                image_url,
                created_at
             FROM categories
             ORDER BY name ASC`
        );

        res.json({
            success: true,
            count: categories.length,
            categories
        });

    } catch (error) {
        console.error("Get categories error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch categories"
        });
    }
};


// ===============================
// GET CATEGORY BY ID
// ===============================

const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const [categories] = await pool.query(
            `SELECT
                id,
                name,
                description,
                image_url,
                created_at
             FROM categories
             WHERE id = ?`,
            [id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({
            success: true,
            category: categories[0]
        });

    } catch (error) {
        console.error("Get category error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch category"
        });
    }
};


// ===============================
// CREATE CATEGORY
// ===============================

const createCategory = async (req, res) => {
    try {
        const {
            name,
            description,
            image_url
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const [existingCategories] = await pool.query(
            "SELECT id FROM categories WHERE name = ?",
            [name.trim()]
        );

        if (existingCategories.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Category already exists"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO categories
            (name, description, image_url)
            VALUES (?, ?, ?)`,
            [
                name.trim(),
                description || null,
                image_url || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category: {
                id: result.insertId,
                name: name.trim(),
                description: description || null,
                image_url: image_url || null
            }
        });

    } catch (error) {
        console.error("Create category error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create category"
        });
    }
};


// ===============================
// UPDATE CATEGORY
// ===============================

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            description,
            image_url
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const [existingCategory] = await pool.query(
            "SELECT id FROM categories WHERE id = ?",
            [id]
        );

        if (existingCategory.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const [duplicate] = await pool.query(
            `SELECT id
             FROM categories
             WHERE name = ?
             AND id != ?`,
            [name.trim(), id]
        );

        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Another category with this name already exists"
            });
        }

        await pool.query(
            `UPDATE categories
             SET name = ?,
                 description = ?,
                 image_url = ?
             WHERE id = ?`,
            [
                name.trim(),
                description || null,
                image_url || null,
                id
            ]
        );

        res.json({
            success: true,
            message: "Category updated successfully"
        });

    } catch (error) {
        console.error("Update category error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update category"
        });
    }
};


// ===============================
// DELETE CATEGORY
// ===============================

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const [category] = await pool.query(
            "SELECT id FROM categories WHERE id = ?",
            [id]
        );

        if (category.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Check whether products use this category
        const [products] = await pool.query(
            "SELECT id FROM products WHERE category_id = ? LIMIT 1",
            [id]
        );

        if (products.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete category because products are using it"
            });
        }

        await pool.query(
            "DELETE FROM categories WHERE id = ?",
            [id]
        );

        res.json({
            success: true,
            message: "Category deleted successfully"
        });

    } catch (error) {
        console.error("Delete category error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete category"
        });
    }
};


module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};