const {
	Service
} = require('uni-cloud-router')
const WeixinBasicService = require('../basic.js')
const md5 = require('md5-node');
const WXMsgCrypto = require("./WXMsgCrypto.js");
const {
	camel2snakeJson,
	snake2camelJson,
} = require('../../util');
/**
 * 微信第三方平台接口
 */
module.exports = class BasicService extends WeixinBasicService {
	constructor(ctx) {
		super(ctx)
		//公众号id
		// const {
		// 	appid,
		// 	appsecret
		// } = this.ctx.getConfigs.config("mp-h5");

		// this.publicAppId = appid
		// this.publicAppSecret = appsecret
		//小程序配置
		// this.configs = this.ctx.getConfigs.config("wx-message.configs");
		// this.accessToken = await this.getAccessToken({
		// 	appid,
		// 	appsecret
		// })
		// console.log("this.accessToken", this.accessToken)
		//服务商配置只能1个
		this.configs = this.ctx.getConfigs.config("web.component.wxpay");
	}

	async decrypt(data, content) {
		const {
			AppId: appId,
			Encrypt: encryptTxt
		} = content
		//读取小程序信息
		const wxmc = new WXMsgCrypto(this.configs.token, this.configs.encodingAESKey, appId);
		//获取消息签名
		const msgSignature = wxmc.getSignature(
			data.timestamp,
			data.nonce,
			encryptTxt
		);
		const signature = wxmc.getSignature(data.timestamp, data.nonce);
		//console.log(msgSignature,signature);
		//验证签名是否正确
		if (msgSignature === data.msg_signature && signature === data.signature) {
			const xmlSource = wxmc.decrypt(encryptTxt);
			// console.log("解密出 xmlSource:", xmlSource);
			let message = this.ctx.parseWxXML(xmlSource.message)
			// const xmlJSON = await xmlparser.parseStringPromise(xmlSource.message);
			// console.log("转换成 JSON:", message);
			//转换成蛇形
			Object.assign(data, camel2snakeJson(message));
		} else {
			console.log("请求不合法");
		}
		return data;
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

	/**
	 * 只有ticket回调的时候才会获取新的ticket，其他地方都是直接获取
	 * @param {Object} component_verify_ticket
	 * @link https://developers.weixin.qq.com/doc/oplatform/openApi/OpenApiDoc/ticket-token/getComponentAccessToken.html
	 */
	async getComponentAccessToken(component_verify_ticket) {
		if (component_verify_ticket) {
			console.log("开始获取服务商accessToken，有白名单限制")
			let {
				data
			} = await this.curl(
				`https://api.weixin.qq.com/cgi-bin/component/api_component_token`, {
					dataType: "json",
					method: "POST",
					data: JSON.stringify({
						component_appid: this.configs.appId,
						component_appsecret: this.configs.appSecret,
						component_verify_ticket: component_verify_ticket
					})
				});
			if (data.errcode) {
				//获取失败了
				console.log("result", data)
				return false;
			}
			//写入db缓存
			return this.ctx.dbcache(`wxpay_component_access_token_` + this.configs.appId, data
				.component_access_token, 3600)
		}
		//直接读取
		return this.ctx.dbcache(`wxpay_component_access_token_` + this.configs.appId)
	}

	async _send(uri, data, needComponentId = true) {
		const component_access_token = await this.getComponentAccessToken();
		if (!component_access_token) {
			console.log("component_access_token 不存在")
			return false;
		}
		let url = `https://api.weixin.qq.com/cgi-bin/component/${uri}`
		if (url.indexOf("?") == -1) {
			url += `?`
		}
		url += `&component_access_token=${component_access_token}`
		if (needComponentId) {
			data.component_appid = this.configs.appId
		}
		console.log("url", url)
		console.log("data", JSON.stringify(data))
		let {
			data: result
		} = await this.curl(url, {
			dataType: "json",
			method: "POST",
			data: JSON.stringify(data)
		});
		if (result.errcode) {
			console.log("result", result)
			data.message = result.errmsg;
			//获取失败了
			return false;
		}
		return result
	}
}
