# Image Compress POC

[![Netlify Status](https://api.netlify.com/api/v1/badges/f007d90f-49c9-4cf8-8ccb-ec83533c4eaf/deploy-status)](https://img-compress.demo.netlify.fornever.org)

POC Project for pure frontend image compress

## Points

* Use [JIMP](https://github.com/oliver-moran/jimp) (MIT) to compress images, and developer can download release version from [unpkg](https://unpkg.com/jimp@0.8.5/browser/lib/jimp.min.js).
* Overwrite the `FileUploader.getProcessedBlobsFromArray` to replace the `Blob` objects which will be uploaded.

Core Code

```javascript
  async getProcessedBlobsFromArray(aBlobs: FileList): Promise<Blob[]> {
    return Promise.all(Array.from(aBlobs).map(async oBlob => {
      try {

        if (oBlob.type.startsWith("image")) {
          // is image
          const fBuffer = await oBlob.arrayBuffer();
          // YOU Must ensure the JIMP object is available in global env.
          // eslint-disable-next-line no-undef
          const img = await Jimp.read(fBuffer);

          let targetWidth = this.getMaxWidth();

          let compressedImg = img;

          if (img.bitmap.width > targetWidth) {
            compressedImg = img.resize(targetWidth, -1);
          }

          compressedImg = compressedImg.quality(this.getQuality());

          const compressedBuffer = await compressedImg.getBufferAsync(oBlob.type);

          const newBlob = new Blob([compressedBuffer], { type: oBlob.type });
          // assign file.name to blob
          newBlob.name = oBlob.name;

          // Sometimes the compressed image will be larger than the original size
          if(newBlob.size > oBlob.size){
            return oBlob;
          } else {
            return newBlob;
          }

        } else {
          // no image
          return oBlob;
        }

      } catch (err) {
        // compress failed, downgrade to original blob file
        MessageToast.show(`compress img failed, ${err}`);
        return oBlob;
      }
    }));
  }
```

## Risk

Please ensure `Blob`, `FileReader`, `Promise`, `File`, `Buffer` objects are available in runtime, if NOT exists, please catch error and downgrade to normal process.

## Demo

[![](https://res.cloudinary.com/digf90pwi/image/upload/v1573539377/2019-11-12_14-15-55_ggmfdh.png)](https://img-compress.demo.netlify.fornever.org)

