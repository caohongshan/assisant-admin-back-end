// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const {
	getShopsInfoByIds
} = require("tiantian-common")
const db = uniCloud.database()
const cmd = db.command;
const goodsCollection = db.collection("opendb-mall-goods")
const skuCollection = db.collection("opendb-mall-sku");
//查询商品和多规格，数据量大了，前端联合查询会比较慢

module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		let divider = "&gt;";
		//查询店铺信息
		let shopMap = {},
			shopIds = [];
		//把商品数据合并到购物车里面，
		const goodsMap = await getGoodsByIds(result.data.map(e => e.goods_id));
		const skuMap = await getSkusByIds(result.data.map(e => e.sku_id).filter(e => !!e));
		result.data.forEach(item => {
			item.cart_id = item._id;
			//加入购物车时候的价格
			item.add_price = item.price;

			if (goodsMap[item.goods_id]) {
				Object.assign(item, {
					...goodsMap[item.goods_id]
				})
			}
			if (item.sku_id && skuMap[item.sku_id]) {
				Object.assign(item, {
					...skuMap[item.sku_id]
				})
				//处理多规格名称为+
				item.sku_name = item.sku_name.split(divider).join("+")
			}
			if (item.shop_id) {
				shopIds.push(item.shop_id)
			}
		})
		if (shopIds.length > 0) {
			//只显示在线的店铺
			shopMap = await getShopsInfoByIds(shopIds);
			result.data = result.data.forEach(item => {
				if (item.shop_id) {
					item.shop = shopMap[item.shop_id]
					item.shop.enable = item.shop.state && item.shop.online
				}
			}).filter(e => e.shop.enable);
			// result.shops = Object.values(shopMap).filter(e => e.state && e.online)
		}
		return result
	}
}
async function getGoodsByIds(ids) {
	if (ids.length == 0) {
		return {}
	}
	const {
		data
	} = await goodsCollection.where({
		_id: cmd.in(ids)
	}).field({
		name: 1,
		miaosha: 1,
		goods_thumb: 1,
		price: 1,
		market_price: 1,
		is_vip: 1,
		shop_id: 1,
		remain_count: 1,
		is_real: 1,
		is_on_sale: 1,
		is_alone_sale: 1,
		is_best: 1,
		is_new: 1,
		is_hot: 1,
		use_score: 1,
		use_score_rate: 1
	}).get()
	return data.reduce((pre, item) => {
		item.goods_id = item._id;
		item.goods_name = item.name;
		item.stock = item.remain_count;
		delete item._id;
		pre[item.goods_id] = item;
		return pre;
	}, {})
}
async function getSkusByIds(ids) {
	if (ids.length == 0) {
		return {}
	}
	const {
		data
	} = await skuCollection.where({
		_id: cmd.in(ids)
	}).field({
		sku_name: 1,
		price: 1,
		market_price: 1,
		stock: 1
	}).get()
	return data.reduce((pre, item) => {
		item.sku_id = item._id;
		delete item._id;
		pre[item.sku_id] = item;
		return pre;
	}, {})
}
