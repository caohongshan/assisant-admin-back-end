const {
	Service
} = require('uni-cloud-router')
module.exports = class ShopService extends Service {
	constructor(ctx) {
		super(ctx)
		this.collection = this.db.collection('tian-mall-shops')
	}
	async getShopIdByAppId(app_id) {
		let {
			data
		} = await this.collection.where({
			app_id
		}).field({
			name: 1
		}).limit(1).get();
		if (data.length > 0) {
			return data[0]._id;
		}
		return false;
	}
	async getShopById(id) {
		let {
			data
		} = await this.collection.doc(id).get();
		if (data.length == 0) {
			return false;
		}
		return data[0];
	}

	async save(id, data) {
		return this.collection.doc(id).update(data);
	}

	/**
	 * 查询多个店铺map 内存缓存1小时
	 * @param {Object} shopIds
	 */
	async getInfoByIds(shopIds) {
		return this.ctx.memorycache("shop_ids_" + shopIds.join("_"), null, 3600, async () => {
			const cmd = this.db.command;
			let {
				data
			} = await this.collection.where({
				_id: cmd.in(shopIds),
				state: true
			}).field({
				id: 1,
				name: 1,
				src: 1,
				payments: 1, //支付方式
				uid: 1, //店主id
				mall_payment: 1, //商城支付配置
				online: 1,
			}).get()
			if (data.length == 0) {
				return false;
			}
			return data.reduce((pre, item) => {
				item.goodsList = [];
				item.freight = 0;
				if (item.payments) {
					item.payments = JSON.parse(item.payments)
				} else {
					item.payments = {}
				}
				//合并到店铺信息里面
				if (item.mall_payment) {
					Object.assign(item, JSON.parse(item.mall_payment))
					delete item.mall_payment;
				}
				pre[item._id] = item;
				return pre;
			}, {})
		});
	}

	/**
	 * 定时器,1：确定收货订单，佣金到账
	 */
	async timer() {}
}
