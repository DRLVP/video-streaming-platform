import { Router } from "express";
import { registerUser, loginUser , logoutUser} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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

// login route
router.route("/login").post(loginUser);

// secured route
router.route("/logout").post(verifyJWT, logoutUser);
export default router;