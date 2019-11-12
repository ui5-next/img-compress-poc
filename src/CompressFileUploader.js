import FileUploader from "sap/ui/unified/FileUploader";
import containsOrEquals from "sap/ui/dom/containsOrEquals";


interface Props {
  /**
   * compress images,
   * only support xhr, so that must set the 'sendXHR' as true to use this feature
   */
  compress: Boolean;
  /**
   * if compress, this width will be the max width of the image
   */
  maxWidth: Number;
  /**
   * if compress, this quality will be used to compress file
   */
  quality: Number;
}

export class CompressFileUploader extends FileUploader<Props> {

  metadata = {
    properties: {
      compress: {
        type: "boolean",
        defaultValue: false
      },
      maxWidth: {
        type: "int",
        defaultValue: 1080
      },
      quality: {
        type: "int",
        defaultValue: 80
      }
    }
  }

  init() {
    super.init(this, arguments);
  }

  _checkCompressAvailable(): Boolean {
    // please ensure Blob, FileReader, Buffer class is existed
    return true;
  }

  // overwrite
  setValue(sValue, bFireEvent, bSupressFocus) {
    var oldValue = this.getValue();
    var oFiles;
    if ((oldValue != sValue) || this.getSameFilenameAllowed()) {
      // only upload when a valid value is set
      var bUpload = this.getUploadOnChange() && sValue;
      // when we do not upload we re-render (cause some browsers don't like
      // to change the value of file uploader INPUT elements)
      this.setProperty("value", sValue, bUpload);
      if (this.oFilePath) {
        this.oFilePath.setValue(sValue);
        //refocus the Button, except bSupressFocus is set
        if (this.oBrowse.getDomRef() && !bSupressFocus && containsOrEquals(this.getDomRef(), document.activeElement)) {
          this.oBrowse.focus();
        }
      }
      var oForm = this.getDomRef("fu_form"),
        sapMInnerInput = this.getDomRef("fu_input-inner");
      // reset the input fields if setValue("") is called, also for undefined and null
      if (this.oFileUpload && /* is visible: */ oForm && !sValue) {
        // some browsers do not allow to clear the value of the fileuploader control
        // therefore we utilize the form and reset the values inside this form and
        // apply the additionalData again afterwards
        oForm.reset();
        this.getDomRef("fu_input").value = "";
        //if the sap.m library is used, we also need to clear the inner input-field of sap.m.Input
        if (sapMInnerInput) {
          sapMInnerInput.value = "";
        }
        //keep the additional data on the form
        jQuery(this.FUDataEl).val(this.getAdditionalData());
      }
      // only fire event when triggered by user interaction
      if (bFireEvent) {
        if (window.File) {
          oFiles = this.FUEl.files;
        }
        if (!this.getSameFilenameAllowed() || sValue) {
          this.fireChange({ id: this.getId(), newValue: sValue, files: oFiles });
        }
      }
      if (bUpload) {
        this.upload(this.getCompress()); // UPDATED Line
      }
    }
    return this;
  }

  async getProcessedBlobsFromArray(aBlobs: Blob[] = []): Promise<Blob[]> {
    return Promise.all(Array.from(aBlobs).map(async oBlob => {
      try {
        // is image
        if (oBlob.type.startsWith("image")) {
          const fBuffer = await oBlob.arrayBuffer();
          // YOU Must ensure the JIMP object is available in global env.
          // eslint-disable-next-line no-undef
          const img = await Jimp.read(fBuffer);
          let targetWidth = this.getMaxWidth();
          if (img.bitmap.width < targetWidth) {
            targetWidth = img.bitmap.width;
          }
          const compressedBuffer = await img.resize(targetWidth, -1).quality(this.getQuality()).getBufferAsync(img.getMIME());
          const newBlob = new Blob([compressedBuffer], { type: oBlob.type });
          newBlob.name = oBlob.name;
          return newBlob;
        } else {
          return oBlob;
        }

      } catch (err) {
        // compress failed
        return oBlob;
      }
    }));
  }


  renderer = "sap.ui.unified.FileUploaderRenderer"

}


