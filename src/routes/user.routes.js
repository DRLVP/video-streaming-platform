import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields(
        [
            { name: "avatar", maxCount: 1 }, // Only the first file in each field will be used
            {name:"coverImage", maxCount:1}
        ]
    ),
    registerUser
    
)


export default router;