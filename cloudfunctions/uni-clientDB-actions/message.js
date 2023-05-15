// 开发文档：https://uniapp.dcloud.io/uniCloud/jql.html#action
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		//功能：只返回最后一条消息，并统计数量
		if (result.data) {
			result.data = result.data.reduce((pre, item) => {
				if (!pre[item.type]) {
					//未读数量
					item.badge = 0
					pre[item.type] = item;
				}
				pre[item.type].badge++
				return pre;
			}, {})
		}
		return result
	}
}
