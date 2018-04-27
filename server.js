//Smart API Socket relay server for devices

//let socket = require('./src/socket.js');
//let http = require('./src/http.js');
//let util = require('./src/utils.js');
//let eventhandler = require('./src/eventhandler.js');

let net = require('net');
let crypto = require('crypto');
let http = require('http');
let url = require('url');


//echo debug messages?
const debugMode = true;
const sockPort = 1846;
const httpPort = 1847;
const httpAuthKey = "demo";



//socket server for devices

//List of connected devices
let connectedClients = [];
let inBuffer = [];

let socketServer = net.createServer(function(socket)
{

	if(debugMode) console.log("connection opened");


	//sending data via the socket
    socket.setNoDelay();
	let sendData = function(data) {
        socket.write(data+"\n", 'utf8');
    };



    sendData('smart-api-relay-server');
    sendData('version 1.0');
    sendData('at socket.smart-api.net');
    sendData('please identify');


    //Create new client object and push it to the list
    let clientObject = {
        socket: socket,
        send: sendData,
        identified: false,
        ident: null
    };
    connectedClients.push(clientObject);


	socket.on('error', function(err)
    {
		if(err.code !== "ECONNRESET" && err.code !== "EPIPE")
        {
            if(debugMode) console.log(err);
            //todo: send to logfile or something
        }
	});


	socket.on('data', function(data)
    {
        data = (data+"").split('\n');
        let processed = 0;
        data.forEach(function (d) {
            d = d.replace(/(\r\n\t|\n|\r\t)/gm,"");
            if(d.length > 0) {
                inBuffer.push(d);
            }
            processed++;
            if (processed === data.length) {
                newDataEvent();
            }
        });
		//let textChunk = data.toString('utf8');
	});



    function newDataEvent()
    {
        if(inBuffer.length > 0)
        {
            let data = inBuffer[0];
            doStuff(data);
            inBuffer.shift();
            newDataEvent();
        }
    }


    function doStuff(data)
    {
        console.log(">" + data + "<");

        if(data.startsWith("ident:") && !clientObject.identified)
        {
            let ident = data.split(':')[1];
            if(ident.length > 1)
            {
                clientObject.identified = true;
                clientObject.ident = ident;
            }
            sendData("200:"+getHash(data))
        }
        else
        {
            sendData("404:"+getHash(data));
        }
    }


    socket.on('close', function()
    {
        //remove from connectedClients list
        const index = connectedClients.indexOf(clientObject);
        if (index !== -1) {
            connectedClients.splice(index, 1);
        }

        console.log("connection closed");
	});


});


//Start Server
socketServer.listen(sockPort, '0.0.0.0');







/*

//web server for controlling

//create a server object:
let httpServer = http.createServer(function (req, res)
{
    //httpAuthKey
    if(debugMode) console.log(req.url)
    res.writeHead(200, {'Content-Type': 'text/html'});
    let q = url.parse(req.url, true).query;
    let txt = q.year + " " + q.month;
    res.end(txt);
});

//Start Server
httpServer.listen(httpPort, '0.0.0.0');

*/




//util
function getHash(data)
{
    return crypto.createHash('md5').update(data).digest("hex");
}





//debug stuff
setInterval(function () {
    connectedClients.forEach(function (as) {
       console.log(as.ident)
    });
}, 1000);
