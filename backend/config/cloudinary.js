import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let storage;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'placeholder'
) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'clothing_ecommerce',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
  });
  console.log('Cloudinary Storage Configured Successfully.');
} else {
  // Fallback to local storage if Cloudinary is not configured
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    },
  });
  console.warn('WARNING: Cloudinary credentials missing or placeholders used. Falling back to local disk storage in /uploads.');
}

const upload = multer({ storage });

export { cloudinary, upload };
export default upload;
