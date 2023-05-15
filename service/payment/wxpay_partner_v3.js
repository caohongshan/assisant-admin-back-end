const {
	Service
} = require('uni-cloud-router')
const WxPayService = require('./wxpay_v3.js')
const md5 = require('md5-node');
/**
 * 微信支付处理
 */
module.exports = class WxpayService extends WxPayService {
	constructor(ctx) {
		super(ctx)
		this.type = "wxpay_partner_v3";
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
	 * 创建服务商支付V3订单
	 * https://api.mch.weixin.qq.com/v3/pay/partner/transactions/jsapi
	 */
	async app(order, userInfo) {
		this.wxpay = this._getWxPay();
		let {
			payments
		} = order;
		//用于区分是APP/小程序/h5
		let platform = this.ctx.context.PLATFORM;
		let subPayment = payments[this.type];
		let openid = this.getOpenid(userInfo);
		let payer = {};
		if (subPayment.sub_appid) {
			payer["sub_openid"] = openid;
		} else {
			payer["sp_openid"] = openid;
		}
		if (platform == "mp-weixin") {
			try {
				const res = await this.wxpay.v3.pay.partner.transactions.jsapi.post({
					sp_appid: this.paymentConfig.appid,
					sp_mchid: this.paymentConfig.mchid,
					...this.getObjectByKeys(subPayment, ["sub_appid", "sub_mchid"]),
					description: order.body,
					out_trade_no: order.outTradeNo,
					notify_url: order.notifyUrl,
					settle_info: {
						profit_sharing: subPayment.profit_sharing && subPayment.profit_sharing == "Y"
					},
					amount: {
						total: order.total_fee
					},
					payer
				});
				console.log("prepay result", res.data)
				return this._getPayParamsByPrepayId(res.data.prepay_id)
			} catch (e) {
				//TODO handle the exception
				console.log(e)
			}
			return {
				code: -1,
				message: "商户异常，请联系管理员"
			}
		}

	}
	/**
	 * https://api.mch.weixin.qq.com/v3/combine-transactions/jsapi
	 * 合并支付v3功能，只有服务商才能支持
	 */
	async combineTransactions(order, userInfo) {
		//用于区分是APP/小程序/h5
		this.wxpay = this._getWxPay();
		let {
			children
		} = order;
		//用于区分是APP/小程序/h5
		let platform = this.ctx.context.PLATFORM;
		let openid = this.getOpenid(userInfo);
		if (platform == "mp-weixin") {
			try {
				let sub_orders = [];
				for (let child of children) {
					let subPayment = child.payments[this.type];
					console.log("subPayment", subPayment)
					let sub_order = {
						mchid: this.paymentConfig.mchid,
						attach: child.shop.name,
						amount: {
							total_amount: 1, //child.total_fee,
							currency: "CNY"
						},
						out_trade_no: child.outTradeNo,
						sub_mchid: subPayment.sub_mchid,
						description: child.body,
						settle_info: {
							profit_sharing: !!(subPayment.profit_sharing && subPayment.profit_sharing ==
								"Y")
						}
					}
					sub_orders.push(sub_order)
				}
				console.log({
					combine_appid: this.paymentConfig.appid,
					combine_mchid: this.paymentConfig.mchid,
					combine_out_trade_no: order.outTradeNo,
					sub_orders,
					combine_payer_info: {
						openid
					},
					notify_url: order.notifyUrl,
				})
				const res = await this.wxpay.v3.combineTransactions.jsapi.post({
					combine_appid: this.paymentConfig.appid,
					combine_mchid: this.paymentConfig.mchid,
					combine_out_trade_no: order.outTradeNo,
					sub_orders,
					combine_payer_info: {
						openid
					},
					notify_url: order.notifyUrl,
				});
				console.log("prepay result", res.data)
				return this._getPayParamsByPrepayId(res.data.prepay_id)
			} catch (e) {
				//TODO handle the exception
				console.log(e)
			}
			return {
				code: -1,
				message: "商户异常，请联系管理员"
			}
		}

	}
	/**
	 * 上传文件
	 * https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter9_0_1.shtml
	 * https://api.mch.weixin.qq.com/v3/marketing/favor/media/image-upload
	 */
	async upload(url) {
		if (!url || url.indexOf("http") == -1) {
			console.log("直接返回url", url)
			return url;
		}

		return this.ctx.dbcache("weixin_upload_" + md5(url), null, 3600 * 24, async () => {
			this.wxpay = this._getWxPay();
			console.log(this.paymentConfig)
			const {
				Hash,
				Multipart
			} = require('wechatpay-axios-plugin')
			const {
				data: image
			} = await this.curl(url);
			let sha256 = Hash.sha256(image);
			console.log("获取网络图片完成")
			const imageMeta = {
				filename: 'hellowechatpay.jpg',
				// easy calculated by the command `sha256sum hellowechatpay.mp4` on OSX
				// or by require('wechatpay-axios-plugin').Hash.sha256(filebuffer)W12gl4nthiHR9wDPgSuqsAQ2iAss2ijOEEPJSs8cSdF7EDIg2Q5M8K2FbjZhyRc97G74aQJavtOr_XGOy-HFvcNp_el_W_n_2wriF3AnICA
				sha256: sha256,
			}
			console.log("imageMeta", imageMeta)
			const imageData = new Multipart()
			imageData.append('meta', JSON.stringify(imageMeta))
			imageData.append('file', image, 'hellowechatpay.jpg');
			try {
				const res = await this.wxpay.v3.merchant.media.upload.post(imageData, {
					meta: imageMeta,
					headers: imageData.getHeaders()
				})
				console.info(res.data.media_id)
				return res.data.media_id;
			} catch (error) {
				console.error(error)
			}
			return false;
		})


	}

	/**
	 * 提交商户进件
	 * https://pay.weixin.qq.com/wiki/doc/apiv3_partner/apis/chapter11_1_1.shtml
	 * @param {Object} info
	 */
	async applyment(info) {
		this.wxpay = this._getWxPay();
		console.log(this.paymentConfig)
		try {
			let res = await this.wxpay.v3.applyment4sub.applyment.$noop$(info, {
				noop: '',
				headers: {
					// 'Wechatpay-Serial': this.paymentConfig.privateKeySerial
					'Wechatpay-Serial': this.paymentConfig.platformCertificateSerial
				}
			})
			console.log(res.data)
			return res.data;
		} catch (e) {
			console.log("请求错误", e.message, e.response.data)
			return e.response.data;
			//TODO handle the exception
		}
	}

	async applymentinfo(id) {
		this.wxpay = this._getWxPay();
		console.log(this.paymentConfig)
		try {
			//https://api.mch.weixin.qq.com/v3/applyment4sub/applyment/business_code/{business_code}
			let res = await this.wxpay.v3.applyment4sub.applyment.business_code.$noop$.get({
				noop: id,
				headers: {
					// 'Wechatpay-Serial': this.paymentConfig.privateKeySerial
					'Wechatpay-Serial': this.paymentConfig.platformCertificateSerial
				}
			}, {})
			console.log(res.data)
			return res.data;
		} catch (e) {
			console.log("请求错误", e.message, e.reason)
			return {
				code: -1,
				message: e.message
			};
			//TODO handle the exception
		}
	}

	/**
	 * 微信企业转账到微信零钱，开通此功能需要特殊的要求
	 * @param {Object} data {amount,_id,user}
	 * @param {string} platform 平台
	 * https://pay.weixin.qq.com/wiki/doc/api/tools/mch_pay.php?chapter=14_2
	 */
	async transfers(data, platform, desc) {
		console.log("transfers", platform, desc)
		//前端登录配置，获得的openid才能对应
		let transferConfig = this.ctx.getConfigs.paymentConfigs("weixin", "transfers");
		if (data.user && data.user.appid) {
			//必须保证appid与openid匹配
			transferConfig.appId = data.user.appid;
		}
		// console.log("config", transferConfig)
		let uniPayIns = uniPay["initWeixin"](transferConfig);
		let openid = this.getOpenid(data.user, platform)
		console.log("transfers", data)
		try {
			const result = await uniPayIns.transfers({
				amount: data.amount, //单位分
				desc,
				openid,
				partner_trade_no: data._id,
				check_name: "NO_CHECK",
			})
			console.log("transfers", result)
			result.code = 0;
			return result;
		} catch (e) {
			//TODO handle the exception
			console.log(e)
			return {
				code: -1,
				message: e.message
			}
		}
		return false;
	}
	/**
	 * 返回给微信服务器
	 */
	returnNotifyData() {
		return {
			header: "application/json;charset=utf-8",
			result: JSON.stringify({
				"code": "SUCCESS",
				"message": "成功"
			})
		}
	}
}
