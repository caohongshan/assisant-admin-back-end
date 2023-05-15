// 开发文档：https://uniapp.dcloud.io/uniCloud/jql.html#action
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		result.data.forEach(item => {
			if (item.style == 'manjine') {
				item.discount_info = `满${ item.condition / 100 }元减${ item.price / 100 }元`
			} else if (item.style == 'manshuliang') {
				item.discount_info = `满${ item.condition  }件减${ item.price / 100 }元`
			} else if (item.style == 'manjinedazhe') {
				let rate = item.rate / 10
				item.discount_info = `满${ item.condition / 100 }元打${ rate }折`
			} else if (item.style == 'manshuliangdazhe') {
				let rate = item.rate / 10
				item.discount_info = `满${ item.condition  }件打${ rate }折`
			}
		})
		return result
	}
}
