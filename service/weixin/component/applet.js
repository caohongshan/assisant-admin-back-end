const {
	Service
} = require('uni-cloud-router');
const BasicService = require('./basic.js')
/**
 * 小程序
 */
module.exports = class AppletService extends BasicService {
	constructor(ctx) {
		super(ctx)
		this.collection = this.db.collection("tian-wxpay-apps");
	}
	/**
	 * 获取预授权码
	 * 该接口用于获取预授权码（pre_auth_code）是第三方平台方实现授权托管的必备信息，每个预授权码有效期为 1800秒
	 * @link https://developers.weixin.qq.com/doc/oplatform/openApi/OpenApiDoc/ticket-token/getPreAuthCode.html
	 * @link https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/2.0/api/Before_Develop/Authorization_Process_Technical_Description.html#%E4%BA%8C%E3%80%81%E6%8E%88%E6%9D%83%E9%93%BE%E6%8E%A5%E6%9E%84%E5%BB%BA%E7%9A%84%E6%96%B9%E6%B3%95
	 */
	async api_create_preauthcode() {
		const result = await this._send("api_create_preauthcode", {})
		let redirect_uri = this.configs.redirect_uri;
		if (!redirect_uri) {
			//读取云函数域名+拼接地址
			const domain = this.ctx.functionDomain();
			redirect_uri = domain + "/http/wxpay-v3/mp/api_create_preauthcode_result/" + this.ctx.context.APPID
		}

		let url =
			`https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=${this.configs.appId}&pre_auth_code=${result.pre_auth_code}&auth_type=3&redirect_uri=${redirect_uri}`
		return url;
	}
	/**
	 * 取消授权
	 * @param {Object} data
	 */
	async unauthorized(data) {
		/* {
	"encrypt_type": "aes",
	"msg_signature": "252c7a2dada99da57c591c2ece143216387fdba4",
	"nonce": "1275252026",
	"signature": "a590452fcef91862bfd3c8946d947a06d1e344ec",
	"timestamp": "1667378917",
	"app_id": "wx25d004585258e6a5",
	"create_time": "1667378917",
	"info_type": "unauthorized",
	"authorizer_appid": "wx747e283dcdb7c202"
} */
	}

	/**
	 * 使用授权码获取授权信息
	 * @param {Object} data
	 * @link https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/2.0/api/ThirdParty/token/authorization_info.html#%E6%8E%88%E6%9D%83%E4%BF%A1%E6%81%AF%E8%AF%B4%E6%98%8E
	 */
	async authorized(data) {
		/* {
			"encrypt_type": "aes",
			"msg_signature": "f343fa343d59a57cc16f162582b1ae38b4f110de",
			"nonce": "1349667833",
			"signature": "58c063839aa69dc217a53cafc16e6623e5011c09",
			"timestamp": "1667376438",
			"app_id": "wx25d004585258e6a5",
			"create_time": "1667376438",
			"info_type": "authorized",
			"authorizer_appid": "wx570bc396a51b8ff8",
			"authorization_code": "queryauthcode@@@V1OD2LawmeMWPKu7VU-C5qjbQ4HKpsOBE_bQ4nFGYrU5h0z2UpnG9lIgJTgwgfkRY2XwCRjVA9cc2snlQ7svqQ",
			"authorization_code_expired_time": "1667380038",
			"pre_auth_code": "preauthcode@@@RXjq0Wnpeley5r8Wjlvbo6pCwTGIdwk11qv14imfnRj16oNqbE-GN5GrFCUruFARzzJ6cUwQT8YylyFVh3x5mw"
		} */
		const result = await this._send("api_query_auth", {
			component_appid: data.app_id,
			authorization_code: data.authorization_code
		})
		console.log("authorization_info", result)
		//创建一个app
		if (result) {
			let {
				updated,
				doc
			} = await this.collection.where({
				authorizer_appid: result.authorization_info.authorizer_appid
			}).updateAndReturn({
				...result.authorization_info,
				updated: Date.now()
			})
			if (!doc) {
				//新增
				doc = result.authorization_info
				const {
					id
				} = await this.collection.add({
					app_id: data.app_id,
					dcloud_appid: this.ctx.context.APPID,
					...doc,
					updated: Date.now(),
					created: Date.now()
				})
				doc._id = id;
			}
		}
	}
	async component_verify_ticket(data) {
		console.log("ticket 推送完成")
		//更新access_token
		return this.getComponentAccessToken(data.component_verify_ticket)
	}

	/**
	 * 快速注册企业小程序
	 * 请求参数必须是文档内的，多了一个也会报错
	 * @param {Object} data
	 * @link https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/2.0/api/Register_Mini_Programs/Fast_Registration_Interface_document.html
	 */
	async fastregisterweapp(data) {
		data.component_phone = this.configs.component_phone
		//现在已经3证合一
		data.code_type = 1;
		return this._send("fastregisterweapp?action=create", data, false)
	}
}
