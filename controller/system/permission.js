const { Controller } = require('../../common/../../common/uni-cloud-router')

module.exports = class PermissionController extends Controller {
	async remove() {
		const {
			id
		} = this.ctx.data

		return this.ctx.uniID.deletePermission({
			permissionID: id
		})
	}
}
