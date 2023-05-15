const { Service } = require('../../common/uni-cloud-router')
const uniPay = require('../../common/uni-pay');
/**
 * 支付宝、微信支付处理，不能直接调用
 */
module.exports = class UniPayService extends Service {
	constructor(ctx) {
		super(ctx)
	}
	/**
	 * 统一付款到平台
	 * @param {Object} order
	 * @param {Object} userInfo
	 */
	async combineTransactions(order, userInfo, next, preview) {
		console.log("combineTransactions")
		return this.app(order, userInfo, next, preview)
	}
	async _beforeCreateOrder(options, config, order, userInfo) {}
	/**
	 * 创建支付订单
	 */
	async app(order, userInfo) {
		//测试中
		let isDebug = this.ctx.getConfigs.config("debug");
		let config = this.ctx.getConfigs.paymentConfigs(this.type);
		//合并订单中的支付信息，如果存在子商户，必须也支持分账，否则平台收不到佣金
		// && order.profit_sharing
		if (order.payment) {
			Object.assign(config, {
				...order.payment
			})
		}
		console.log("app config", config)
		let uniPayIns = uniPay[config["uniPay"]](config);
		//获取微信/支付宝小程序openid
		let openid = this.getOpenid(userInfo);
		let requestOptions = {
			openid, //支付宝小程序、微信小程序必填
			subject: order.body.substr(0, 20), // 微信支付时不可填写此项
			body: order.body.substr(0, 30),
			outTradeNo: order.outTradeNo, //订单号
			totalFee: order.total_fee, // 金额，单位分
			notifyUrl: order.notifyUrl // 支付结果通知地址
		}
		//普通模式//支付宝小程序、微信小程序必填
		requestOptions.openid = openid;
		//调用子集的方法，实现参数重构
		await this._beforeCreateOrder(requestOptions, config, order, userInfo)
		console.log("requestOptions", requestOptions)
		return await uniPayIns.getOrderInfo(requestOptions);
	}
	/**
	 *  验证
	 *  https://uniapp.dcloud.io/uniCloud/unipay?id=%e6%94%af%e4%bb%98%e7%bb%93%e6%9e%9c%e9%80%9a%e7%9f%a5%e5%a4%84%e7%90%86
	 */
	async verify(config, event, next) {
		await next(res);
		return true;
	}

	/**
	 * 添加分账方
	 * @param {Object} config
	 * @param {Object} event
	 * @param {Object} next
	 */
	async profitsharingaddreceiver(config) {
		return true;
	}
	/**
	 * 分账
	 * @param {Object} config
	 * @param {Object} event
	 * @param {Object} next
	 */
	async profitsharing(config) {
		return true;
	}
	/**
	 * 资金退款，定时处理
	 * @param {Object} order 退款订单
	 */
	async refund(order) {
		console.log(order)
		delete order.payInfo;
		delete order.uid;
		let config = this.ctx.getConfigs.paymentConfigs(this.type, order.platform)
		delete order.platform;
		let uniPayIns = uniPay[config["uniPay"]](config);
		let payName = this.payname;
		//微信服务商模式
		if (config.sub_mch_id) {
			order.sub_mch_id = config.sub_mch_id;
			if (config.sub_appid) {
				order.sub_appid = config.sub_appid;
			}
		}
		try {
			let res = await uniPayIns.refund(order);
			console.log("unipay refund", JSON.stringify(res));
			return `退款将退回至您的${payName}账户，请注意查收`;
		} catch (e) {
			console.log("unipay refund 退款失败");
			console.log(JSON.stringify(e))
		}
		return false;
	}

	getOpenid(userInfo) {}

	/**
	 * 更新用户总消费
	 * @param {Object} uid
	 * @param {Object} amount
	 */
	async updateUserConsumption(uid, amount, shopid) {
		if (!uid || !amount) {
			return;
		}
		const cmd = this.db.command;
		//用户自己的付款总计
		await this.db.collection("uni-id-users").doc(uid).update({
			consumption: cmd.inc(Math.ceil(amount))
		})
		if (shopid) {
			//用户在店铺的付款总计
			let {
				updated
			} = await this.db.collection("tian-mall-shops-consumption").where({
				user_id: uid,
				shop_id: shopid,
			}).update({
				consumption: cmd.inc(Math.ceil(amount))
			});
			//原来没有数据
			if (!updated) {
				await this.db.collection("tian-mall-shops-consumption").add({
					user_id: uid,
					shop_id: shopid,
					consumption: Math.ceil(amount)
				})
			}
		}
	}
}
