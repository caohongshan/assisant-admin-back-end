// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database();
const cmd = db.command;
const cartCollection = db.collection("opendb-mall-cart");
const goodsCollection = db.collection("opendb-mall-goods")
const skuCollection = db.collection("opendb-mall-sku");
const {
	getShopInfoById
} = require("tiantian-common")
module.exports = {
	before: async (state, event) => {
		//判断当前用户是否已经插入了此条商品到购物车
		const {
			uid
		} = state.auth;
		const {
			goods_id,
			sku_id,
			amount
		} = state.newData;
		//判断商品和店铺都是有效的，才能操作加入购物车
		let goodsInfo = await getGoodsById(goods_id)
		if (!goodsInfo || !goodsInfo.is_on_sale) {
			throw new Error("商品已下架")
		}
		//判断店铺是否营业
		let shopInfo = await getShopInfoById(goodsInfo.shop_id)
		if (!shopInfo.enable) {
			//这种情况，需要下架商品
			// await goodsCollection.doc(goods_id).update({
			// 	is_on_sale: false,
			// 	message: "店铺已关闭，系统自动下架"
			// })
			throw new Error("店铺已关闭")
		}
		if (sku_id) {
			//判断商品规格是否存在
			let sku = await getSkusById(sku_id)
			if (!sku) {
				throw new Error("商品已下架")
			}
		}
		const oldCart = await cartCollection.where({
			user_id: uid,
			goods_id,
			sku_id,
		}).field({
			amount: 1
		}).get();
		console.log("查询原购物车信息", uid, goods_id, sku_id, oldCart.data.length)
		if (oldCart.data.length == 0) {
			//需要新增
			if (amount > 0) {
				console.log("新增购物车")
				//添加购物车
				await cartCollection.add({
					user_id: uid,
					goods_id,
					sku_id,
					create_date: Date.now(),
					amount: 0
				})
			} else {
				//减少购物车，商品都不存在
			}
		}
		//最后修改时间
		state.newData.update_date = Date.now();
		state.newData.amount = cmd.inc(amount);
		//去掉商品图片的裁剪
		if (state.newData.goods_thumb) {
			state.newData.goods_thumb = state.newData.goods_thumb.split("?")[0]
		}
	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		console.log("after购物车")
		return result
	}
}

async function getGoodsById(id) {
	const {
		data
	} = await goodsCollection.doc(id).field({
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
	if (data.length > 0) {
		return data[0]
	}
	return false;
}
async function getSkusById(id) {
	const {
		data
	} = await skuCollection.doc(id).field({
		sku_name: 1,
		price: 1,
		market_price: 1,
		stock: 1
	}).get()
	if (data.length > 0) {
		return data[0]
	}
	return false;
}
