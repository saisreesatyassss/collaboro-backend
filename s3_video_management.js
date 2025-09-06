require('dotenv').config();
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

console.log(process.env.AWS_ACCESS_KEY_ID);
console.log(process.env.AWS_SECRET_ACCESS_KEY);

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Upload video to S3
async function uploadVideo(bucketName, key, fileContent) {
    try {
        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: fileContent,
            ContentType: 'video/mp4',  
            Metadata: {
                mash: 'true'
            }
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`Video uploaded successfully: ${key}`);
        return key;
    } catch (error) {
        console.error('Error uploading video:', error);
        throw error;
    }
}


async function getVideoUrl(bucketName, key) {
    try {
        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
        console.error('Error generating video URL:', error);
        throw error;
    }
}


async function deleteVideo(bucketName, key) {
    try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
        console.log(`Video deleted successfully: ${key}`);
    } catch (error) {
        console.error('Error deleting video:', error);
        throw error;
    }
}
async function getFileUrl(bucketName, key) {
    try {
        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
        console.error('Error generating file URL:', error);
        throw error;
    }
}

// Upload image to S3 (handles jpeg, png, webp, etc.)
async function uploadImage(bucketName, key, fileContent, mimetype = 'image/jpeg') {
    try {
        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: fileContent,
            ContentType: mimetype, // dynamic based on file
            Metadata: {
                mash: 'true'
            }
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`Image uploaded successfully: ${key}`);
        return key;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}


module.exports = { uploadVideo, getVideoUrl, deleteVideo ,uploadImage,getFileUrl};
