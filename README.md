# IPCEVT - An IPC event system over socket #
This module is designed to provide simple event driven ipc system over native nodejs socket module.

## How to install ? ##
Run the following command to install the module.
```bash
npm install ipcevt
```

**Note that this library is written using es6 modules. Please remember to use following nodejs option to use the module**
```bash
node --experimental-modules [your boot script path]
```

## How to use ? ##
### Server ###
The ipcevt server is designed as a simple broadcasting server that only receive connection and broadcast events among the clients.

##### Example #####
```javascript
import crypto from "crypto";
import {IPCEvtServer} from "ipcevt";


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
```

### Client ###
The ipcevt client is designed to behave like normal event emitters.

##### Example #####
```javascript
import {IPCEvtClient} from "ipcevt";

const Client = new IPCEvtClient();

// Register the central serializer to serialize each event argument passed into emit function
Client._serializer = (input)=>{
    return Buffer.from(JSON.stringify(input), 'utf8');
};

// Register the central deserializer to automatically deserialize evey event arguments
Client._deserializer = (input)=>{
    return JSON.parse(input.toString('utf8'));
};


Client
.on( 'connected', function() {
	console.log( "Client has connected to the server!" );
    
    // Note that the input must be a Buffer or an error will be thrown
    // You can register the _serializer is to preprocess each argument!
	Client.emit( 'greeting', id, 'Hi! There!!!', {a:1, b:2, c:"123", d:Date.now()} );
})
.on( 'disconnected', function() {
	console.log( "Client has disconnected from the server!" );
})
.on( 'greeting', function(...args){
    // The arguments will be Buffer if the _deserializer is not registered!
	console.log(`Receiving [test-event]: `, ...args);
})
.connect( 12334, 'localhost' );
```
