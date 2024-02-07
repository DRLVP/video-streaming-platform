import multer from "multer";



const storage = multer.diskStorage({
    // (req) mane jitu useror pora body ahibo JSON formatot ba beleg formatot tat file access natha k haibabe ami multer ba express file upload package use koru jar usorot (file) tur access tha k
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  })
  
export const upload = multer({ 
    storage
})