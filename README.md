# io-process-pool

A Node.js process pool for long running I/O processes.

Use io-process-pool with processes that take a line of input, 
do a long-running computation on that line, and then write
a line of output. io-process-pool will automatically distribute
those long-running computations among the processes in the pool.

## Usage

```js
const Pool = require('io-process-pool')

// Imagine if grep were a process that took four seconds for each line
const pool = new Pool(['grep', ['-i', '--only-matching', '"magic phrase"', '-']], { processes: 4 })

lotsOfLines.forEach(line => {
	pool.write(line, (error, outputLine) => {
		console.log(line, '=>', outputLine);
	})
})
```
