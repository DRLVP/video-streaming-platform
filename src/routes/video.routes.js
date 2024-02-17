import { Router } from "express";
import {
    getAllvideos,
    publishAVideo,
    updateVideo,
    deleteVideo,
    getVideoById,
    togglePublishStatus
} from "../controllers/video.controller";
import {veryfyJWT} from "../middlewares/auth.middleware.js"
import {multer} from "../middlewares/multer.middleware.js"

const router = Router();

router.use(veryfyJWT);

router
   .route("/allVideos")
   .get(getAllvideos)
   .post(
      upload.fields([
         {
            name: "videoFile",
            maxCount: 1,
         },
         {
            name: "thumbnail",
            maxCount: 1,
         },
      ]),
      publishAVideo
   );

router
   .route("/:videoId")
   .patch(upload.single("thumbnail"), updateVideo)
   .delete(deleteVideo)
   .get(getVideoById);

router.route("/togglePublish/:videoId").patch(togglePublishStatus);

export default router;
