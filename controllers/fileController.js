const multer = require("multer");
const fs = require("fs");
const path = require("path");
const s3 = require("../config/awsConfig");
const { Upload } = require("@aws-sdk/lib-storage");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const multerUpload = multer({ dest: "uploads/" });
exports.uploadFile = multerUpload.single("file");

exports.handleUpload = async (req, res) => {
  const localPath = req.file.path; 

  try {
    const fileStream = fs.createReadStream(localPath);

    const s3Upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${req.user.id}/${req.file.originalname}`,
        Body: fileStream,
      },
    });

    const result = await s3Upload.done();

    res.render("layout", {
      content: "upload",
      message: `File uploaded successfully: ${result.Location}`,
      user: req.user,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Upload failed");
  } finally {
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  }
};

const s3StreamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
};

exports.getFile = async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: req.params.filename,
    });

    const response = await s3.send(command);
    const fileData = await s3StreamToString(response.Body);

    res.send(fileData);
  } catch (err) {
    console.error("Error fetching file:", err);
    res.status(500).send("Failed to retrieve file");
  }
};

exports.generateShareableLink = async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: req.params.filename,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 86400 });

    res.render("layout", {
      content: "files",
      link: url,
      user: req.user,
    });
  } catch (err) {
    console.error("Error generating link:", err);
    res.status(500).send("Failed to generate shareable link");
  }
};
