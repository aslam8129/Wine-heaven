const multer = require('multer');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // directory to save uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // add a timestamp to the file name
    }
});

const uploads = multer({ storage: storage }); 
 
module.exports = uploads.array('images', 10);
