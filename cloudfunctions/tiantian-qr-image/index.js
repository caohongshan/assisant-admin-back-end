'use strict';
//https://github.com/alexeyten/qr-image
const qr = require('qr-image');
exports.main = async (event, context) => {
	let url = event.url;
	let isHttp = false;
	if (event.queryStringParameters) {
		isHttp = true;
		url = event.queryStringParameters.url;
	}
	const code = qr.imageSync(decodeURIComponent(url), {
		type: 'png'
	});
	if (!isHttp) {
		return {
			image: "data:image/png;base64," + new Buffer(code).toString('base64')
		}
	}
	return {
		mpserverlessComposedResponse: true, // 使用阿里云返回集成响应是需要此字段为true
		isBase64Encoded: true,
		statusCode: 200,
		headers: {
			'content-type': 'image/png'
		},
		body: new Buffer(code).toString('base64')
	}
};
