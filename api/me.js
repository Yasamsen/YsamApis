const { send, isOwner } = require("../lib/common");
module.exports = (req, res) => send(res, 200, { owner: isOwner(req) });
