const Token = artifacts.require('Token')
const EthSwap = artifacts.require('EthSwap')

require('chai').use(require('chai-as-promised')).should()

function tokens(n){
	return web3.utils.toWei(n, 'ether')
}

contract('EthSwap', ([deployer, invester]) => {
	let ethSwap, token
	const totalSupply = '1000000' 
	
	before(async () => {
		token = await Token.new()
		ethSwap = await EthSwap.new(token.address)
		//Transfer all tokens to EthSwap (1000000000000000000000000)
		await token.transfer(ethSwap.address, tokens(totalSupply))
	})

	describe('EthSwap deployment', async () => {
		
		it('contract has a name', async () => {
			const name = await token.name()
			assert.equal(name, 'HIM Token')
		});

		it('contract has a name', async () => {
			const name = await ethSwap.name()
			assert.equal(name, 'EthSwap Instant Exchange')
		});

		it('contract has tokens', async () => {
			let balance = await token.balanceOf(ethSwap.address)
			assert.equal(balance.toString(), tokens(totalSupply), 'Balance should be equal to 1000000000000000000000000')
		});
	});

	describe('buyTokens()', async () => {
		let result

		before(async () => {
			// Purchase tokens before each test
			result = await ethSwap.buyTokens({from: invester, value: tokens('1')})
		})
		
		it('Allows user to instantly purchase tokens from ethSwap for a fixed price ', async () => {
			let investorBalance = await token.balanceOf(invester)
			assert.equal(investorBalance.toString(), tokens('100'))
			
			let ethSwapBalance = await token.balanceOf(ethSwap.address)
			assert.equal(ethSwapBalance.toString(), tokens('999900'))
			ethSwapBalance = await web3.eth.getBalance(ethSwap.address)
			assert.equal(ethSwapBalance.toString(), tokens('1'))

			const event = result.logs[0].args
			assert.equal(event.account, invester)
			assert.equal(event.token, token.address)
			assert.equal(event.amount.toString(), tokens('100'))
			assert.equal(event.rate.toString(), '100')
		})
	})

	describe('sellTokens()', async () => {
		let result

		before(async () => {
			// Investor must approve tokens befoer the selling 
			await token.approve(ethSwap.address, tokens('100'), {from: invester})
			// Investor sells tokens
			result = await ethSwap.sellTokens(tokens('100'), {from: invester})
		})
		
		it('Allows user to instantly sell tokens to ethSwap for a fixed price ', async () => {
			let investorBalance = await token.balanceOf(invester)
			assert.equal(investorBalance.toString(), tokens('0'))
			
			let ethSwapBalance = await token.balanceOf(ethSwap.address)
			assert.equal(ethSwapBalance.toString(), tokens(totalSupply))
			ethSwapBalance = await web3.eth.getBalance(ethSwap.address)
			assert.equal(ethSwapBalance.toString(), tokens('0'))

			const event = result.logs[0].args
			assert.equal(event.account, invester)
			assert.equal(event.token, token.address)
			assert.equal(event.amount.toString(), tokens('100'))
			assert.equal(event.rate.toString(), '100')
		
			// Failure: investor can't sell more tokens than they have
			await ethSwap.sellTokens(tokens('500'), {from: invester}).should.be.rejected;
		})	
	})
});