/**
 *	Author: JCloudYu
 *	Create: 2019/04/05
**/
import net from "net";
import events from "events";
import {IPCEvtSocket} from "./netevt-socket.mjs";



const CLIENTS = new Set();
const {EventEmitter} = events;
export class IPCEvtServer extends EventEmitter {
	constructor() {
		super();
		
		this._server = net.createServer();
		this._server._rel = this;
		
		
		
		this._server
		.on( 'connection', ___HANDLE_SOCKET_CONNECT )
		.on( 'close', ___HANDLE_SERVER_CLOSE )
		.on( 'error', ___HANDLE_SERVER_ERROR );
	}
	listen(...args) {
		this._server.listen(...args);
		return this;
	}
	close(...args){
		this._server.close(...args);
		return this;
	}
}



function ___HANDLE_SOCKET_CONNECT(socket) {
	const netSock = (new IPCEvtSocket(socket, this._rel))
	.on( 'disconnected', ___HANDLE_SOCKET_DISCONNECT )
	.on( 'error', ___HANDLE_SOCKET_ERROR );
	
	CLIENTS.add(netSock);
	netSock._netevt_handler = ___HANDLE_NETEVT.bind(this._rel);
	this._rel.emit( 'connected', netSock );
}
function ___HANDLE_SOCKET_DISCONNECT(error) {
	CLIENTS.delete(this);
	this._parent.emit( 'disconnected', this, error );
}
function ___HANDLE_SOCKET_ERROR(error) {
	this._parent.emit( 'socket-error', this, error );
}
function ___HANDLE_SERVER_CLOSE() {
	this._rel.emit( 'close', this._rel );
}
function ___HANDLE_SERVER_ERROR(error) {
	this._rel.emit('error', this._rel, error );
}
function ___HANDLE_NETEVT(sender, event, evt_args) {
	this.emit( 'netevt', sender, event, evt_args );

	const eventBuffer = Buffer.from( event, 'utf8' );
	for( const client of CLIENTS ) {
		if ( client === sender ) continue;
		client._send_raw_event(eventBuffer, evt_args);
	}
}
