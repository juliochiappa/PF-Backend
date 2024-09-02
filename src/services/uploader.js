import multer from 'multer';
import config from '../config.js';
import path from 'path';


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const subFolder = path.basename(req.path); 
        const uploadPath = path.join(config.UPLOAD_DIR, subFolder); 
        cb(null, uploadPath); 
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);  
    }
});


export const uploader = multer({ storage: storage });
