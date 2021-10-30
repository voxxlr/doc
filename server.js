const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const open = require('open')

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer(async (req, res) => 
{
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
 
    try 
    {
        let request = url.parse(req.url,true);
        if (request.pathname == '/index.html')
        {
            let source = JSON.parse(decodeURIComponent(request.query.token));

            let config;
            if (source.hasOwnProperty("path"))
            {
                // from local directory
                config = JSON.stringify(
                {
                    root : JSON.parse(fs.readFileSync(`${source.path}/root.json`, 'utf8')),
                    type : source.type,
                    source: {
                        data : `http://${hostname}:${port}/root?path=${source.path}/root/%s.bin`
                    },
                    meta: 
                    {
                        name: "local"
                    },
                    id: "local"
                });
            }
            else
            {
                // dataset hosted at doc.voxxlr.com
                const content = JSON.stringify({ meta: request.query.meta ? request.query.meta.split(",") : [] })
        
                const options = 
                {
                    hostname: 'doc.voxxlr.com',
                    port: 443,
                    path: '/load',
                    method: 'POST',
                    headers: 
                    {
                        'Content-Type': 'application/json',
                        'Content-Length': content.length,
                        'Authorization' : `Bearer ${source.token}`
                    }
                }
            
                config = await new Promise((resolve, reject) => 
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
                
                    req.write(content)
                    req.end()
                });
            }
            

            let index;
            switch(source.type)
            {
                case "cloud": index = "./3d/index.dev.html"; break;
                case "model": index = "./3d/index.dev.html"; break;
                case "map": index = "./2d/index.dev.html"; break;
                case "panorama": index = "./1d/index.dev.html"; break;
            }

           // let config = await getConfig(source,request.query.meta ? request.query.meta.split(",") : []);
            fs.readFile(index, 'utf8', function(err, data) 
            {
                data = data.replace("{{{content}}}", `JSON.parse('${config}')`)
                res.end(data);
            });
        }
        else  if (request.pathname == '/root')
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
    catch (error)
    {
        console.error(error)
        res.end("<html><body>Unable to reach doc.voxxlr.com to load sample dataset</body></html>");
    }
});


server.listen(port, hostname, () => 
{
    console.log(`\n\n`);
    console.log(`---- starting demo Doc server --- `);
    console.log(`---- `);
    console.log(`---- usage: node server.js type path `);
    console.log(`---- `);
    console.log(`---- type in ['cloud','map','model','panorama']`);
    console.log(`---- path is either empty or path to locally processed dataset i.e ..../processor/process"`);
    console.log(`---- `);
    console.log(`---- Voxxlr demo App server --- `);
    console.log(`\n\n`);
});


// read command line
var args = process.argv.slice(2);

let source = {};

if (args.length > 0)
{
    source.type = args[0]
}
else
{
    source.type = "cloud";
}

if (args.length > 1)
{
    source.path = args[1]
}
else
{
    switch (source.type) 
    {
        case "cloud":
            source.token = "7pWwjmIHiTFPi9CZ30hq4Q==.eyJpIjoxNjA4MzgyOTQzMTA2LCJwIjoiUiIsIm0iOjE2MzQzMDEzNzcsInQiOjEsInYiOjN9"
            break;
        case "model":
            source.token = "pIESgTg7brWgeTKRJnCdUw==.eyJpIjoxNjAyNDQxNzA2Nzg0LCJwIjoiUiIsIm0iOjE2MzQzMDEzNzcsInQiOjQsInYiOjN9"
            break;
        case "map":
            source.token = "KyaQEEGWQ46UCJqyrBH8jA==.eyJpIjoxNjEwMzIxOTQ4OTYxLCJwIjoiUiIsIm0iOjE2MzQzMDEzNzcsInQiOjIsInYiOjJ9"
            break;
        case "panorama":
            source.token = "wit16DsjbMM4hbxdWWgkcw==.eyJpIjoxNjA3OTc1NDAyMzI2LCJwIjoiUiIsIm0iOjE2MzQzMDEzODAsInQiOjMsInYiOjF9"
            break;
    }
}

// open browser
open(`http://${hostname}:${port}/index.html?token=${encodeURIComponent(JSON.stringify(source))}`);
