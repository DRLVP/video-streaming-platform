// prothome ami multeror joriyote userok file upload koruam ru ata temopary copy local storage ot thom tar pasot he cloudinaryt upload korim aru cloudinaryt upload korar pasot tempory file tu remove kori dim---:: tempory copy aikarone rokha hoi jodi file upload korute kiba problem hoi tatia reuploador hubidha userok dibole.

// Prothome file amar servero loi jabo mane Local Storageoloi jabo ru tar pasot local path loi he ami file cloudinaryt upload kori dim.

import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRECT_KEY
});

// create cloudinary upload method
const uploadCloudinary = async(localFilePath)=>{
    try {
        if (!localFilePath) return null;
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        });
    
        // file has been upload successfully
        // console.log("file is upload successfully", response.url );
        fs.unlinkSync(localFilePath);
        console.log(response);
        return response;
        
    } catch (error) {
        // remove file saved in local server in temporily , when file upload is failed
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export {uploadCloudinary};
