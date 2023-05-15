const { Controller } = require('../common/uni-cloud-router')

module.exports = class GoodsController extends Controller {

	async banner() {
		return this.service.goods.removeBanner(this.ctx.data)
	}
}
