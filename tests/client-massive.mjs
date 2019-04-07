/**
 *	Author: JCloudYu
 *	Create: 2019/04/05
**/
import {IPCEvtClient} from "../index.mjs";
import crypto from "crypto";

const TOTAL_SIZE = 1024 * 20;
const id = crypto.randomBytes(12).toString('hex');
const Client = new IPCEvtClient();

const buff = crypto.randomBytes(2048).toString('base64');



// Register the default argument serialization and deserialization logic
Client._serializer	 = (input)=>{ return Buffer.from(JSON.stringify(input), 'utf8'); };
Client._deserializer = (input)=>{ return JSON.parse(input.toString('utf8')); };


Client
.on( 'connected', function() {
	console.log(`Connected to event central! (${id})`);
	
	let count = 1;
	setTimeout(SEND_TEST_DATA, 0, this);
	function SEND_TEST_DATA(inst) {
		if ( count > TOTAL_SIZE ) return;
	
		
		for(let i=1; i<=1024; i++) {
			inst.emit( 'data', id, count, buff );
			console.log( `Sending data #${count++}` );
		}
		
		global.gc();
		setTimeout(SEND_TEST_DATA, 5000, inst);
	}
})
.on( 'disconnected', function() {
	console.log(`Disconnected from event central! (${id})`);
})
.on( 'test-event', function(...args){
	console.log(`Receiving [test-event]: `, ...args);
})
.connect( 12334, 'localhost' );



