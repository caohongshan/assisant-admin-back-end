const { Controller } = require('../../common/uni-cloud-router')

module.exports = class AppController extends Controller {
	async init() {

	}

	/**
	 * 定时器，1：确定收货订单，佣金到账
	 */
	async timer() {
		console.log("system.app.timer")
		//自动付款
		await this.autoCashout()
		console.log("end system.app.timer")
	}

	/**
	 * 自动转账到微信定时器
	 */
	async autoCashout() {
		console.log("开始查询提现信息")
		let data = await this.service.user.user.getUnpayCashout(10, "wxpay");
		if (data && data.length > 0) {
			console.log("查询到待提现信息")
			for (let i = 0; i < data.length; i++) {
				let info = data[i]
				//强制使用v3版本
				if (info.mode == "wxpay") {
					info.mode = "wxpay_v3";
				}
				//更新系统变量
				// await this.ctx.changeAppConfig(info.dcloud_appid);
				let res = await this.service.payment[info.mode].transfers(info, info.platform, "账户提现");
				if (res.code < 0 || res.code == "TOKEN_INVALID") {
					//转账失败
					console.log("本次转账失败", info._id, res)
					uniCloud.logger.error("本次转账失败")
					uniCloud.logger.error(JSON.stringify(res))
					//更新处理时间为第二天
					await this.service.user.user.cashoutSave(info._id, {
						process_time: Date.now() + 3600 * 1000 * 24
					});
					continue;
				}
				await this.service.user.user.cashoutSave(info._id, {
					status: 1,
					payment: res
				});
			}
		}
	}
}
