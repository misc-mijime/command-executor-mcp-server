#!/usr/bin/env node
import determineServerOptions from './command-executor-options.js';
import CommandExecutorServer from './command-executor-server.js';

const options = determineServerOptions();
const server = new CommandExecutorServer(options);
server.run().catch(console.error);
