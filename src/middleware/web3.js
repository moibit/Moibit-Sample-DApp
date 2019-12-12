import BetaAPI from './SampleBetaApp.json';
import Web3 from 'web3';
var web3;

  if (window.ethereum) {
      web3 = new Web3(window.ethereum);

      try {
          // Request account access if needed
          window.ethereum.enable()
          .then(console.log('Acccounts now exposed'))
          .catch(error => console.log(error));
      } catch (error) {
          console.log(error.message);
      }

  }

  else if(typeof window !== 'undefined' && typeof window.web3 !== 'undefined'){
      web3 = new Web3(window.web3.currentProvider);
  }
  
  const instance = new web3.eth.Contract(
    BetaAPI,
    '0x2410dEd3271d2d1a6c8030dbC84ED8cF3B7DDC3B'
  );
  
  export default {
    Config : instance,
    web3 : web3
}
