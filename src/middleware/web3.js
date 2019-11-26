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
    //  '0xdBa8EC446B8fa878EE6d0d0C4A73995Ac7486706'
    '0x331659d84D751904F3d4332E94E4C2A0665fb42c'
  );
  
  export default {
    Config : instance,
    web3 : web3
}
