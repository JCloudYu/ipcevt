/**
 *	Author: JCloudYu
 *	Create: 2019/04/05
**/
import {IPCEvtClient} from "../index.mjs";
import crypto from "crypto";

const id = crypto.randomBytes(12).toString('hex');
const Client = new IPCEvtClient();

Client
.on( 'connected', function() {
	console.log(`Connected to event central! (${id})`);
})
.on( 'disconnected', function() {
	console.log(`Disconnected from event central! (${id})`);
})
.on( 'test-event', function(...args){
	const output = [];
	for(let arg of args) {
		output.push(arg.toString('utf8'));
	}
	
	console.log(`Receiving [test-event]: `, ...output);
})
.connect( 12334, 'localhost' );
