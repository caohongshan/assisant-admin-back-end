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
	 * 关注公众号事件，绑定后台用户
	 * {"ToUserName":"gh_d224039b88de","FromUserName":"ov7Ue52jOWPY1PCBu2e3yOXSJrTM","CreateTime":"1662365351","MsgType":"event","Event":"subscribe","EventKey":""}
	 * @param {Object} data
	 * 
	 */
	async subscribe(data) {
		console.log("处理关注事件")
		//查询用户信息
		await this.bindAccount(data.FromUserName)
		return "欢迎关注公众号"
		// 查询3篇文章，最多8条
		// const {
		// 	data: news
		// } = await this.db.collection("opendb-news-articles").orderBy("publish_date", "desc").limit(5).get();

		// return {
		// 	type: "news",
		// 	data: news
		// }
	}


	/**
	 * 取消关注
	 * @param {Object} data
	 */
	async unsubscribe(data) {
		console.log("取消关注", data.FromUserName)
		await this.service.user.user.updateByOpenid(data.FromUserName, this.publicAppId, this.ctx.context
		.APPID, {
			is_subscribe_mp: false
		})
	}
}
