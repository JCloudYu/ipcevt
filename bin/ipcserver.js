#!/usr/bin/env node
/**
 *	Author: JCloudYu
 *	Create: 2019/04/28
**/

(()=>{
	"use strict";
	
	const ARGV = process.argv.slice(2);
	
	require( 'child_process' ).spawn(
		process.execPath,
		[
			'--experimental-modules',
			'--no-warnings',
			`${__dirname}/ipcserver.mjs`,
			...ARGV
		],
		{ env:process.env, stdio:'inherit' }
	)
	.on( 'close', (code)=>{
		process.exit(code);
	});
})();
