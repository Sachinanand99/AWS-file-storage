const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const {
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/awsConfig");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { ensureAuthenticated } = require("../middleware/auth");

router.post("/upload", fileController.uploadFile, fileController.handleUpload);

router.get("/upload",ensureAuthenticated, (req, res) => {
  res.render("layout", {
    content: "upload",
    message: null,
    user: req.user || null,
  });
});

router.get("/files",ensureAuthenticated, async (req, res) => {
  try {
    const prefix = `${req.user.id}/`;
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3.send(listCommand);
    const files = response.Contents || [];

    const links = await Promise.all(
      files.map(async (file) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: file.Key,
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 86400 });
        return {
          name: file.Key.replace(prefix, ""),
          url,
        };
      })
    );

    res.render("layout", {
      content: "files",
      links,
      user: req.user,
    });
  } catch (err) {
    console.error("Error listing files:", err);
    res.status(500).send("Failed to retrieve file list");
  }
});

router.post("/delete/:filename", async (req, res) => {
  try {
    const key = `${req.user.id}/${req.params.filename}`;

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    await s3.send(command);
    res.redirect("/files");
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).send("Failed to delete file");
  }
});

router.get("/file/:filename", fileController.getFile);
router.get("/share/:filename", fileController.generateShareableLink);

module.exports = router;
