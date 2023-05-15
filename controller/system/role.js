const { Controller } = require('../../common/../../common/uni-cloud-router')

module.exports = class RoleController extends Controller {
	async remove() {
		const {
			id
		} = this.ctx.data

		return this.ctx.uniID.deleteRole({
			roleID: id
		})
	}
}
