const router = require("express").Router();
const { getVideoInfo } = require("../controllers/videoInfo.controller");

router.post("/", getVideoInfo);

module.exports = router;