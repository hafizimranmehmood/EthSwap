import React, { Component } from 'react';
import Web3 from 'web3';
import Navbar from './Navbar'
import Main from './Main'
import Token from "../abis/Token.json"
import EthSwap from "../abis/EthSwap.json"
import './App.css';

class App extends Component {

  async componentWillMount(){
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadBlockchainData(){
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts();
    // console.log(accounts[0])
    this.setState({account: accounts[0]})
    const ethBalance = await web3.eth.getBalance(this.state.account)
    this.setState({ethBalance})
    // console.log(this.state.ethBalance)
    
    const networkId = await web3.eth.getId()
    const tokenNetwork = Token.networks[networkId]
    if(tokenNetwork){
      const token = new web3.eth.Contract(Token.abi, tokenNetwork.address)
      this.setState({token})
      let tokenBalance = await token.methods.balanceOf(this.state.account).call()
      this.setState({tokenBalance: tokenBalance.toString()})
      console.log("tokenBalance ", tokenBalance.toString())
    }
    else {
      window.alert('Token contract not deployed to detected network.')
    }

    const ethSwapNetwork = EthSwap.networks[await web3.eth.getId()]
    if(ethSwapNetwork){
      const ethSwap = new web3.eth.Contract(EthSwap.abi, ethSwapNetwork.address)
      this.setState({ethSwap})
    }
    else {
      window.alert('Token contract not deployed to detected network.')
    }

    this.setState({loading: false})
  }

  async loadWeb3(){
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  buyTokens = (etherAmount) => {
    this.setState({loading: true})
    this.state.ethSwap.methods.buyTokens().send({from: this.state.account, value: etherAmount}).on('transactionHash', (hash) => {
      this.setState({loading: false})
    })
  }

  sellTokens = (tokenAmount) => {
    this.setState({loading: true})
    this.state.token.methods.approve(this.state.ethSwap.address, tokenAmount).send({from: this.state.account}).on('transactionHash', (hash) => {
      this.state.ethSwap.methods.sellTokens(tokenAmount).send({from: this.state.account}).on('transactionHash', (hash) => {
        this.setState({loading: false})
      })
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      token: {},
      ethSwap: {},
      tokenBalance: '0',
      ethBalance: '0',
      loading: true
    }
  }

  render() {

    let content
    if(this.state.loading){
      content = <a id="loader" className="text-center">Loading...</a>
    } else {
      content = <Main 
          ethBalance={this.state.ethBalance} 
          tokenBalance={this.state.tokenBalance}
          buyTokens = {this.buyTokens}
          sellTokens = {this.sellTokens}
      />
    }

    return (
      <div>
        <Navbar account = {this.state.account}/>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>

                {content}
                
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
