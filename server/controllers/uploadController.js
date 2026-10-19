// const mongoose = require("mongoose");
// const cloudinary = require("../config/cloudinary");
// const { getReviewEligibility } = require("../utils/reviewEligibility");

// const toDataURI = (file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

// // @route POST /api/upload   (Admin/Staff)  — multipart form-data, field name "images"
// const uploadImages = async (req, res, next) => {
//   try {
//     const files = req.files || [];
//     if (files.length === 0) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     const uploads = await Promise.all(
//       files.map((file) =>
//         cloudinary.uploader.upload(toDataURI(file), {
//           folder: "ecommerce",
//         })
//       )
//     );

//     const urls = uploads.map((u) => u.secure_url);
//     res.status(201).json({ urls });
//   } catch (error) {
//     next(error);
//   }
// };

// // @route POST /api/upload/avatar   (Koi bhi logged-in user)  — field name "image"
// const uploadAvatar = async (req, res, next) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     const result = await cloudinary.uploader.upload(toDataURI(req.file), {
//       folder: "ecommerce/avatars",
//     });

//     res.status(201).json({ url: result.secure_url });
//   } catch (error) {
//     next(error);
//   }
// };

// // @route POST /api/upload/review   (Customer)  — fields: productId, images (3 tak)
// // Sirf us customer ke liye jo product khareed chuka ho aur abhi review na likha ho
// const uploadReviewImages = async (req, res, next) => {
//   try {
//     const { productId } = req.body;
//     const files = req.files || [];

//     if (!productId || !mongoose.isValidObjectId(productId)) {
//       return res.status(400).json({ message: "A valid product is required" });
//     }
//     if (files.length === 0) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     const eligibility = await getReviewEligibility(req.user._id, productId);
//     if (!eligibility.canReview) {
//       return res.status(403).json({
//         message: "You can only add photos to a review of a product you have received and not yet reviewed",
//       });
//     }

//     const uploads = await Promise.all(
//       files.map((file) =>
//         cloudinary.uploader.upload(toDataURI(file), {
//           folder: "ecommerce/reviews",
//         })
//       )
//     );

//     res.status(201).json({ urls: uploads.map((u) => u.secure_url) });
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = { uploadImages, uploadAvatar, uploadReviewImages };



const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const { getReviewEligibility } = require("../utils/reviewEligibility");

const toDataURI = (file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

// Cloudinary ke errors "Error" nahi, saade object hote hain. Unhein samajh aane wale message mein badalte hain.
const friendlyUploadError = (error) => {
  const raw = String(error?.message || error?.error?.message || error || "");
  const code = error?.http_code;
  const netCodes = ["ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "EAI_AGAIN"];

  if (
    code === 401 ||
    code === 403 ||
    /must supply|invalid api_key|invalid signature|unknown api key|cloud_name mismatch|account.*disabled/i.test(raw)
  ) {
    return "The image service rejected our login. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env, then restart the server.";
  }
  if (/stale request/i.test(raw)) {
    return "Your computer's date and time are out of sync. Turn on automatic time in Windows settings and try again.";
  }
  if (netCodes.includes(error?.code) || /ENOTFOUND|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|socket hang up|timeout/i.test(raw)) {
    return "Could not reach the image service. Check your internet connection (or VPN / antivirus) and try again.";
  }
  if (/file size too large/i.test(raw)) {
    return "This image is too large for the image service.";
  }
  if (/invalid image file|not a valid image|unsupported/i.test(raw)) {
    return "This file is not a valid image.";
  }
  return "Image upload failed. Please try again.";
};

const uploadToCloudinary = async (file, folder) => {
  try {
    return await cloudinary.uploader.upload(toDataURI(file), { folder });
  } catch (error) {
    // Asli wajah server ke terminal mein
    console.error("Cloudinary upload failed:", error?.http_code || "", error?.message || error);
    const wrapped = new Error(friendlyUploadError(error));
    wrapped.status = 400;
    wrapped.expose = true;
    throw wrapped;
  }
};

// @route POST /api/upload   (Admin/Staff)  — multipart form-data, field name "images"
const uploadImages = async (req, res, next) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploads = await Promise.all(files.map((file) => uploadToCloudinary(file, "ecommerce")));
    res.status(201).json({ urls: uploads.map((u) => u.secure_url) });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/upload/avatar   (Koi bhi logged-in user)  — field name "image"
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadToCloudinary(req.file, "ecommerce/avatars");
    res.status(201).json({ url: result.secure_url });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/upload/review   (Customer)  — fields: productId, images (3 tak)
// Sirf us customer ke liye jo product khareed chuka ho aur abhi review na likha ho
const uploadReviewImages = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const files = req.files || [];

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "A valid product is required" });
    }
    if (files.length === 0) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const eligibility = await getReviewEligibility(req.user._id, productId);
    if (!eligibility.canReview) {
      return res.status(403).json({
        message: "You can only add photos to a review of a product you have received and not yet reviewed",
      });
    }

    const uploads = await Promise.all(files.map((file) => uploadToCloudinary(file, "ecommerce/reviews")));
    res.status(201).json({ urls: uploads.map((u) => u.secure_url) });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImages, uploadAvatar, uploadReviewImages };