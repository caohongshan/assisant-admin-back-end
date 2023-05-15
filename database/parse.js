//此文件用来处理从后台导出的数据，阿里云$oid转换为腾讯云的字符串
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const cwd = process.cwd()
const inputPath = path.resolve(cwd, process.argv[2])
const outputPath = path.resolve(cwd, process.argv[3])

if (fs.existsSync(outputPath)) {
	throw new Error(`输出路径（${outputPath}）已存在`)
}

function getType(val) {
	return Object.prototype.toString.call(val).slice(8, -1).toLowerCase()
}

function parseRecord(obj) {
	const type = getType(obj)
	switch (type) {
		case 'object':
			if (obj.$oid) {
				return obj.$oid + 'a'
			}
			const keys = Object.keys(obj)
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				obj[key] = parseRecord(obj[key])
			}
			return obj
		case 'array':
			for (let i = 0; i < obj.length; i++) {
				obj[i] = parseRecord(obj[i])
			}
			return obj
		default:
			return obj
	}
}

async function parseCollection() {
	const inputStream = fs.createReadStream(inputPath)
	const outputStream = fs.createWriteStream(outputPath)

	const rl = readline.createInterface({
		input: inputStream
	});

	for await (const line of rl) {
		const recordStr = line.trim()
		if (!recordStr) {
			continue
		}
		const record = parseRecord(JSON.parse(recordStr))
		outputStream.write(JSON.stringify(record) + '\n')
	}
	rl.close()
	console.log(`处理后的文件已输出到${outputPath}`)
}

parseCollection()
