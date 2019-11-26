pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

contract SampleBetaAppContract {
    
    // Special CID structure for moibit that holds actual CID and owner signed CID
    struct MoiBitCID {
        string fileHash;
        string signedFileHash;
    }
    
    struct MoiBitFile {
      string fileName;
      MoiBitCID mCID;
    }
    
    // mapping of user address to their list of moibit files
    mapping(address => MoiBitFile[]) public user_files;
    mapping (string => MoiBitCID) public fileName2MoiBitCIDs; 

    // Appending the new moibitCID to user's list of files
    function addMoiBitFileRecord(string memory _fileName, string memory _fileHash , string memory _signedFileHash) public returns (bool setBool) {
        MoiBitCID memory _mCid = MoiBitCID(_fileHash,_signedFileHash);
        MoiBitFile memory file = MoiBitFile(_fileName, _mCid);
        user_files[msg.sender].push(file);
        fileName2MoiBitCIDs[_fileName] = _mCid;
        return true;
    }

    // Get MoiBit file CID from file Name
    function getMcidFromFileName (string memory _fileName) public view returns (MoiBitCID memory _mcid ) {
        return fileName2MoiBitCIDs[_fileName];
    }
    
    // Get list of user Moibit files
    function getList() public view returns (MoiBitFile[] memory _files) {
        return user_files[msg.sender];
    }
}
