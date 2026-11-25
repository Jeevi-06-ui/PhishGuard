// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PhishGuardRegistry
 * @notice Tamper-evident registry storing cryptographic SHA-256 digests and ML verdicts
 *         for URL phishing inspections without exposing sensitive raw query payloads.
 */
contract PhishGuardRegistry {
    struct ScanRecord {
        uint256 recordId;
        string scanId;
        bytes32 urlHash;
        string prediction;
        uint8 riskScore;
        string modelVersion;
        uint256 timestamp;
        address recordedBy;
    }

    ScanRecord[] private _records;
    mapping(bytes32 => uint256[]) private _recordIdsByUrlHash;

    event ScanRecorded(
        uint256 indexed recordId,
        string scanId,
        bytes32 indexed urlHash,
        string prediction,
        uint8 riskScore,
        string modelVersion,
        uint256 timestamp,
        address indexed recordedBy
    );

    /**
     * @notice Anchor a new ML scan verdict onto the Ethereum ledger.
     */
    function recordScan(
        string calldata scanId,
        bytes32 urlHash,
        string calldata prediction,
        uint8 riskScore,
        string calldata modelVersion
    ) external returns (uint256 recordId) {
        require(bytes(scanId).length > 0, "scanId cannot be empty");
        require(urlHash != bytes32(0), "urlHash cannot be zero");
        require(riskScore <= 100, "riskScore must be <= 100");
        require(bytes(prediction).length > 0, "prediction cannot be empty");

        recordId = _records.length + 1;
        uint256 currentTimestamp = block.timestamp;

        _records.push(
            ScanRecord({
                recordId: recordId,
                scanId: scanId,
                urlHash: urlHash,
                prediction: prediction,
                riskScore: riskScore,
                modelVersion: modelVersion,
                timestamp: currentTimestamp,
                recordedBy: msg.sender
            })
        );

        _recordIdsByUrlHash[urlHash].push(recordId);

        emit ScanRecorded(
            recordId,
            scanId,
            urlHash,
            prediction,
            riskScore,
            modelVersion,
            currentTimestamp,
            msg.sender
        );
    }

    function getRecordCount() external view returns (uint256) {
        return _records.length;
    }

    function getRecord(uint256 index) external view returns (ScanRecord memory) {
        require(index < _records.length, "Record index out of bounds");
        return _records[index];
    }

    function verifyByUrlHash(
        bytes32 urlHash
    )
        external
        view
        returns (
            bool exists,
            uint256 latestRecordId,
            uint8 riskScore,
            string memory prediction,
            uint256 timestamp,
            string memory modelVersion
        )
    {
        uint256[] storage ids = _recordIdsByUrlHash[urlHash];
        if (ids.length == 0) {
            return (false, 0, 0, "", 0, "");
        }
        uint256 id = ids[ids.length - 1];
        ScanRecord storage rec = _records[id - 1];
        return (
            true,
            rec.recordId,
            rec.riskScore,
            rec.prediction,
            rec.timestamp,
            rec.modelVersion
        );
    }
}
