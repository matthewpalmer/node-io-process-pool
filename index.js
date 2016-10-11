const spawn = require('child_process').spawn;

class ProcessPool {
	// I/O processes used in these pools should be long-running processes that listen on 
	// stdin and write output to stdout based on that input, and then remain open for more input
	// (generally the `-` flag should be used if available). 
	// spawnArgs should be an array formatted similarly to the regular child_process.spawn
	// call, for example `new ioProcessPool(['grep', ['-i', '--only-matching', '"magic phrase"', '-']], { process: 16 }).
	constructor(spawnArgs, { processes = 8, restart = true, timeout = 2000, delimiter = /\\n/ } = {}) {
		this.spawnArgs = spawnArgs;
		this.poolCount = processes;
		this.restart = restart;
		this.timeout = timeout;
		this.queue = [];
		this.outputDelimiter = delimiter;

		// Initialize processes
		for (var i = 0; i < this.poolCount; i++) {
			this.pool.push(null);
			makeProcessInPool(i);
		}

		this.runner();
	}

	write(input, callback) {
		this.queue.push({ text: input, callback, output: '' })
	}

	makeProcessInPool(index) {
		const proc = spawn(...this.spawnArgs);

		proc.on('error', error => {
			// Programmer error, spawn args were incorrect.
			console.log('proc had an error', error);
			process.exit();
		});

		proc.on('close', code => {
			// Child processes should not close.
			const message = 'child process exited with code ' + code + ', restarting: ' + this.restart;
			console.log(message);
			
			if (proc.job) {
				proc.job.callback(message);
				proc.job = null;
			}

			if (this.restart) {
				this.makeProcessInPool(index);
			}
		});

		proc.stdout.on('data', chunk => {
			proc.resetTimeout();
			proc.job.output += chunk;
			let output = proc.job.output.toString();

			if (!output.match(this.outputDelimiter)) return; // More chunks coming

			proc.job.callback(null, output);
			proc.job = null;
		});

		proc.resetTimeout = () => {
			if (proc.timeoutHandler) clearTimeout(proc.timeoutHandler);

			proc.timeoutHandler = setTimeout(() => {
				// The current job has taken too long
				proc.timeoutHandler = null;
				proc.job = null;
			}, this.timeout);
		}

		this.pool[index] = proc;
	}

	runner() {
		setTimeout(this.runner);

		if (!this.queue.length) return;

		const nextFreeProcess = this.pool.find(proc => !proc.job);
		if (!nextFreeProcess) return;

		nextFreeProcess.job = this.queue.pop();
		nextFreeProcess.stdin.write(nextFreeProcess.job.text);
		nextFreeProcess.resetTimeout();
	}
}


module.exports = ProcessPool;
