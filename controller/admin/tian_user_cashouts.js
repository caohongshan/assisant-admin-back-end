const { Controller } = require('../../common/uni-cloud-router')

/**
 * 账户提现审核
 */
module.exports = class TianUserCashoutsController extends Controller {
	constructor(ctx) {
		super(ctx)
	}

	async getCashout() {
		let { id } = this.ctx.event.data;
		let info = await this.service.user.getCashoutById(id);
		return info;
	}

	/**
	 *  拒绝
	 */
	async refuse() {
		let { id } = this.ctx.data;
		//查询提现记录
		let info = await this.service.user.user.getCashoutById(id);
		//返还余额，更新状态
		if (!info) {
			return {
				code: -1,
				message: "提现记录不存在"
			};
		}
		await this.service.user.user.cashoutSave(id, {
			status: 2
		})
		return await this.service.user.user.editBalance(info.user_id, info.amount, "提现拒绝", 99, {})
	}
	async passed() {
		let { id } = this.ctx.event.data;
		//查询提现记录
		let info0 = await this.service.user.getCashoutById(id);
		let info = info0[1]
		//返还余额，更新状态
		if (!info) {
			return {
				code: -1,
				message: "提现记录不存在"
			};
		}
		if (info.payment) {
			return {
				code: -2,
				message: "已付款"
			};
		}
		//更新系统变量
		// await this.ctx.changeAppConfig(info.dcloud_appid);
		//调用对应的转账接口
		// let api = this.ctx.getConfigs.config("transfers.api");
		let res;
		//兼容以前申请平台不一致问题
		let platform = info.platform;
		if (info.mode == "wxpay") {
			// let plts = Object.keys(info.user.wx_openid);
			// if (plts.indexOf(platform) == -1) {
			// 	platform = plts[0];
			// }
		}
		//强制使用v3版本
		if (info.mode == "wxpay") {
			info.mode = "wxpay_v3";
		}

		res = await this.service.payment[info.mode].transfers(info, platform, "账户提现");
		if (res.code < 0 || res.code == "TOKEN_INVALID") {
			//转账失败
			return res;
		}
		//保存支付后结果
		return await this.service.user.cashoutSave(id, {
			status: 1,
			// payment: res
		});
	}

	/**
	 * api调用转账
	 */
	async transfers() {
		if (!this.ctx.apiLogin) {
			return false;
		}
		let info = this.ctx.data;
		console.log("transfers", info)
		return await this.service.payment[info.mode].transfers(info, info.platform, "账户提现");
	}
}
