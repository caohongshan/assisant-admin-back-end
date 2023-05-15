const {
	Service
} = require('uni-cloud-router')
const WeixinBasicService = require('../basic.js')
const md5 = require('md5-node');
/**
 * 微信模板消息父类
 */
module.exports = class BasicService extends WeixinBasicService {
	constructor(ctx) {
		super(ctx)
		//公众号id
		const {
			appid,
			appsecret
		} = this.ctx.getConfigs.config("mp-h5");

		this.publicAppId = appid
		this.publicAppSecret = appsecret
		//小程序配置
		// this.configs = this.ctx.getConfigs.config("wx-message.configs");
		// this.accessToken = await this.getAccessToken({
		// 	appid,
		// 	appsecret
		// })
		// console.log("this.accessToken", this.accessToken)
	}

	async info(content) {
		console.log("mp默认方法")
	}
	/**
	 * 与系统用户绑定，如果未注册，则新增一个用户
	 * @param {Object} openid
	 */
	async bindAccount(openid) {
		console.log("开始绑定用户", openid)
		if (!this.publicAppId || !this.publicAppSecret) {
			console.log("没有配置公众号信息")
			return;
		}
		//先判断是否已经存在
		let localUser = await this.service.user.user.getUserInfoByWxOpenid(openid, this.publicAppId, this.ctx
			.context.APPID)
		console.log("查询本站用户完成")
		if (!localUser) {
			//{"subscribe":1,"openid":"ov7Ue52jOWPY1PCBu2e3yOXSJrTM","nickname":"","sex":0,"language":"zh_CN","city":"","province":"","country":"","headimgurl":"","subscribe_time":1662371289,"unionid":"ofYLk5zLhhhBatURITd79GF2vI_8","remark":"","groupid":0,"tagid_list":[],"subscribe_scene":"ADD_SCENE_PROFILE_CARD","qr_scene":0,"qr_scene_str":""}
			let info = await this.getUserInfoByOpenid(openid)
			console.log("获取微信用户完成", info)
			if (!info) {
				//拉取微信用户信息失败，可能是配置出现了问题
				console.log("拉取微信用户信息失败，可能是配置出现了问题")
				return;
			}
			//查询用户是否存在
			if (info.unionid) {
				localUser = await this.service.user.user.getUserInfoByUnionid(info.unionid, this.ctx.context
					.APPID);
			}
			if (!localUser) {
				//注册本站用户
				localUser = {
					username: md5(this.publicAppId + openid) + "",
					password: openid,
					dcloud_appid: [this.ctx.context.APPID],
					nickname: "公众号用户",
					is_subscribe_mp: true,
					wx_openid: {
						[this.publicAppId]: openid,
						"mp-weixin": openid
					},
					wx_unionid: info.unionid
				}
				console.log("注册本站开始", localUser)
				//可能没有unionid
				const {
					uid
				} = await this.ctx.uniID.register(localUser)
				console.log("注册本站完成", uid)
				localUser._id = uid;
			}
		}
		//如果没有公众号信息，则更新进去
		if (localUser && localUser._id && !localUser.is_subscribe_mp) {
			//更新用户为关注公众号
			await this.service.user.user.update(localUser._id, {
				is_subscribe_mp: true,
				wx_openid: {
					[this.publicAppId]: openid
				}
			})
		}

		return localUser;
	}
	async getUserInfoByOpenid(openid) {
		return this.ctx.dbcache("mp-openid:" + openid, null, 3600, async () => {
			let token = await this.getAccessToken({
				appid: this.publicAppId,
				appsecret: this.publicAppSecret,
			});
			if (!token) {
				return false;
			}
			let {
				data: resultData
			} = await this.curl(
				`https://api.weixin.qq.com/cgi-bin/user/info?access_token=${token}&openid=${openid}&lang=zh_CN`, {
					method: "GET",
					contentType: "json",
					dataType: "json",
				});
			console.log(resultData)
			return resultData;
		})
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
