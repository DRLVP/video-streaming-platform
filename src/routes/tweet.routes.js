import { Router } from "express";
import {createTweet, getUserTweets, updateTweet, deleteTweet} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.use(verifyJWT);
router.route("/create-tweet").post(createTweet);
router.route('/user-tweets/:userId').get(getUserTweets);

router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;