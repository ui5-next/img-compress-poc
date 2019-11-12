# Image Compress POC

[![Netlify Status](https://api.netlify.com/api/v1/badges/f007d90f-49c9-4cf8-8ccb-ec83533c4eaf/deploy-status)](https://img-compress.demo.netlify.fornever.org)

POC Project for pure frontend image compress

## Points

* Use [JIMP](https://github.com/oliver-moran/jimp) (MIT) to compress images.
* Overwrite the `FileUploader.getProcessedBlobsFromArray` to replace the `Blob` objects which will be uploaded.

## Risk

Please ensure `Blob`, `FileReader`, `Promise`, `File`, `Buffer` objects are available in runtime, if NOT exists, please catch error and downgrade to normal process.

## Demo

[![](https://res.cloudinary.com/digf90pwi/image/upload/v1573539377/2019-11-12_14-15-55_ggmfdh.png)](https://img-compress.demo.netlify.fornever.org)

