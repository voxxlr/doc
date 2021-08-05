# Voxxlr Doc SDK

Voxxlr is a cloud platform to develop and host web applications around geospatial content. It consists of server side software to process data in the cloud and client software to visualize the results in the browser. A complete version of Voxxlr running the main branches of the repos listed below can be found at https://www.voxxlr.com. 

| Repo        | Description |
| :---        |    :----   |
| **doc**      | **The doc SDK renders a dataset in an iframe that provides a messaging Api**       |
| app      | The app SDK provides high level components to manage multiple datasets and develop apps.   |
| cloud    | The cloud SDK provides software to process geospatial datasets on linux or windows  |

You can fully host the cloud platform on your own infrastructure or integrate seamlessly with the hosted version at https://www.voxxlr.com. Follow the links below for a few sample Apps developed with Voxxlr.

| Link        | Description |
| :---        |    :----   |
| https://app.voxxlr.com/1624016067425   | BIM Viewer  |
| https://app.voxxlr.com/1620825035265   | Inspector App  |
| https://app.voxxlr.com/1623155297253   | Volumetric App  |



## Installation
After cloning this repo run 

```javascript
node server.js 
```
And point the browser to either of 

```
http://127.0.0.1:3000/cloud
http://127.0.0.1:3000/model
http://127.0.0.1:3000/map
http://127.0.0.1:3000/panorama
```
The datasets displayed are from the sandbox account at voxxlr, but the code producing the visualization is loaded from your local directory. 


## Building

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

generates three version of each html file

| File        | Description |
| :---        |    :----   |
| index.min.html    | All javascript code is inlined and optimized using the google closure compiler. References to the original .js files are lost. |
| index.hub.html    | Loads the javascript files from the main branch off this github repository. This index file will work standalone without a reference to a local copies of the .js file |
| index.dev.html    | Loads the javascript files from 127.0.0.1:3000 for a local development using the server.js file mentioned above |


## Hosting

The _doc_ SDK is designed to be loaded into an iframe and controlled via a message API. The source of the iframe must be one of the index.html files created during the build process. An initial dataset can either be loaded with the index file by replacing the _{{{content}}}_ mustache tag with a json object describing a document or, after the iframe has loaded, by sending a message  containing the root object. 


For a documentation of the messaging API and a interactive fiddles visit https://www.voxxlr.com/api.html


## License
The Voxxlr App SDK is licensed under the Affero GPL V3 license.

