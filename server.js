const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const open = require('open')

const hostname = '127.0.0.1';
const port = 3000;

tokens = 
{
    "/cloud"   :"7pWwjmIHiTFPi9CZ30hq4Q==.eyJpIjoxNjA4MzgyOTQzMTA2LCJwIjoiUiIsIm0iOjE2MzQzMDEzNzcsInQiOjEsInYiOjN9",
    "/model"   :"pIESgTg7brWgeTKRJnCdUw==.eyJpIjoxNjAyNDQxNzA2Nzg0LCJwIjoiUiIsIm0iOjE2MzQzMDEzNzcsInQiOjQsInYiOjN9",
    "/map"     :"KyaQEEGWQ46UCJqyrBH8jA==.eyJpIjoxNjEwMzIxOTQ4OTYxLCJwIjoiUiIsIm0iOjE2MzQzMDEzNzcsInQiOjIsInYiOjJ9",
    "/panorama":"wit16DsjbMM4hbxdWWgkcw==.eyJpIjoxNjA3OTc1NDAyMzI2LCJwIjoiUiIsIm0iOjE2MzQzMDEzODAsInQiOjMsInYiOjF9"
}

viewers = 
{
    "/cloud"   :"./3d/index.dev.html",
    "/model"   :"./3d/index.dev.html",
    "/map"     :"./2d/index.dev.html",
    "/panorama":"./1d/index.dev.html"
}



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
        let request = url.parse(req.url,true);
        if (viewers[request.pathname])
        {
            let config;

            if (request.query.path)
            {
                config = JSON.stringify(
                {
                    root : JSON.parse(fs.readFileSync(`${request.query.path}/root.json`, 'utf8')),
                    type : request.pathname.substring(1),
                    source: {
                        data : `http://${hostname}:${port}/root?path=${request.query.path}/root/%s.bin`
                    }
                });
            }
            else
            {
                config = await getData(tokens[request.pathname]);
            }
            
            fs.readFile(viewers[request.pathname], 'utf8', function(err, data) 
            {
                data = data.replace("{{{content}}}", `JSON.parse('${config}')`)
                res.end(data);
            });
        }
        else
        {
            if (request.pathname == '/root')
            {
                fs.readFile(request.query.path, function(err, data) 
                {
                    res.end(data);
                });
            }
            else
            {
                fs.readFile(`.${req.url}`, 'utf8', function(err, data) 
                {
                    res.end(data);
                });
            }
        }
    }
    catch (error)
    {
        console.error(error)
        res.end("<html><body>Unable to reach doc.voxxlr.com to load sample dataset</body></html>");
    }
});


var source = process.argv.slice(2);

if (source.length == 2)
{
    let url;
    switch (source[0]) 
    {
        case "model":
            url = `http://${hostname}:${port}/model`;
            break;
        case "map":
            url = `http://${hostname}:${port}/map`;
            break;
        case "panorama":
            url = `http://${hostname}:${port}/panorama`;
            break;
        case "cloud":
            url = `http://${hostname}:${port}/cloud`;
            break;
    }
    open(url + `?path=${encodeURIComponent(source[1])}`);
}

server.listen(port, hostname, () => 
{
    console.log(`Server running at http://${hostname}:${port}/`);
    console.log(`For examples of different data types point your browser to either of :`);
    console.log(`http://${hostname}:${port}/cloud`);
    console.log(`http://${hostname}:${port}/model`);
    console.log(`http://${hostname}:${port}/map`);
    console.log(`http://${hostname}:${port}/panorama`);
});