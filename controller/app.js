const {	Controller } = require('../common/uni-cloud-router')

module.exports = class UserController extends Controller {
	async init() {
		const currentUserInfo = await this.service.user.getCurrentUserInfo(['_id', 'username'])
		return {
			share: this.ctx.getConfigs.config("share"),
			customer: this.ctx.getConfigs.config("customer"), //客服
			userInfo: {
				...currentUserInfo.userInfo,
				token: undefined,
				password: undefined,
				role: this.ctx.auth.role,
				permission: this.ctx.auth.permission
			},
			//查询管理的店铺
			adminShops: await this.service.shop.getShops()
			// navMenu: await this.service.menu.getMenu()
		}
	}
}
