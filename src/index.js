/* eslint-disable no-undef */
import Core from "sap/ui/core/Core";
import App from "sap/m/App";
import Page from "sap/m/Page";
import ResponsiveSplitter from "sap/ui/layout/ResponsiveSplitter";
import PaneContainer from "sap/ui/layout/PaneContainer";
import SplitPane from "sap/ui/layout/SplitPane";
import FileUploader from "sap/ui/commons/FileUploader";
import Image from "sap/m/Image";
import includeScript from "sap/ui/dom/includeScript";
import JSONModel from "sap/ui/model/json/JSONModel";
import SimpleForm from "sap/ui/layout/form/SimpleForm";
import Label from "sap/m/Label";
import Input from "sap/m/Input";
import Button from "sap/m/Button";
import InputType from "sap/m/InputType";
import NumberFormat from "sap/ui/core/format/NumberFormat";


Core.attachInit(async() => {

  // await jimp load finished
  await includeScript({ url: "https://unpkg.com/jimp@0.8.5/browser/lib/jimp.js" });


  // init store and state
  const store = new JSONModel({
    maxWidth: 720,
    quality: 90,
    originalSrc: "",
    originalSize: 0,
    compressedSrc: "",
    compressedSize: 0,
    selectedFile: null,
    compressInProgress: false
  });

  const readDataURLFromFile = (file: File) => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = e => resolve(e.target.result);
    fr.onerror = err => reject(err);
    fr.readAsDataURL(file);
  });

  const actionCompressFile = async(selectedFile: File) => {
    store.setProperty("/compressInProgress", true);
    const frBuffer = await selectedFile.arrayBuffer();
    const img = await Jimp.read(frBuffer);
    const compressedImg = img
      .resize(parseInt(store.getProperty("/maxWidth"), 10), Jimp.AUTO)
      .quality(parseInt(store.getProperty("/quality"), 10));
    const compressedDataURL = await compressedImg.getBase64Async(img.getMIME());
    store.setProperty("/compressedSrc", compressedDataURL);
    store.setProperty("/compressedSize", compressedDataURL.length);
    store.setProperty("/compressInProgress", false);

  };

  const app: App = <App
    busyIndicatorDelay={0}
    pages={
      <Page showHeader={false}>
        <ResponsiveSplitter
          rootPaneContainer={
            <PaneContainer
              panes={[
                <SplitPane >
                  <Page title="Image Compress POC">
                    <SimpleForm layout="ResponsiveGridLayout" editable={true} >
                      <Label>Image</Label>
                      <FileUploader
                        width="100%"
                        placeholder="Select an image"
                        fileType={["jpg", "png", "gif"]}
                        change={async(e) => {
                          const selectedFile: File = e.getParameter("files")[0];
                          if (selectedFile) {
                            app.setBusy(true);
                            const dataURL = await readDataURLFromFile(selectedFile);
                            store.setProperty("/originalSrc", dataURL);
                            store.setProperty("/originalSize", dataURL.length);
                            store.setProperty("/selectedFile", selectedFile);

                            await actionCompressFile(selectedFile);
                            app.setBusy(false);
                          }
                        }}
                      />
                      <Label>Max Width</Label>
                      <Input value="{/maxWidth}" />

                      <Label>Quality</Label>
                      <Input value="{/quality}" type={InputType.Number} dateFormat={NumberFormat} />

                      <Label />
                      <Button
                        text="Do Compress"
                        press={async() => {
                          const file = store.getProperty("/selectedFile");
                          await actionCompressFile(file);
                        }}
                      />

                    </SimpleForm>
                  </Page>
                </SplitPane>,
                <PaneContainer
                  orientation="Vertical"
                  panes={[
                    <SplitPane>
                      <Page title="Original Image ({/originalSize})">
                        <Image src="{/originalSrc}" height="99%" />
                      </Page>
                    </SplitPane>,
                    <SplitPane>
                      <Page
                        title="Compressed Image ({/compressedSize})"
                        busy="{/compressInProgress}"
                        busyIndicatorDelay={0}
                      >
                        <Image src="{/compressedSrc}" height="99%" />
                      </Page>
                    </SplitPane>
                  ]}
                />

              ]}
            />
          }
        />
      </Page>
    }
  />;

  app.setModel(store).placeAt("content");

});
