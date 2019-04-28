/**
 *	Author: JCloudYu
 *	Create: 2019/04/28
**/
import crypto from "crypto";
import {IPCEvtServer} from "../index.mjs";



// NOTE: Suppress expected warning but show other warnings
process.on( 'warning', (warn)=>{
	switch(warn.code) {
		case "DEP0091":
			return;
		default:
			break;
	}
	
	process.stderr.write( `[${warn.code}] ${warn.name}: ${warn.message}\n` );
});



const DEFAULT_PORT = 12334;
const DEFAULT_HOST = "127.0.0.1";
const COLORS = {
	default: "\u001b[39m",
	white: "\u001b[37m",
	yellow: "\u001b[93m",
	gray: "\u001b[90m",
	green: "\u001b[32m",
	red: "\u001b[91m"
};
const CONF = {
	host:null,
	port:null,
	colorize:false
};
const ARGS = process.argv.slice(2).reverse();
while( ARGS.length > 0 ) {
	const option = ARGS.pop();
	switch( option ) {
		case "--host":
		case "-h":
			CONF.host = `${ARGS.pop()}`.trim();
			break;
			
		case "--port":
		case "-p":
			CONF.port = `${ARGS.pop()}`.trim();
			break;
			
		case "--colorize":
			CONF.colorize = true;
			break;
		
		case "--help":
			
			process.exit(0);
			break;
	}
}

if ( !CONF.colorize ) {
	COLORS.default = COLORS.white = COLORS.yellow = COLORS.gray = COLORS.green = COLORS.red = '';
}

if ( !CONF.host ) {
	console.error( `${COLORS.gray}No bound host specified! Using default host ${COLORS.yellow}${DEFAULT_HOST}${COLORS.gray}...${COLORS.default}` );
	CONF.host = DEFAULT_HOST;
}

if ( !CONF.port ) {
	console.error( `${COLORS.gray}No bound port specified! Using default port ${COLORS.yellow}${DEFAULT_PORT}${COLORS.gray}...${COLORS.default}` );
	CONF.port = DEFAULT_PORT;
}








(new IPCEvtServer())
.on( 'connected', (socket)=>{
	const now = Date.now();
	socket.id = crypto.randomBytes(12).toString( 'base64' ).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
	console.log( `${now},${socket.id},connected,0,0` );
})
.on( 'disconnected', (socket)=>{
	const now = Date.now();
	console.log( `${now},${socket.id},disconnected,0,0` );
})
.on( 'netevt', (socket, event, evt_args)=>{
	let payload_size = 0, now = Date.now();
	for(const arg of evt_args) { payload_size += arg.length; }
	console.log( `${now},${socket.id},${event},${evt_args.length},${payload_size}` );
})
.on( 'error', function(inst, err) {
	if ( err.code === "EADDRINUSE" ) {
		console.error( `${COLORS.red}Address is in use!${COLORS.default}` );
	}
	else {
		console.error( `${COLORS.red}Unexpected server error:${COLORS.yellow}\n    ${err.message}${COLORS.default}` );
	}
	
	this.close();
})
.listen( 12334, 'localhost', ()=>{
	console.error( `${COLORS.green}Server is now listening on ${COLORS.yellow}localhost${COLORS.green}:${COLORS.yellow}1234${COLORS.green}...${COLORS.default}` );
});
