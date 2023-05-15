const { getTodayTime } = require('../util');
const { Service } = require('../../common/uni-cloud-router')

module.exports = class UtilService extends Service {
	constructor(ctx) {
		super(ctx)
	}
	getStringStar(str, pre = 1, end = 1) {
		if (!str) {
			return str;
		}
		let out = []
		out.push(str.substr(0, pre))
		//中间星星
		if (str.length > pre + end) {
			out.push('*'.repeat(str.length - (pre + end)))
			out.push(str.substr(end * -1, end))
		} else {
			out.push('*'.repeat(end))
		}
		return out.join("")
	}
}
