/**
 *	Author: JCloudYu
 *	Create: 2019/04/05
**/
import crypto from "crypto";
import {IPCEvtServer} from "../index.mjs";


(new IPCEvtServer())
.on( 'connected', (socket)=>{
	// emit when socket is connected to the server!
	// Note that the socket object will be persistent in other events too!
	socket.id = crypto.randomBytes(20).toString('hex');
	console.log( `${socket.id} is connected!` );
})
.on( 'disconnected', (socket)=>{
	// emit when socket is disconnected from the server!
	console.log( `${socket.id} is disconnected!` );
})
.on( 'netevt', (socket, event, evt_args)=>{
	// evt_args are raw buffers, you can manipulate if you want!
	console.log( `Receiving ${event} from ${socket.id} (contains ${evt_args.length} arguments)` );
})
.listen( 12334, 'localhost' );
