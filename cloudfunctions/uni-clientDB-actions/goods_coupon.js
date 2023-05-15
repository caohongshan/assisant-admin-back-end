// 开发文档：https://uniapp.dcloud.io/uniCloud/jql.html#action
const db = uniCloud.database();
const cmd = db.command
const collection = db.collection("tian-mall-coupons")
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		//商品详情
		if (result.data._id) {
			//查询商品可用优惠券，商品券或者分类券category_id,shop_id
			await getGoodsCoupon(result.data)
		} else {

		}
		return result
	}
}
const getGoodsCoupon = async function(goods) {
	let {
		_id: goods_id,
		category_id,
		shop_id
	} = goods
	if (!category_id || category_id.length == 0) {
		//只是占位，不会查询到数据
		category_id = ["full_category_id"]
	}
	let t = Date.now()
	const {
		data
	} = await collection.where(cmd.or({
		type: 2,
		category_id: cmd.in(category_id)
	}, {
		type: 1,
		goods_ids: goods_id
	}).and({
		shop_id,
		state: 1,
		begin_time: cmd.lt(t),
		end_time: cmd.gt(t),
		stock: cmd.gt(0)
	})).field({
		condition: 1,
		is_vip: 1,
		limit: 1,
		price: 1,
		stock: 1,
		style: 1,
		type: 1,
		shop_id: 1,
		begin_time: 1,
		end_time: 1,
	}).get()
	if (data.length > 0) {
		goods.coupons = data
	}
}
