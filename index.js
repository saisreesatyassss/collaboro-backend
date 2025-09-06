

// server.js
const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db');  
const cors = require('cors');   
const axios = require('axios');  
const path = require('path');
const { uploadVideo, getVideoUrl, deleteVideo ,uploadImage,getFileUrl} = require('./s3_video_management');
const multer = require('multer'); 
const authRoutes = require('./routes/auth');

const projectRoutes = require('./routes/projects');


 
const bucketName = process.env.AWS_BUCKET_NAME;


const app = express();
const port = 3000;

 
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);  
  },
  credentials: true,  
}));



app.use(bodyParser.json());

app.use(bodyParser.json({ limit: "120mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "120mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 113 * 1024 * 1024 } // 113 MB
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

app.get('/', (req, res) => {
  res.send('Hello collaboro backend');
});

app.use('/auth', authRoutes);

app.use('/projects', projectRoutes);




 

 
 

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
