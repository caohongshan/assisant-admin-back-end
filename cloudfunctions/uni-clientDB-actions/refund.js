// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database()
const cmd = db.command;
const shopCollection = db.collection("tian-mall-shops")
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		//处理退款类型
		let types = {
			"refund": "退款",
			"refund&return": "退款退货",
			"repair": "维修",
		}
		let states = ["审核中", "审核通过", "审核拒绝"];
		let refundShops = []
		result.data.forEach(item => {
			item.type_text = types[item.type];
			item.state_text = states[item.state];
			//退货需要显示退货地址
			if (item.state == 1 && (item.type == "refund&return" || item.type == "repair")) {
				refundShops.push(item.shop_id);
			}
		})
		if (refundShops.length > 0) {
			//实时查询店铺退货地址refund_address
			let {
				data
			} = await shopCollection.where({
				_id: cmd.in(refundShops)
			}).field({
				refund_address: 1,
				phone: 1,
				address: 1,
				name: 1,
			}).get();
			if (data.length > 0) {
				let addressMap = data.reduce((pre, item) => {
					if (!item.refund_address) {
						//默认店铺地址
						item.refund_address = {
							name: item.name,
							phone: item.phone,
							address: item.address.address
						}
					}
					pre[item._id] = item.refund_address
					return pre;
				}, {})
				result.data.forEach(item => {
					//退货需要显示退货地址
					if (item.state == 1 && (item.type == "refund&return" || item.type == "repair")) {
						item.address = addressMap[item.shop_id] //电话，姓名，地址
					}
				})

			}
		}

		return result
	}
}
