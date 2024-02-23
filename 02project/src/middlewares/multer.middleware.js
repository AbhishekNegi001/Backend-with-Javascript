import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) // just for practice purpose, filename should be unique as it can override your other file
    }
  })
  
export const upload = multer({ storage: storage })