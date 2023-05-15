const {
	Service
} = require('uni-cloud-router');
const BasicService = require('./basic.js')
/**
 * 事件消息
 */
module.exports = class EventService extends BasicService {
	constructor(ctx) {
		super(ctx)
	}
	/**
	 * 普通文本消息
	 * @param {Object} data
	 */
	async info(data) {
		//查询用户信息
		const {
			Content: content
		} = data;
		console.log("处理text请求", content)
		if (!content) {
			return "内容为空或者格式错误"
		}
		if (content == "注册") {
			await this.bindAccount(data.FromUserName)
			return "注册完成"
		}
		if (content.indexOf("注册小程序") != -1 || content.indexOf("小程序注册") != -1) {
			if (content.length < 20) {
				return `请复制以下内容,按格式填写并回复给公众号,系统将自动给法人发送一条注册消息,按推送指示完成小程序注册,企业名称:;统一社会信用代码:;法人姓名:;法人微信号:`
			}
			//分割参数
			let args = content.replace(/：/g, ":").split(";")
			if (args.length == 0) {
				return false
			}
			let keyMap = {
				"企业名称": "name",
				"统一社会信用代码": "code",
				"法人姓名": "legal_persona_name",
				"法人微信号": "legal_persona_wechat",
			}
			let keys = Object.keys(keyMap)
			let userData = args.reduce((pre, text) => {
				let item = text.split(":")
				if (item.length > 1) {
					let keyArr = keys.filter(key => item[0].indexOf(key) != -1)
					if (keyArr.length > 0) {
						pre[keyMap[keyArr[0]]] = item[1]
					}

				}
				return pre;
			}, {})
			console.log("userData", userData)
			const result = await this.service.weixin.component.applet.fastregisterweapp(userData)
			console.log("result", result)
			if (!result && userData.message) {
				return userData.message
			}
			return "提交成功"
		}
		return "欢迎使用公众号功能"
		// 查询3篇文章，最多8条
		// const {
		// 	data: news
		// } = await this.db.collection("opendb-news-articles").orderBy("publish_date", "desc").limit(5).get();

		// return {
		// 	type: "news",
		// 	data: news
		// }
	}
}
