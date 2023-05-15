// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		result.data.forEach(item => {
			if (item.mobile) {
				item.mobile = item.mobile.substr(0, 4) + "****" + item.mobile.substr(-4)
			}
		})
		return result
	}
}
