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
import MessageToast from "sap/m/MessageToast";


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

  const actionSetCompressStatus = (busy = true) => {
    store.setProperty("/compressInProgress", busy);
  };

  const actionCompressFile = async(selectedFile: File) => {
    actionSetCompressStatus(true);

    const frBuffer = await selectedFile.arrayBuffer();
    // eslint-disable-next-line no-undef
    const img = await Jimp.read(frBuffer);
    const compressedImg = img
      .resize(parseInt(store.getProperty("/maxWidth"), 10), -1) // -1 means auto
      .quality(parseInt(store.getProperty("/quality"), 10));
    const compressedDataURL = await compressedImg.getBase64Async(img.getMIME());

    store.setProperty("/compressedSrc", compressedDataURL);
    store.setProperty("/compressedSize", compressedDataURL.length);
    actionSetCompressStatus(false);

    const compressRate = (compressedDataURL.length / store.getProperty("/originalSrc").length);

    MessageToast.show(`Rate: ${compressRate.toFixed(3)}%`);
  };



  const actionOnFileSelected = async(e) => {
    const selectedFile: File = e.getParameter("files")[0];
    if (selectedFile) {
      const dataURL = await readDataURLFromFile(selectedFile);
      store.setProperty("/originalSrc", dataURL);
      store.setProperty("/originalSize", dataURL.length);
      store.setProperty("/selectedFile", selectedFile);

      await actionCompressFile(selectedFile);
    }
  };

  const actionOnCompressBtnPress = async() => {
    const file = store.getProperty("/selectedFile");
    await actionCompressFile(file);
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
                        change={actionOnFileSelected}
                      />
                      <Label>Max Width</Label>
                      <Input value="{/maxWidth}" />

                      <Label>Quality</Label>
                      <Input value="{/quality}" type={InputType.Number} dateFormat={NumberFormat} />

                      <Label />
                      <Button
                        text="Do Compress"
                        enabled={{ path: "/selectedFile", formatter: v => !!v }}
                        press={actionOnCompressBtnPress}
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
