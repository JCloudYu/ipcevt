/**
 *	Author: JCloudYu
 *	Create: 2019/04/05
**/
import net from "net";
import events from "events";

const {Socket} = net;
const {EventEmitter} = events;



const _ZERO_BUFFER = Buffer.alloc(0);
const _MSG_BATCH_SIZE = 20;

const _MSG_SCHEDULER = new Set();
const _MSG_TIMEOUT = (()=>{
	let _active_timeout = null;

	return (callback, delay)=>{
		if ( _active_timeout ) {
			clearTimeout(_active_timeout);
		}
		
		return _active_timeout = setTimeout(callback, delay);
	};
})();

const RESERVED_EVENT_NAMES = [ 'netevt', 'disconnected', 'connected', 'error' ];
export class IPCEvtSocket extends EventEmitter {
	constructor(socket=null, serverInst=null) {
		super();
		
		this._socket = socket || new Socket();
		this._socket._rel = this;
		
		this._parent = serverInst || null;
		this._chunk	 = _ZERO_BUFFER;
		this._connected = false;
		this._error = null;
		
		this._serializer	 = ___NO_CONVERT;
		this._deserializer	 = ___NO_CONVERT;
		this._netevt_handler = ___HANDLE_NETEVT;
		
		
		this._socket
		.on( 'connect', ___HANDLE_CONNECT )
		.on( 'close',	___HANDLE_CLOSE )
		.on( 'error',	___HANDLE_ERROR )
		.on( 'data',	___HANDLE_DATA );
	}
	connect(...args) {
		return this._socket.connect(...args);
	}
	close() {
		return this._socket.end();
	}
	emit(event, ...evtArgs) {
		const {event:eventBuffer, args} = this._gen_raw_event(event, evtArgs);
		this._send_raw_event(eventBuffer, args);
		this._netevt_handler(this, event, args);
		
		return true;
	}
	_emit(event, ...evtArgs) {
		super.emit(event, ...evtArgs);
	}
	_gen_raw_event(event, evt_args=[]) {
		event = `${event}`;
		if ( RESERVED_EVENT_NAMES.indexOf(event) >= 0 ) {
			throw new RangeError( `Event \`${event}\` is not allowed!` );
		}
		
		
		
		const rawData = [];
		for(let data of evt_args) {
			const raw = this._serializer(data);
			if ( !Buffer.isBuffer(raw) ) {
				throw new RangeError( `Given event argument must be an buffer!` );
			}
			
			rawData.push(raw);
		}
		
		
		
		return {
			event: Buffer.from(event, 'utf8'),
			args: rawData
		};
	}
	_send_raw_event(rawEvent, rawData) {
		if ( !Buffer.isBuffer(rawEvent) ) {
			throw new RangeError( `First argument must be buffers!` );
		}
		
		for(const raw of rawData) {
			if ( !Buffer.isBuffer(raw) ) {
				throw new RangeError( `Second argument must be array of buffers!` );
			}
		}
		
		
		
		const eventHeader = Buffer.alloc(2);
		eventHeader.writeUInt16LE(rawEvent.length, 0);
		
		const dataHeader = Buffer.alloc(1);
		dataHeader.writeUInt8(rawData.length, 0);
		
		
		
		// Write everything
		this._socket.write(eventHeader);
		this._socket.write(rawEvent);
		this._socket.write(dataHeader);
		
		
		for(const raw of rawData) {
			const len = Buffer.alloc(4);
			len.writeUInt32LE(raw.length, 0);
			
			this._socket.write(len);
			this._socket.write(raw);
		}
	}
	
	get lastError() {
		return this._error;
	}
	get connected() {
		return this._connected;
	}
	get connecting() {
		return this._socket.connecting;
	}
}



// region [ Socket Event Handler ]
function ___HANDLE_CONNECT() {
	// NOTE: This event will only occurs in socket.connect
	
	const INST = this._rel;
	INST._connected = true;
	INST._emit( 'connected' );
}

/**
 * @param {Boolean} withError
 * @private
**/
function ___HANDLE_CLOSE(withError) {
	const INST = this._rel;
	INST._connected = false;
	INST._emit( 'disconnected', withError ? (INST._error||null) : null );
}

/**
 * @param {Error} error
 * @private
**/
function ___HANDLE_ERROR(error) {
	const INST = this._rel;
	INST._connected = false;
	INST._error = error;
	INST._emit( 'error', error );
}

/**
 * @param {Buffer} chunk
 * @private
**/
function ___HANDLE_DATA(chunk) {
	const INST = this._rel;
	INST._chunk = Buffer.concat([INST._chunk, chunk]);
	
	___SCHEDULE_EVENT_PROCESSOR(INST);
}
// endregion



// region [ Socket Data Processing Logic ]
/**
 * @param {IPCEvtSocket} socket_inst
 * @private
**/
function ___SCHEDULE_EVENT_PROCESSOR(socket_inst) {
	_MSG_SCHEDULER.add(socket_inst);
	_MSG_TIMEOUT(___PROCESS_MESSAGE);
}
function ___PROCESS_MESSAGE() {
	for(let [instance] of _MSG_SCHEDULER.entries()) {
		let repeat	 = _MSG_BATCH_SIZE;
		let messages = [];
		while ( repeat-- > 0 ) {
			let result = ___EAT_MESSAGE(instance._chunk);
			if ( !result ) {
				_MSG_SCHEDULER.delete(instance);
				break;
			}
			
			const {event, args, anchor} = result;
			instance._chunk = instance._chunk.slice(anchor);
			messages.push({event, args});
		}
	
		
	
		// Emit message
		for (let {event, args} of messages) {
			instance._netevt_handler(instance, event, args);
		}
	}
	
	
	
	if ( _MSG_SCHEDULER.length > 0 ) {
		_MSG_TIMEOUT(___PROCESS_MESSAGE);
	}
}
function ___EAT_MESSAGE(chunk) {
	if ( chunk.length <= 0 ) {
		return false;
	}
	
	
	
	let content, result, anchor=0;
			
	result = ___EAT_EVENT_TAG(chunk, anchor);
	if ( !result ) { return false; }
	({content, anchor} = result);
	let event = content.toString( 'utf8' );
	
	result = ___EAT_EVENT_ARGS(chunk, anchor);
	if ( !result ) { return false; }
	({content, anchor} = result);
	
	return { event, args:content, anchor };
}
function ___EAT_EVENT_TAG(buff, anchor) {
	if ( buff.length < (anchor + 2) ) {
		return false;
	}

	let contentLength = buff.readUInt16LE(anchor);
	anchor += 2;
	
	if ( buff.length < (anchor + contentLength)) {
		return false;
	}
	
	let content = buff.slice(anchor, anchor+contentLength);
	anchor += contentLength;
	
	return {content, anchor};
}
function ___EAT_EVENT_ARGS(buff, anchor) {
	if ( buff.length < (anchor + 1) ) {
		return false;
	}

	let contentLength = buff.readUInt8(anchor);
	anchor += 1;
	
	const rawArgs = [];
	while( contentLength-- > 0 ) {
		if ( buff.length < (anchor + 4) ) {
			return false
		}
		
		const argLength = buff.readUInt32LE(anchor);
		anchor += 4;
		
		if ( buff.length < (anchor + argLength)) {
			return false;
		}
		
		rawArgs.push(buff.slice(anchor, anchor + argLength));
		anchor += argLength;
	}
	
	
	
	return {content:rawArgs, anchor};
}
function ___HANDLE_NETEVT(sender, event, raw_data) {
	const args = [];
	for(let arg of raw_data) {
		args.push(sender._deserializer(arg))
	}
	
	sender._emit(event, ...args);
}
function ___NO_CONVERT(input) {return input;}
// endregion
