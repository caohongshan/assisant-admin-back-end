const {
	Service
} = require('uni-cloud-router')
const WeixinBasicService = require('../basic.js')
/**
 * 微信模板消息父类
 */
module.exports = class BasicService extends WeixinBasicService {
	constructor(ctx) {
		super(ctx)
		this.type = "";
		//公众号id
		this.publicAppId = this.ctx.getConfigs.config("mp-h5.appid");
		//小程序配置
		this.configs = this.ctx.getConfigs.config("wx-message.configs");
	}

	async send(content) {
		let {
			openid,
			data,
			miniprogram
		} = await this.getMessageContent(content);
		if (!data) {
			return false;
		}
		//默认接受消息，也可以是模板独有的用户接受端
		if (!openid) {
			openid = [];
		}
		//接受消息算上总系统管理员
		if (this.configs.openid) {
			openid = openid.concat(this.configs.openid)
		}
		//判断当前模板的分站管理员，数组类型
		let subOpenid = this.ctx.getConfigs.config(`wx-message.${this.type}.openid`)
		if (subOpenid) {
			openid = openid.concat(subOpenid);
		}
		//小程序的accessToken
		let token = await this.getAccessToken({
			appid: this.configs.appid,
			appsecret: this.configs.appsecret,
		});
		//提取标题和说明
		let pushData = {
			"first": {
				"value": data.shift(),
			},
			"remark": {
				"value": data.pop(),
			}
		}
		//提取表单字段
		data.map((e, index) => {
			pushData[`keyword${index+1}`] = {
				value: e
			};
		})
		//过滤重复的openid
		let uniqueOpenid = [];
		openid.map(e => {
			if (uniqueOpenid.indexOf(e) == -1) {
				uniqueOpenid.push(e)
			}
		})
		openid = uniqueOpenid;
		//循环发送给所有用户
		for (let i = 0; i < openid.length; i++) {
			await this._sendMessage(openid[i], miniprogram, pushData, token)
		}
		console.log("发送微信通知完成")
	}
	/**
	 * 子类继承此方法，用于构造发送的data
	 * @param {Object} content
	 */
	async getMessageContent(content) {

	}

	/**
	 * 调用发送微信模板消息
	 * @param {Object} openid
	 * @param {Object} template_id
	 * @param {Object} miniprogram
	 * @param {Object} pushData
	 */
	async _sendMessage(openid, miniprogram, pushData, token) {
		let template_id = this.ctx.getConfigs.config(`wx-message.${this.type}.template_id`);
		if (!template_id) {
			console.log("模板id不存在，请配置uni-config-center/tiantian-mall/config.json/" +
				`wx-message.${this.type}.template_id`)
			return false;
		}
		return this.curl(
			`https://api.weixin.qq.com/cgi-bin/message/wxopen/template/uniform_send?access_token=${token}`, {
				method: "POST",
				contentType: "json",
				dataType: "json",
				data: {
					"touser": openid,
					"mp_template_msg": {
						"appid": this.publicAppId,
						"template_id": template_id,
						"url": "http://weixin.qq.com/download",
						"miniprogram": miniprogram,
						"data": pushData
					}
				}
			});
	}

	/**
	 * 根据主键id，查询信息，需要子类定义this.collection
	 * @param {Object} id
	 */
	async getInfoById(id) {
		if (!this.collection) {
			return false;
		}
		let {
			data
		} = this.collection.doc(id).get();
		if (data.length > 0) {
			return data[0]
		}
		return false;
	}
}
