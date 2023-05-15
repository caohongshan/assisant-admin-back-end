const { Service } = require('../common/uni-cloud-router')

module.exports = class GoodsService extends Service {

	constructor(ctx) {
		super(ctx)
		this.collection = this.db.collection('opendb-mall-goods')
	}

	/**
	 * 移除goods_banner，前端更新为null，会造成下次无法编辑
	 */
	async removeBanner({ id }) {
		const cmd = this.db.command;
		return this.collection.doc(id).update({
			goods_banner: cmd.remove()
		})
	}
}
