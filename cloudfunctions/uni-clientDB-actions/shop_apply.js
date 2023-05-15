// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
module.exports = {
	before: async (state, event) => {
		state.newData.state = 0;
	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		return result
	}
}
