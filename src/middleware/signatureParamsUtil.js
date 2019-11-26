import Instance from './web3';
import sigUtil from 'eth-sig-util';
export default {
	getSignature :  (hash,receipent,cb) => {
		var msg = Instance.web3.utils.utf8ToHex(hash);
		var params = [msg, receipent]
		var method = 'personal_sign'
		
		Instance.web3.currentProvider.sendAsync({
			method,
			params,
			receipent,
		}, function (err, result) {
			if (err) return console.error(err)
			if (result.error) return console.error(result.error)
			return cb(result.result);
		})
	},
	verifyReceipent :  (signature,msg,receipent,cb) => {
		const msgParams = { 
			data : Instance.web3.utils.utf8ToHex(msg),
			sig : signature
		}
		const recovered = sigUtil.recoverPersonalSignature(msgParams)
		return cb(recovered.toUpperCase() === receipent.toUpperCase());
	}
}