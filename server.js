const fs = require('fs');
const express = require('express')
const cors = require('cors')

ROOT_PATH = "./"

const hostname = '127.0.0.1';
//const hostname = '0.0.0.0';
const port = 3000;
const app = express()

app.use(cors());

app.post('/list', express.json(), async (req, res) => 
{
    let cursor = req.body.cursor;

    let list = fs.readdirSync(ROOT_PATH).filter(function (file) 
    {
        if (cursor)
        {
            if (cursor == ROOT_PATH+file)
            {
                cursor = null;
            }
            return false;
        }

        if (fs.statSync(ROOT_PATH+file).isDirectory())
        {
            return fs.existsSync(`${ROOT_PATH}${file}/root.json`);
        }
        
        return false;
    });

    content = []
    list.every((dir)=>
    {
        content.push({
            id: dir,
            meta: { 
                name: dir
            },
            token: JSON.stringify({ p: "W", type: "cloud", path: ROOT_PATH + dir })
        })
        cursor = ROOT_PATH+dir
        return req.body.limit-- > 0;
    });

    res.send({ content, cursor });
})

app.post('/search', async (req, res) => 
{
    res.send([]);
})

app.post('/load', async (req, res) => 
{
    let token = JSON.parse(decodeURIComponent(request.query.token));
    res.send(getDataset(token));
})



app.get('/file', async (req, res) => 
{
    fs.readFile(req.query.path, function(err, data) 
    {
        res.type('binary')
        res.end(data);
    });
})

app.get('/index.html', (req, res) => 
{
    let token = JSON.parse(decodeURIComponent(req.query.token));

    let index;
    switch(token.type)
    {
        case "cloud": index = "./3d/index.dev.html"; break;
        case "model": index = "./3d/index.dev.html"; break;
        case "image": index = "./2d/index.dev.html"; break;
        case "wmts": index = "./2d/index.dev.html"; break;
        case "panorama": index = "./1d/index.dev.html"; break;
    }
    
    fs.readFile(index, 'utf8', function(err, data) 
    {
        data = data.replace("{{{content}}}", JSON.stringify(getDataset(token)))
        res.type('html')
        res.send(data);
    });
})

/*
app.get('/index.dev.html', (req, res) => 
{
    fs.readFile(`.${req.url}`, 'utf8', function(err, data) 
    {
        data = data.replace("{{{content}}}", "null")
        res.writeHead(200, {'Content-Type': mime['html'] });
        res.end(data);
    });
})
*/
app.use(express.static('.'))

app.use(function(req, res, next) 
{
    console.log(req.method + ":" + req.url);
})


app.listen(port, hostname, () => 
{
    console.log(`---- doc server running at ${ROOT_PATH} --- `);
});






function getDataset(token)
{
    let config;
    
    switch(token.type)
    {
        case "cloud": 
            config =
            {
                root : JSON.parse(fs.readFileSync(`${token.path}/root.json`, 'utf8')),
                type : token.type,
                source: 
                {
                    data : `http://${hostname}:${port}/file?path=${token.path}/root/%s.bin`
                },
                meta: 
                {
                    name: token.path.substring(token.path.lastIndexOf('/')+1)
                },
                id: token.path.substring(token.path.lastIndexOf('/')+1)
            };
            break;

        case "model": 
            break;

        case "image": 
            config =
            {
                type : token.type,
                source: 
                {
                    data : `http://${hostname}:${port}/file?path=${token.file}`,
                },
                x0: 0,
                y0: 0,
                x1: 1016,
                y1: 1016,
                meta: 
                {
                    name: "local"
                },
                id: token.path
            };
            break;
        case "wmts": 

            config =
            {
                type : token.type,
                source: 
                {
                    data : `${token.data}`,
                },
                maxZoom: token.maxZoom,
                meta: 
                {
                    name: "map"
                },
                id: token.id
            };                
            break;

        case "panorama": 
            break;
    }
    
    return config;
}




// read command line
var args = process.argv.slice(2);

if (args.length > 0)
{
    ROOT_PATH = `${args[0].replace(/\\/g, "/")}/`;
}
