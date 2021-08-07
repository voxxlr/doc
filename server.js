const http = require('http');
const https = require('https');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

function getData(accessToken)
{
    const meta = JSON.stringify({})

    const options = 
    {
        hostname: 'doc.voxxlr.com',
        port: 443,
        path: '/load',
        method: 'POST',
        headers: 
        {
            'Content-Type': 'application/json',
            'Content-Length': meta.length,
            'Authorization' : `Bearer ${accessToken}`
        }
    }

    return new Promise((resolve, reject) => 
    {
        process.env["NODE_NO_WARNINGS"] = 1;
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
        const req = https.request(options, res => 
        {
            res.on('data', d => 
            {
                resolve(d)
            })
        })
    
        req.on('error', error => 
        {
            reject(null);
        })
    
        req.write(meta)
        req.end()
    });
}


const server = http.createServer(async (req, res) => 
{
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');

    try 
    {
        let token;
        let file;
         
        switch (req.url) 
        {
            case "/model":
                token = "qGs+QOpsIjVvPKU2RQ4aBw==.eyJpIjoxNjAyNDQxNzA2Nzg0LCJ1IjoiaHR0cHM6Ly9zdG9yYWdlLmdvb2dsZWFwaXMuY29tL3ZveHhsci0xNTA2NjA4MTEwMzYwLzE2MDI0NDE3MDY3ODQvJXM/YmVhcmVyX3Rva2VuPXlhMjkuYy5LcDhCQ1FqQVlibzIzNjZXMkdjOUUxb1hhQjJtQU84bXVYYnJYblhZdnVSUk9rRy1BczJvejFyTV94XzNFYW9aa1RxakFyMGgteGhZaFcydVd6NnpMd0dXYmJOWlhwSEpvXzh6U0RtbmNoQ25JMGZ6ek10b1dxZjJUZmlVbWNJMGN4RjlNZkd5Rk53d2VBVi1ON2xUbWtqaDB0ZFNYWWMxeDZ0dGNVUUYzUGFlZ0VGQmFFRF9HckhYZk1wWEcxNV91TlBwUUdpQmNBcHZUdHgtSHk2bGlVakQiLCJwIjoiUiIsIm0iOjE2Mjc0ODEyMjksInQiOjQsInYiOjN9";
                file = './3d/index.dev.html';
                break;
            case "/map":
                token = "qOz+1zJf3Dk0G5v+QdX4Ag==.eyJpIjoxNjEwMzIxOTQ4OTYxLCJ1IjoiaHR0cHM6Ly9zdG9yYWdlLmdvb2dsZWFwaXMuY29tL3ZveHhsci0xNTA2NjA4MTEwMzYwLzE2MTAzMjE5NDg5NjEvcm9vdC9QQVRIL0ZJTEUuVFlQRT9iZWFyZXJfdG9rZW49eWEyOS5jLktwOEJDUWd0U3FuU0hlY29zWUdIUWhON2lGZVJNYVRtd3FaVUNkZjZmMGRobmtKMlg0VWs2VzlZMGtQMWFKUmxzdS0yNy12N3F6RER4RzEyUFBFSThlY1d6MUdtdDFlUHJWUjN3TFUxMG1XNnNpb1NVdEgwN3l0YW12b2hZUjg5LVJmTy1GanY0ZWJtcXZwWUowV3ZFeXJaMUpIbzBGcWlpQ1ZJdDhjZ096RXUzWFpoVWE1QU9qRk5zaDQ4YWZUZFoyMU05NWNfSTVIRnA2U3IydGRFRm12VSIsInAiOiJXIiwibSI6MTYyNzQ5NzgyMywidCI6MiwidiI6Mn0=";
                file = './2d/index.dev.html';
                break;
            case "/panorama":
                token = "JEUWvDPPkmfyNEkbCPKdSA==.eyJpIjoxNjA3OTc1NDAyMzI2LCJ1IjoiaHR0cHM6Ly9zdG9yYWdlLmdvb2dsZWFwaXMuY29tL3ZveHhsci0xNTA2NjA4MTEwMzYwLzE2MDc5NzU0MDIzMjYvcm9vdC9GSUxFLnBuZz9iZWFyZXJfdG9rZW49eWEyOS5jLktwOEJDUWd0U3FuU0hlY29zWUdIUWhON2lGZVJNYVRtd3FaVUNkZjZmMGRobmtKMlg0VWs2VzlZMGtQMWFKUmxzdS0yNy12N3F6RER4RzEyUFBFSThlY1d6MUdtdDFlUHJWUjN3TFUxMG1XNnNpb1NVdEgwN3l0YW12b2hZUjg5LVJmTy1GanY0ZWJtcXZwWUowV3ZFeXJaMUpIbzBGcWlpQ1ZJdDhjZ096RXUzWFpoVWE1QU9qRk5zaDQ4YWZUZFoyMU05NWNfSTVIRnA2U3IydGRFRm12VSIsInAiOiJXIiwibSI6MTYyNzQ5Nzg1OSwidCI6MywidiI6MX0=";
                file = './1d/index.dev.html';
                break;
            case "/cloud":
                token = "luxWs2q1ECh+rXZjm5LGng==.eyJpIjoxNjA4MzgyOTQzMTA2LCJ1IjoiaHR0cHM6Ly9zdG9yYWdlLmdvb2dsZWFwaXMuY29tL3ZveHhsci0xNTA2NjA4MTEwMzYwLzE2MDgzODI5NDMxMDYvJXMuYmluP2JlYXJlcl90b2tlbj15YTI5LmMuS3A4QkNRZ3RTcW5TSGVjb3NZR0hRaE43aUZlUk1hVG13cVpVQ2RmNmYwZGhua0oyWDRVazZXOVkwa1AxYUpSbHN1LTI3LXY3cXpERHhHMTJQUEVJOGVjV3oxR210MWVQclZSM3dMVTEwbVc2c2lvU1V0SDA3eXRhbXZvaFlSODktUmZPLUZqdjRlYm1xdnBZSjBXdkV5cloxSkhvMEZxaWlDVkl0OGNnT3pFdTNYWmhVYTVBT2pGTnNoNDhhZlRkWjIxTTk1Y19JNUhGcDZTcjJ0ZEVGbXZVIiwicCI6IlciLCJtIjoxNjI3NDk3NTk2LCJ0IjoxLCJ2IjozfQ==";
                file = './3d/index.dev.html';
                break;
            default:
                file = `.${req.url}`
                break;
        }
        
        if (token)
        {
            let config = await getData(token);
         
            fs.readFile(file, 'utf8', function(err, data) 
            {
                data = data.replace("{{{content}}}", `JSON.parse('${config}')`)
                res.end(data);
            });
        }
        else
        {
            fs.readFile(file, 'utf8', function(err, data) 
            {
                res.end(data);
            });
        }
    }
    catch (error)
    {
        console.error(error)
        res.end("<html><body>Unable to reach doc.voxxlr.com to load sample dataset</body></html>");
    }
});

server.listen(port, hostname, () => 
{
    console.log(`Server running at http://${hostname}:${port}/`);
    console.log(`For examples of different data types point your browser to either of :`);
    console.log(`http://${hostname}:${port}/cloud`);
    console.log(`http://${hostname}:${port}/model`);
    console.log(`http://${hostname}:${port}/map`);
    console.log(`http://${hostname}:${port}/panorama`);
});