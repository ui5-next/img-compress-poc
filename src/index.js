import Core from "sap/ui/core/Core";
import App from "sap/m/App";
import Page from "sap/m/Page";
import ResponsiveSplitter from "sap/ui/layout/ResponsiveSplitter";
import PaneContainer from "sap/ui/layout/PaneContainer";
import SplitPane from "sap/ui/layout/SplitPane";
import Image from "sap/m/Image";
import JSONModel from "sap/ui/model/json/JSONModel";
import SimpleForm from "sap/ui/layout/form/SimpleForm";
import Label from "sap/m/Label";
import Input from "sap/m/Input";
import Button from "sap/m/Button";
import MessageToast from "sap/m/MessageToast";
import { CompressFileUploader } from "./CompressFileUploader";
import FlexBox from "sap/m/FlexBox";
import FlexDirection from "sap/m/FlexDirection";
import FlexJustifyContent from "sap/m/FlexJustifyContent";
import Link from "sap/m/Link";
import includeScript from "sap/ui/dom/includeScript";
import SplitterLayoutData from "sap/ui/layout/SplitterLayoutData";
import Switch from "sap/m/Switch";
import InputType from "sap/m/InputType";
import Integer from "sap/ui/model/type/Integer";


Core.attachInit(async() => {

  // loading the JIMP library from unpkg
  await includeScript({ url: "https://unpkg.com/jimp@0.8.5/browser/lib/jimp.min.js" });

  // init store and state
  const store = new JSONModel({
    maxWidth: 720,
    quality: 70,
    fakeUpload: true,
    originalSrc: "",
    originalSize: 0,
    compressedSrc: "",
    compressedSize: 0,
    compressRate: 100,
    selectedFile: null,
    readingData: false,
    compressInProgress: false,
    projectLink: "https://github.com/ui5-next/img-compress-poc"
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

  const actionSetReadingData = (busy = true) => {
    store.setProperty("/readingData", busy);
  };

  const actionCompressFile = async(selectedFile: File) => {
    actionSetCompressStatus(true);
    try {
      const frBuffer = await selectedFile.arrayBuffer();
      // eslint-disable-next-line no-undef
      const img = await Jimp.read(frBuffer);

      const originalSrc = store.getProperty("/originalSrc");
      const originalSrcSize = originalSrc.length;

      let targetWidth = store.getProperty("/maxWidth");
      let compressedImg = img;

      if (img.bitmap.width > targetWidth) {
        compressedImg = img.resize(targetWidth, -1);
      }

      compressedImg = compressedImg.quality(store.getProperty("/quality"));
      let compressedDataURL = await compressedImg.getBase64Async(selectedFile.type);

      if (compressedDataURL.length > originalSrcSize) {
        compressedDataURL = originalSrc;
      }

      store.setProperty("/compressedSrc", compressedDataURL);
      store.setProperty("/compressedSize", compressedDataURL.length);

      const compressRate = ((compressedDataURL.length / originalSrcSize) * 100).toFixed(4);

      store.setProperty("/compressRate", compressRate);

      MessageToast.show(`Compress rate: ${compressRate}%`, { duration: 6 * 1000 });

    } catch (error) {

      // failed
      MessageToast.show(`Compress failed: ${error}`);

    }

    actionSetCompressStatus(false);

  };

  const actionOnFileSelected = async(e) => {
    const selectedFile: File = e.getParameter("files")[0];
    if (selectedFile) {
      actionSetReadingData(true);
      const dataURL = await readDataURLFromFile(selectedFile);
      store.setProperty("/originalSrc", dataURL);
      store.setProperty("/originalSize", dataURL.length);
      store.setProperty("/selectedFile", selectedFile);
      actionSetReadingData(false);

      await actionCompressFile(selectedFile);
    }
  };

  const actionOnCompressBtnPress = async() => {
    const file = store.getProperty("/selectedFile");
    await actionCompressFile(file);
  };


  const actionOnImgClick = (e) => {
    const img = e.getSource().getDomRef();
    if (img) {
      img.requestFullscreen();
    }
  };

  const app: App = <App
    pages={
      <Page showHeader={false}>
        <ResponsiveSplitter
          rootPaneContainer={
            <PaneContainer
              panes={[
                <SplitPane layoutData={<SplitterLayoutData size="25%" />}>
                  <Page title="Image Compress POC" headerContent={<Link text="Github" href="{/projectLink}" target="_blank" />} >
                    <SimpleForm layout="ResponsiveGridLayout" editable={true} >
                      <Label>Image</Label>
                      <CompressFileUploader
                        name="file"
                        sendXHR={true}
                        width="100%"
                        placeholder="Select an image"
                        fileType={["jpg", "jpeg", "png", "gif"]}
                        change={actionOnFileSelected}
                        uploadOnChange="{/fakeUpload}"
                        compress={true}
                        maxWidth={{ path: "/maxWidth", type: <Integer /> }}
                        quality={{ path: "/quality", type: <Integer /> }}
                      />
                      <Label>Max Width</Label>
                      <Input value={{ path: "/maxWidth", type: <Integer /> }} type={InputType.Number} />

                      <Label>Quality</Label>
                      <Input value={{ path: "/quality", type: <Integer /> }} type={InputType.Number} />

                      <Label tooltip="uploader will do upload after file selected" >Enable Fake Upload</Label>
                      <Switch state="{/fakeUpload}" />

                      <Label />
                      <Button
                        text="Do compress"
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
                      <Page title="Original Image" busyIndicatorDelay={0} busy="{/readingData}">
                        <FlexBox width="100%" height="100%" direction={FlexDirection.Row} justifyContent={FlexJustifyContent.Center}
                          items={[
                            <Image src="{/originalSrc}" height="99%" press={actionOnImgClick} />
                          ]}
                        />
                      </Page>
                    </SplitPane>,
                    <SplitPane>
                      <Page
                        title="Compressed Image ({/compressRate}%) "
                        busy="{/compressInProgress}"
                        busyIndicatorDelay={0}
                      >
                        <FlexBox width="100%" height="100%" direction={FlexDirection.Row} justifyContent={FlexJustifyContent.Center}
                          items={[
                            <Image src="{/compressedSrc}" height="99%" press={actionOnImgClick} />
                          ]}
                        />
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

  // stop/hide the loading spinner in the screen center
  if (window.loadingSpinner) {
    window.loadingSpinner.stop();
  }

});
