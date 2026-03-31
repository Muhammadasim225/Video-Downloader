// src/routes/downloads.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const { downloadStore } = require("../utils/downloadStore");

const router = express.Router();

router.get("/:token", (req, res) => {
  const { token } = req.params;
  const file = downloadStore.get(token);

  if (!file) return res.status(404).json({ success: false, message: "Invalid token" });
  if (!file.ready) return res.status(202).json({ success: false, message: "File not ready yet" });

  res.download(file.path, file.originalName);
});

module.exports = router;