const router = require('express').Router()
const cloudinary = require('cloudinary')
const auth = require('../middleware/auth')
const authAdmin = require('../middleware/authAdmin')
const fs = require('fs')

// we will upload image on cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
})

const MAX_FILE_SIZE_BYTES = 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png'])
const CLOUDINARY_FOLDER = 'test'

function hasUploadedFiles(req) {
  return Boolean(req.files && Object.keys(req.files).length > 0)
}

function getUploadedFile(req) {
  return req.files.file
}

function isFileTooLarge(file) {
  return file.size > MAX_FILE_SIZE_BYTES
}

function isMimeTypeAllowed(file) {
  return ALLOWED_MIME_TYPES.has(file.mimetype)
}

async function removeTmp(path) {
  try {
    await fs.promises.unlink(path)
  } catch (err) {
    // Keep original behavior: if unlink fails, surface error.
    throw err
  }
}

async function uploadToCloudinary(tempFilePath) {
  return cloudinary.v2.uploader.upload(tempFilePath, { folder: CLOUDINARY_FOLDER })
}

async function destroyFromCloudinary(publicId) {
  return cloudinary.v2.uploader.destroy(publicId)
}

// Upload image only admin can use
router.post('/upload', auth, authAdmin, async (req, res) => {
  try {
    if (!hasUploadedFiles(req)) {
      return res.status(400).json({ msg: 'No files were uploaded.' })
    }

    const file = getUploadedFile(req)

    if (isFileTooLarge(file)) {
      await removeTmp(file.tempFilePath)
      return res.status(400).json({ msg: 'Size too large' })
    }

    if (!isMimeTypeAllowed(file)) {
      await removeTmp(file.tempFilePath)
      return res.status(400).json({ msg: 'File format is incorrect.' })
    }

    const result = await uploadToCloudinary(file.tempFilePath)
    await removeTmp(file.tempFilePath)

    return res.json({ public_id: result.public_id, url: result.secure_url })
  } catch (err) {
    return res.status(500).json({ msg: err.message })
  }
})

// Delete image only admin can use
router.post('/destroy', auth, authAdmin, async (req, res) => {
  try {
    const { public_id } = req.body

    if (!public_id) {
      return res.status(400).json({ msg: 'No images Selected' })
    }

    await destroyFromCloudinary(public_id)
    return res.json({ msg: 'Deleted Image' })
  } catch (err) {
    return res.status(500).json({ msg: err.message })
  }
})

module.exports = router