const { Service } = require('../common/uni-cloud-router')

module.exports = class ShopService extends Service {

	constructor(ctx) {
		super(ctx)
		this.collection = db.collection('tian-mall-shops')
	}

	async getShops() {
		//"uid==$cloudEnv_uid || employees==$cloudEnv_uid"
		//超级管理员可以看全部店铺
		if (this.ctx.auth && this.ctx.auth.role && this.ctx.auth.role.indexOf("admin") != -1) {
			const data = await this.collection.find({}, { 
				name: 1, 
				id: 1, 
				src: 1, 
				online: 1, 
				address: 1, 
				page_id: 1,
				phone: 1,
				apply_id: 1
			}).sort({id:-1}).limit(500).toArray();
			return data;
		}
		const uid = this.ctx.auth.uid;
		const cmd = this.db.command;
		let {
			data
		} = await this.collection.where(cmd.or({
			uid
		}, {
			employees: uid
		})).field({
			name: 1,
			id: 1,
			src: 1,
			online: 1,
			address: 1,
			page_id: 1,
			phone: 1,
			apply_id: 1
		}).orderBy('id', 'desc').limit(50).get()
		return data
	}
}
