const UniPayService = require('./unipay.js')
/**
 * 微信支付处理
 */
module.exports = class WxpayService extends UniPayService {
	constructor(ctx) {
		super(ctx)
		this.type = "wxpay_v3";
		this.payname = "微信";
	}
	async prepay(userInfo) {
		return {
			key: this.type,
			icon: "icon_pay_wxpay",
			color: "#00aa00",
			name: this.payname,
			confirm: false
		}
	}
	/**
	 * 创建支付订单
	 */
	async app(order, userInfo) {
		let config = this.ctx.getConfigs.paymentConfigs(this.type)
	}
	/**
	 * 上传文件
	 * https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter9_0_1.shtml
	 * https://api.mch.weixin.qq.com/v3/marketing/favor/media/image-upload
	 */
	async upload() {}

	/**
	 * 绑定分账方
	 * @param {Object} payment
	 */
	async profitsharingaddreceiver(payment) {}

	/**
	 * 创建支付V3订单
	 * https://api.mch.weixin.qq.com/v3/pay/partner/transactions/jsapi
	 */
	async app(order, userInfo) {
		//用于区分是APP/小程序/h5
		let platform = this.ctx.context.PLATFORM;

		if (platform == "mp-weixin") {
			const res = await this.wxpay.v3.combineTransactions.jsapi.post({

			})
		}

	}

	async encrypt(str) {
		let config = this.ctx.getConfigs.paymentConfigs(this.type)
		const { Rsa } = require('wechatpay-axios-plugin');

		return Rsa.encrypt(str, config.platformCertificate)
	}

	_getWxPay(config) {
		console.log("开始初始化wxpay")
		if (!config) {
			config = this.ctx.getConfigs.paymentConfigs(this.type)
		}
		this.paymentConfig = config;
		const { Wechatpay } = require('wechatpay-axios-plugin');
		// console.log(config)
		const wxpay = new Wechatpay({
			mchid: config.mchid || '',
			serial: config.privateKeySerial || "",
			privateKey: config.privateKey || '',
			// certs: {
			// 	[config.platformCertificateSerial]: config.platformCertificate
			// },
			certs: {
				platformCertificateSerial: ""
			},
		});
		return wxpay;
	}

	/**
	 *  验证
	 *  https://uniapp.dcloud.io/uniCloud/unipay?id=%e6%94%af%e4%bb%98%e7%bb%93%e6%9e%9c%e9%80%9a%e7%9f%a5%e5%a4%84%e7%90%86
	 */
	async verify(config, event, next) {
		const {
			Aes: {
				AesGcm
			}
		} = require('wechatpay-axios-plugin');
		let {
			resource
		} = this.ctx.data;
		//解密请求的数据
		let res = AesGcm.decrypt(resource.nonce, config.key, resource.ciphertext, resource.associated_data);
		res = JSON.parse(res)
		//如果验证失败，会抛出异常，成功才能进入下面
		console.log("uniPayIns.verifyPaymentNotify", res)

		if (res.sub_orders) {
			//多个订单合并支付
			for await (const subOrder of res.sub_orders) {
				//单个订单处理
				subOrder.type = this.type;
				subOrder.payer = res.combine_payer_info
				subOrder.outTradeNo = subOrder.out_trade_no;
				subOrder.totalFee = subOrder.amount.total;
				// //处理各类订单支付完成之后的回调
				let order = await next(subOrder);
			}
		} else {
			res.type = this.type;
			//单个订单处理
			res.outTradeNo = res.out_trade_no;
			res.totalFee = res.amount.total;
			// //处理各类订单支付完成之后的回调
			let order = await next(res);
		}


		// //返回成功字符串
		return this.returnNotifyData();
	}


	/**
	 * 微信企业转账到微信零钱，开通此功能需要特殊的要求
	 * @param {Object} data {amount,_id,user}
	 * @param {string} platform 平台
	 * https://pay.weixin.qq.com/wiki/doc/api/tools/mch_pay.php?chapter=14_2
	 * https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter4_3_1.shtml
	 * https://api.mch.weixin.qq.com/v3/transfer/batches
	 */
	async transfers(data, platform, desc) {
		//可能与当前环境的配置不一样
		let transferConfig = this.ctx.getConfigs.paymentConfigs(this.type, "transfers");
		if (data.dcloud_appid && data.dcloud_appid != this.ctx.context.APPID) {
			//查询此应用配置
			let configs = await this.ctx.getAppConfigsByAppId(data.dcloud_appid);
			transferConfig = configs.transfers.payment[this.type]
		}
		if (!transferConfig) {
			return {
				code: -1,
				message: `transfers.payment.${this.type}系统配置不存在`
			};
		}
		this.wxpay = this._getWxPay(transferConfig);
		console.log("transfers", platform, desc)
		try {
			let openid = this.getOpenid(data.user, platform)
			let transfer_detail_list = [{
				out_detail_no: data._id,
				transfer_amount: data.amount, //单位分
				transfer_remark: desc,
				openid,
			}];

			let total_amount = data.amount
			let total_num = 1

			// const res = await this.wxpay.v3.transfer.batches.post({
			// 	appid: this.paymentConfig.appid,
			// 	out_batch_no: data._id,
			// 	batch_name: desc,
			// 	batch_remark: desc,
			// 	total_amount,
			// 	total_num,
			// 	transfer_detail_list,
			// });
			// console.log("transfers result", res)
			// return {
			// 	...res.data,
			// 	code: 0,
			// 	message: "转账成功"
			// }

			return {
				code: 0,
				message: "转账成功"
			}

		} catch (e) {
			//TODO handle the exception
			console.log(e.message)
		}
		uniCloud.logger.error("weixin_v3调用转账接口失败")
		return {
			code: -2,
			message: "调用接口失败"
		};
	}
	/**
	 * 返回给微信服务器
	 */
	returnNotifyData() {
		return {
			header: "text/xml;charset=utf-8",
			result: "<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>"
		}
	}

	_getPayParamsByPrepayId(id) {
		const {
			Rsa,
			Formatter
		} = require('wechatpay-axios-plugin')

		const params = {
			appId: this.paymentConfig.appid,
			timeStamp: `${Formatter.timestamp()}`,
			nonceStr: Formatter.nonce(),
			package: 'prepay_id=' + id,
			signType: 'RSA',
		}
		params.paySign = Rsa.sign(Formatter.joinedByLineFeed(
			params.appId, params.timeStamp, params.nonceStr, params.package
		), this.paymentConfig.privateKey)

		console.info(params)
		return params;
	}

	getObjectByKeys(obj, keys) {
		return keys.filter(e => obj[e]).reduce((pre, item) => {
			pre[item] = obj[item]
			return pre;
		}, {});
	}
	getOpenid(userInfo, platform) {
		if (!platform) {
			platform = this.ctx.context.PLATFORM;
		}
		if (userInfo.wx_openid) {
			return userInfo.wx_openid[platform];
		}
		return false;
	}
}
