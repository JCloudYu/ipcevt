/**
 *	Author: JCloudYu
 *	Create: 2019/04/05
**/
import {IPCEvtClient} from "../index.mjs";
import crypto from "crypto";

const id = crypto.randomBytes(12).toString('hex');
const Client = new IPCEvtClient();

// Register the default argument serialization and deserialization logic
Client._serializer	 = (input)=>{ return Buffer.from(JSON.stringify(input), 'utf8'); };
Client._deserializer = (input)=>{ return JSON.parse(input.toString('utf8')); };


Client
.on( 'connected', function() {
	console.log(`Connected to event central! (${id})`);
	this.emit('test-event', id, 'Hi! There!!!', {a:1, b:2, c:"123", d:Date.now()});
})
.on( 'disconnected', function() {
	console.log(`Disconnected from event central! (${id})`);
})
.on( 'test-event', function(...args){
	console.log(`Receiving [test-event]: `, ...args);
})
.connect( 12334, 'localhost' );
