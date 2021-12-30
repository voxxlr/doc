# Voxxlr _doc_ SDK

Voxxlr is a cloud platform to develop and host web applications for geospatial content. It consists of a processing pipeline for different input formats and a web interface to visualize datasets in a browser and develop custom Apps. The platform is comprised of several repositories:

| Repo        | Description |
| :---        |    :----   |
| **doc**      | **The _doc_ SDK renders a dataset in an iframe and provides a messaging API**       |
| app      | The _app_ SDK provides high level components to manage multiple datasets and develop Apps.   |
| processor    | The _processor_ converts geospatial datasets into the format required by the _doc_ sdk  |

A complete version of Voxxlr is hosted at https://www.voxxlr.com. Follow the links below for a few sample Apps developed with Voxxlr. 

| Link        | Description | Image |
| :---        |    :----   |  :----   |
| https://app.voxxlr.com/1624016067425 | Explore, dissect and analyze 3D models. This dataset was upload to Voxxlr as an IFC file exported from AutoCAD. | ![](https://voxxlr.github.io/www/images/bim.webp) |
| https://app.voxxlr.com/1620825035265 | Perform inspections on photogrammetry datasets. The photogrammetry was performed using Pix4d. Images, point cloud and camera metric were then upload to Voxxlr | ![](https://voxxlr.github.io/www/images/inspector.webp)  |
| https://app.voxxlr.com/1623155297253 | Measure aggregate volumes and take elevation profiles in a drone map. The orthomosaic image and digital elevation model were uploaded to Voxxlr as geotiff files. | ![](https://voxxlr.github.io/www/images/volumetric.webp)  |

Either the entire platform or indivdual components such as data processing and storage can be hosted on private infrastructure and seamlessly integrated with the hosted version at Voxxlr. For more information contact info@voxxlr.com.

## Running the doc server

After cloning this repo run there are two ways to run the doc server on a local machine. The server requires a path to a directory (DATA_DIR) containing datasets previsously processed using the [_processor_](https://github.com/voxxlr/processor).  


#### Nodejs

Nodejs and npm must be installed.

```javascript
cd doc
npm  install
node server.js DATA_DIR
```

#### Docker

Docker engine must be installed.

```javascript
cd doc
docker-build.sh
docker-run.sh DATA_DIR
```





## Building the doc server

The repository contains three index.html files
```
doc/1d/index.html
doc/2d/index.html
doc/3d/index.html
```

which contain the viewers for panoramas, maps and 3d point clouds / CAD files. Running the integrated build system via

```java
java -jar build.jar
```

generates three versions of each html file

| File        | Description |
| :---        |    :----   |
| index.**min**.html    | All javascript code is inlined and optimized using the google closure compiler. References to the original .js files are lost. |
| index.**dev**.html    | Loads the javascript files from 127.0.0.1:3000 for a local development using the server.js file mentioned above |

## License
The Voxxlr _doc_ SDK is licensed under the Affero GPL V3 license.

