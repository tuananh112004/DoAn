const multer  = require('multer')
module.exports = ()=>{
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, './public/uploads')
        },
        filename: function (req, file, cb) {
          const uniqueSuffix = Date.now() + '-' + file.originalname;
          cb(null, uniqueSuffix)
        }
      })
      return storage;
}