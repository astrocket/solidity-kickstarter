pragma solidity ^0.4.17;

contract CampaignFactory {
    address[] public deployedCampaigns;

    function createCampaign(uint minimum) public {
        address newCampaign = new Campaign(minimum, msg.sender);
        deployedCampaigns.push(newCampaign); // pushes address
    }

    // view means that no data will be modified
    function getDeployedCampaigns() public view returns (address[]) {
        return deployedCampaigns;
    }
}

contract Campaign {
    // Struct is just a definition of a new Type. So it doesn't have default call functions.
    struct Request {
        string description;
        uint value;
        address recipient;
        bool complete;
        uint approvalCount;
        mapping(address => bool) approvals;
    }

    Request[] public requests;
    // These will have default call functions.
    address public manager;
    uint public minimumContribution;
    // address[] public approvers; bad case
    mapping(address => bool) public approvers;
    uint public approversCount;

    modifier restricted() {
        require(msg.sender == manager);
        // target function will be placed where _; is at.
        _;
    }

    function Campaign(uint minimum, address creator) public {
        manager = creator;
        minimumContribution = minimum;
    }

    function contribute() public payable {
        require(msg.value > minimumContribution);

        // approvers.push(msg.sender); for bad case using array
        approvers[msg.sender] = true; // good case using mapping
        approversCount++;
    }

    function createRequest(string description, uint value, address recipient) public restricted {
        // below is allocated to memory. nothing in storage.
        Request memory newRequest = Request({
            description: description,
            value: value,
            recipient: recipient,
            complete: false,
            approvalCount: 0
            });
        // below is exactly same as above but hard to refactor later on.
        // Request(description, value, recipient, false)

        requests.push(newRequest);
    }

    function approveRequest(uint index) public {
        Request storage request = requests[index];

        require(approvers[msg.sender]);
        require(!requests[index].approvals[msg.sender]);

        request.approvals[msg.sender] = true;
        request.approvalCount++;
    }

    function finalizeRequest(uint index) public restricted {
        Request storage request = requests[index];

        require(request.approvalCount > (approversCount / 2));
        require(!request.complete);

        // send money to recipient
        request.recipient.transfer(request.value);
        request.complete = true;
    }
}