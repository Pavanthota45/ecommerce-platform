const Tesseract = require("tesseract.js");

/**
 * Extract text from a payment screenshot using OCR.
 *
 * @param {string} imagePath - Full path to the uploaded image.
 * @returns {Promise<string>} Extracted OCR text.
 */
const extractTextFromPaymentScreenshot = async (imagePath) => {
    try {
        console.log("Starting OCR for payment screenshot...");
        console.log("Image:", imagePath);

        const result = await Tesseract.recognize(
            imagePath,
            "eng",
            {
                logger: (info) => {
                    if (info.status === "recognizing text") {
                        const progress =
                            Math.round((info.progress || 0) * 100);

                        console.log(
                            `OCR progress: ${progress}%`
                        );
                    }
                }
            }
        );

        const text = result?.data?.text || "";

        console.log("OCR completed.");

        return text.trim();
    } catch (error) {
        console.error(
            "Payment screenshot OCR error:",
            error
        );

        throw new Error(
            "Unable to read payment screenshot"
        );
    }
};

/**
 * Normalize OCR text.
 *
 * This removes unnecessary whitespace while preserving
 * the actual text extracted from the payment screenshot.
 *
 * @param {string} text
 * @returns {string}
 */
const normalizeOcrText = (text) => {
    if (!text) {
        return "";
    }

    return String(text)
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

/**
 * Try to extract a UTR / transaction / reference number
 * from OCR text.
 *
 * This function checks several common labels used by
 * UPI apps and banking applications.
 *
 * @param {string} ocrText
 * @returns {{
 *   transactionId: string|null,
 *   matchedLabel: string|null
 * }}
 */
const extractTransactionId = (ocrText) => {
    const text = normalizeOcrText(ocrText);

    if (!text) {
        return {
            transactionId: null,
            matchedLabel: null
        };
    }

    const patterns = [
        {
            label: "UTR",
            regex:
                /\bUTR(?:\s*(?:NO|NUMBER|ID|REF(?:ERENCE)?))?\s*[:#-]?\s*([A-Z0-9]{6,40})\b/i
        },
        {
            label: "Transaction ID",
            regex:
                /\bTRANSACTION\s*(?:ID|NO|NUMBER)?\s*[:#-]?\s*([A-Z0-9]{6,40})\b/i
        },
        {
            label: "Transaction Reference",
            regex:
                /\bTRANSACTION\s*REFERENCE\s*(?:ID|NO|NUMBER)?\s*[:#-]?\s*([A-Z0-9]{6,40})\b/i
        },
        {
            label: "Reference Number",
            regex:
                /\bREFERENCE\s*(?:NO|NUMBER|ID)?\s*[:#-]?\s*([A-Z0-9]{6,40})\b/i
        },
        {
            label: "UPI Reference",
            regex:
                /\bUPI\s*(?:REFERENCE|REF)\s*(?:NO|NUMBER|ID)?\s*[:#-]?\s*([A-Z0-9]{6,40})\b/i
        },
        {
            label: "UPI Transaction ID",
            regex:
                /\bUPI\s*TRANSACTION\s*(?:ID|NO|NUMBER)?\s*[:#-]?\s*([A-Z0-9]{6,40})\b/i
        }
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern.regex);

        if (match && match[1]) {
            const transactionId = cleanTransactionId(
                match[1]
            );

            if (transactionId) {
                return {
                    transactionId,
                    matchedLabel: pattern.label
                };
            }
        }
    }

    // --------------------------------------------------------
    // Try line-by-line extraction.
    //
    // OCR sometimes places the label on one line and the
    // transaction number on the next line.
    // --------------------------------------------------------
    const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    const labelPatterns = [
        {
            label: "UTR",
            regex: /\bUTR\b/i
        },
        {
            label: "Transaction ID",
            regex: /\bTRANSACTION\s*(?:ID|NO|NUMBER)\b/i
        },
        {
            label: "Transaction Reference",
            regex: /\bTRANSACTION\s*(?:REFERENCE|REF)\b/i
        },
        {
            label: "Reference Number",
            regex: /\bREFERENCE\s*(?:NO|NUMBER|ID)\b/i
        },
        {
            label: "UPI Reference",
            regex: /\bUPI\s*(?:REFERENCE|REF)\b/i
        }
    ];

    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i];

        for (const labelPattern of labelPatterns) {
            if (!labelPattern.regex.test(currentLine)) {
                continue;
            }

            // ------------------------------------------------
            // Check text after the label on the same line.
            // ------------------------------------------------
            const afterLabel = currentLine
                .replace(
                    labelPattern.regex,
                    ""
                )
                .replace(
                    /^[\s:#\-]+/,
                    ""
                )
                .trim();

            if (afterLabel) {
                const candidate =
                    findTransactionCandidate(
                        afterLabel
                    );

                if (candidate) {
                    return {
                        transactionId: candidate,
                        matchedLabel:
                            labelPattern.label
                    };
                }
            }

            // ------------------------------------------------
            // Check the next few lines.
            // ------------------------------------------------
            for (
                let next = i + 1;
                next < Math.min(i + 4, lines.length);
                next++
            ) {
                const candidate =
                    findTransactionCandidate(
                        lines[next]
                    );

                if (candidate) {
                    return {
                        transactionId: candidate,
                        matchedLabel:
                            labelPattern.label
                    };
                }
            }
        }
    }

    return {
        transactionId: null,
        matchedLabel: null
    };
};

/**
 * Find a likely transaction ID inside a string.
 *
 * @param {string} value
 * @returns {string|null}
 */
const findTransactionCandidate = (value) => {
    if (!value) {
        return null;
    }

    const cleaned = String(value)
        .replace(/[^A-Z0-9]/gi, " ")
        .trim();

    if (!cleaned) {
        return null;
    }

    const candidates = cleaned
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean);

    for (const candidate of candidates) {
        const normalized =
            cleanTransactionId(candidate);

        if (!normalized) {
            continue;
        }

        // A transaction/reference number should generally
        // contain digits and be at least 6 characters long.
        if (
            normalized.length >= 6 &&
            normalized.length <= 40 &&
            /\d/.test(normalized)
        ) {
            return normalized;
        }
    }

    return null;
};

/**
 * Clean a transaction ID.
 *
 * @param {string} value
 * @returns {string|null}
 */
const cleanTransactionId = (value) => {
    if (!value) {
        return null;
    }

    const cleaned = String(value)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .trim();

    if (!cleaned) {
        return null;
    }

    if (cleaned.length < 6) {
        return null;
    }

    if (cleaned.length > 40) {
        return null;
    }

    if (!/\d/.test(cleaned)) {
        return null;
    }

    return cleaned;
};

/**
 * Complete payment screenshot processing.
 *
 * @param {string} imagePath
 * @returns {Promise<{
 *   text: string,
 *   transactionId: string|null,
 *   matchedLabel: string|null
 * }>}
 */
const processPaymentScreenshot = async (imagePath) => {
    const rawText =
        await extractTextFromPaymentScreenshot(
            imagePath
        );

    const text =
        normalizeOcrText(rawText);

    const {
        transactionId,
        matchedLabel
    } =
        extractTransactionId(text);

    return {
        text,
        transactionId,
        matchedLabel
    };
};

module.exports = {
    extractTextFromPaymentScreenshot,
    normalizeOcrText,
    extractTransactionId,
    processPaymentScreenshot
};