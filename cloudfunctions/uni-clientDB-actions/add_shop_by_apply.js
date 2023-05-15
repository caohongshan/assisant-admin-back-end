// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
module.exports = {
	before: async (state, event) => {
		Object.assign(state.newData, {
			state: true,
			deliveryTypes: ["deliveryHome"]
		})
		console.log("state.newData", state.newData)
	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		return result
	}
}
