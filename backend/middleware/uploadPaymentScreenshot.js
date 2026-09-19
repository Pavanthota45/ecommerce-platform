const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================================
// PAYMENT SCREENSHOT UPLOAD DIRECTORY
// =====================================================

const uploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "payment-screenshots"
);

// Create the directory automatically if it does not exist
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(
            file.originalname
        ).toLowerCase();

        const uniqueName =
            `payment_${Date.now()}_${Math.round(
                Math.random() * 1000000
            )}${extension}`;

        cb(null, uniqueName);
    }
});

// =====================================================
// FILE TYPE VALIDATION
// =====================================================

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            ),
            false
        );
    }
};

// =====================================================
// MULTER UPLOAD CONFIGURATION
// =====================================================

const uploadPaymentScreenshot = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// =====================================================
// EXPORT
// =====================================================

module.exports = uploadPaymentScreenshot;