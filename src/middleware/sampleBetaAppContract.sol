pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

contract SampleBetaAppContract {

    struct File {
      string fileName;
      string signedFileHash;
    }
    
    // mapping of user address to their list of files
    mapping(address => File[]) public user_files;
    mapping (string => string) public file2SignedHashes; 

    // Appending the new hash to user's list of hashes
    function setHash(string memory _fileName, string memory _signedFileHash) public returns (bool setBool){
        File memory file = File(_fileName, _signedFileHash);
        user_files[msg.sender].push(file);
        file2SignedHashes[_fileName] = _signedFileHash;
        return true;
    }

    // Lists all the hashes of the user's files
    function getList() public view returns (File[] memory retFiles) {
        return user_files[msg.sender];
    }
    
    // Lists all the hashes of the files independent of the user
    function getSignedHashByFileName(string memory _fileName) public view returns (string memory _signedFileHash) {
        return file2SignedHashes[_fileName];
    }
    
    function getReceipentFromSignature(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) public returns (address) {
        return ecrecover(msgHash, v, r, s);
    }
}
