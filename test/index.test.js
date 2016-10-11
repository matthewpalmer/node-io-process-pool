const assert = require('assert')
const Pool = require('../')
const script = __dirname + '/sample.sh'

// This pool should work
const good = new Pool(['sh', [script, '1']], { processes: 4 })
const goodOutput = []

for (let i = 0; i < 10; i++) {
	console.log(`Good pool starting ${i}…`)

	good.write(i, (error, output) => {
		console.log(`Good pool finished ${i} => ${output}`)
		goodOutput.push(output);
	})
}

// This pool should exceed the timeouts
const bad = new Pool(['sh', [script, '3']], { processes: 6, timeout: 500 })
const badErrors = [];

for (let i = 0; i < 10; i++) {
	console.log(`Bad pool starting ${i}…`)

	bad.write(i, (error, output) => {
		console.log(`Bad pool finished ${i} => ${output}`)
		badErrors.push(error);
	})
}

setTimeout(() => {
	assert(goodOutput.length === 10);
	assert(badErrors.length === 10);

	console.log('Ad-hoc tests passed.');
	process.exit(0);
}, 9000)
