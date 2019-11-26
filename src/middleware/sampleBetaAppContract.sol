pragma solidity ^0.5.5;
contract ProvenanceContract {

    mapping (string => string) public file2SignedHashes; 

    // File Event Log structure
    event FileEvent (
        string appID, 
        uint256 instant, 
        string fileName, 
        string signedFileHash, 
        address indexed owner,
        string UDF
    );

    // Trigger File Event when any CRUD operation
    function triggerFileEvent(string memory _appID, string memory _path, string memory _signedHash, string memory _udf) public returns (bool eventLogged) {
        emit FileEvent(_appID, block.timestamp, _path, _signedHash, msg.sender, _udf);
        string memory _absolutePath = getAbsoluteFilePath(_appID,_path);
        file2SignedHashes[_absolutePath] = _signedHash;
        return true;
    }
    
    // Generating Actual file path
    function getAbsoluteFilePath(string memory _appID, string memory _path) internal pure returns (string memory _absolutePath) {
        return string(abi.encodePacked(_appID,"/", _path));
    }
    
    // Get Hash of the file by name
    function getSignatureByName(string memory _path) public view returns (string memory _signedHash) {
        return file2SignedHashes[_path];
    }
    
    // Get owner from signed hash
    function getSignedReceipent(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) public returns (address) {
        return ecrecover(msgHash, v, r, s);
    }
}
