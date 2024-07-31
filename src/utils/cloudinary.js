import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

  // Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:  process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filePath) =>{
    try {
        console.log("FilePath:",filePath)
        if(!filePath) return null
        const uploadedFile = await cloudinary.uploader.upload(filePath,{
            resource_type:"auto"  //auto will automatically detect if uploaded file is image,video,pdf etc
        })

        console.log("File have been uploaded:",uploadedFile.url)
        return uploadedFile
    } catch (error) {
        console.log("Attempting to upload file from path:", filePath);
        fs.unlinkSync(filePath);  //remove the locally saved tempOrary file as the upload operation got failed
        console.log("File Uploading got failed")
        return null
    }
}

export {uploadOnCloudinary};