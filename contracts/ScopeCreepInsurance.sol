// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ScopeCreepInsurance
 * @dev Smart contract tool that locks down freelance agreements with anti-scope-creep enforcement
 * @notice If the client starts to add more nonsense to the job, the system alerts, charges more, or even fires the client
 */
contract ScopeCreepInsurance {
    
    // Platform fee percentage (e.g., 250 = 2.5%)
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 250; // 2.5% platform cut
    uint256 public constant PERCENTAGE_BASE = 10000;
    
    // Scope change fee percentage (charged when scope increases)
    uint256 public constant SCOPE_CHANGE_FEE_PERCENTAGE = 2000; // 20% additional charge
    
    // Maximum allowed scope changes before client can be fired
    uint256 public constant MAX_SCOPE_CHANGES = 3;
    
    enum AgreementStatus { 
        Active,           // Agreement is active
        Completed,        // Work completed successfully
        ClientFired,      // Client fired due to excessive scope creep
        Cancelled         // Agreement cancelled
    }
    
    struct Agreement {
        address freelancer;
        address client;
        uint256 originalAmount;
        uint256 currentAmount;
        uint256 scopeChanges;
        string originalScope;
        AgreementStatus status;
        uint256 createdAt;
        uint256 completedAt;
        bool fundsDeposited;
    }
    
    // Agreement ID counter
    uint256 private nextAgreementId = 1;
    
    // Mapping from agreement ID to Agreement
    mapping(uint256 => Agreement) public agreements;
    
    // Platform owner who collects fees
    address public platformOwner;
    
    // Total platform fees collected
    uint256 public totalFeesCollected;
    
    // Events
    event AgreementCreated(
        uint256 indexed agreementId,
        address indexed freelancer,
        address indexed client,
        uint256 amount,
        string scope
    );
    
    event FundsDeposited(
        uint256 indexed agreementId,
        uint256 amount
    );
    
    event ScopeChangeRequested(
        uint256 indexed agreementId,
        uint256 additionalCharge,
        uint256 scopeChangeCount
    );
    
    event ScopeChangeAlert(
        uint256 indexed agreementId,
        string message,
        uint256 scopeChangeCount
    );
    
    event ClientFired(
        uint256 indexed agreementId,
        string reason
    );
    
    event AgreementCompleted(
        uint256 indexed agreementId,
        uint256 freelancerPayment,
        uint256 platformFee
    );
    
    event AgreementCancelled(
        uint256 indexed agreementId,
        address cancelledBy
    );
    
    event FeesWithdrawn(
        address indexed owner,
        uint256 amount
    );
    
    modifier onlyPlatformOwner() {
        require(msg.sender == platformOwner, "Only platform owner");
        _;
    }
    
    modifier onlyFreelancer(uint256 agreementId) {
        require(msg.sender == agreements[agreementId].freelancer, "Only freelancer");
        _;
    }
    
    modifier onlyClient(uint256 agreementId) {
        require(msg.sender == agreements[agreementId].client, "Only client");
        _;
    }
    
    modifier agreementExists(uint256 agreementId) {
        require(agreementId > 0 && agreementId < nextAgreementId, "Agreement does not exist");
        _;
    }
    
    modifier agreementActive(uint256 agreementId) {
        require(agreements[agreementId].status == AgreementStatus.Active, "Agreement not active");
        _;
    }
    
    constructor() {
        platformOwner = msg.sender;
    }
    
    /**
     * @dev Create a new freelance agreement
     * @param client Address of the client
     * @param amount Original project amount
     * @param scope Description of the project scope
     */
    function createAgreement(
        address client,
        uint256 amount,
        string calldata scope
    ) external returns (uint256) {
        require(client != address(0), "Invalid client address");
        require(client != msg.sender, "Client cannot be freelancer");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(scope).length > 0, "Scope cannot be empty");
        
        uint256 agreementId = nextAgreementId++;
        
        agreements[agreementId] = Agreement({
            freelancer: msg.sender,
            client: client,
            originalAmount: amount,
            currentAmount: amount,
            scopeChanges: 0,
            originalScope: scope,
            status: AgreementStatus.Active,
            createdAt: block.timestamp,
            completedAt: 0,
            fundsDeposited: false
        });
        
        emit AgreementCreated(agreementId, msg.sender, client, amount, scope);
        
        return agreementId;
    }
    
    /**
     * @dev Client deposits funds to escrow
     * @param agreementId ID of the agreement
     */
    function depositFunds(uint256 agreementId) 
        external 
        payable 
        agreementExists(agreementId)
        onlyClient(agreementId)
        agreementActive(agreementId)
    {
        Agreement storage agreement = agreements[agreementId];
        require(!agreement.fundsDeposited, "Funds already deposited");
        require(msg.value == agreement.currentAmount, "Incorrect amount");
        
        agreement.fundsDeposited = true;
        
        emit FundsDeposited(agreementId, msg.value);
    }
    
    /**
     * @dev Client requests a scope change
     * @param agreementId ID of the agreement
     * @notice This automatically charges 20% more and tracks scope changes
     */
    function requestScopeChange(uint256 agreementId)
        external
        payable
        agreementExists(agreementId)
        onlyClient(agreementId)
        agreementActive(agreementId)
    {
        Agreement storage agreement = agreements[agreementId];
        require(agreement.fundsDeposited, "Funds not deposited yet");
        
        // Calculate additional charge for scope change
        uint256 additionalCharge = (agreement.originalAmount * SCOPE_CHANGE_FEE_PERCENTAGE) / PERCENTAGE_BASE;
        require(msg.value == additionalCharge, "Incorrect additional payment");
        
        // Update agreement
        agreement.currentAmount += additionalCharge;
        agreement.scopeChanges++;
        
        emit ScopeChangeRequested(agreementId, additionalCharge, agreement.scopeChanges);
        
        // Alert if approaching limit
        if (agreement.scopeChanges == MAX_SCOPE_CHANGES - 1) {
            emit ScopeChangeAlert(
                agreementId,
                "WARNING: One more scope change and client will be fired!",
                agreement.scopeChanges
            );
        } else if (agreement.scopeChanges < MAX_SCOPE_CHANGES) {
            emit ScopeChangeAlert(
                agreementId,
                "Scope change registered. Additional charges applied.",
                agreement.scopeChanges
            );
        }
        
        // Fire client if they exceed the limit
        if (agreement.scopeChanges >= MAX_SCOPE_CHANGES) {
            _fireClient(agreementId, "Maximum scope changes exceeded");
        }
    }
    
    /**
     * @dev Freelancer manually fires the client for excessive scope creep
     * @param agreementId ID of the agreement
     * @param reason Reason for firing the client
     */
    function fireClient(uint256 agreementId, string calldata reason)
        external
        agreementExists(agreementId)
        onlyFreelancer(agreementId)
        agreementActive(agreementId)
    {
        Agreement storage agreement = agreements[agreementId];
        require(agreement.scopeChanges > 0, "No scope changes to justify firing");
        
        _fireClient(agreementId, reason);
    }
    
    /**
     * @dev Internal function to fire a client
     */
    function _fireClient(uint256 agreementId, string memory reason) private {
        Agreement storage agreement = agreements[agreementId];
        
        agreement.status = AgreementStatus.ClientFired;
        agreement.completedAt = block.timestamp;
        
        // Calculate payments
        uint256 totalAmount = agreement.currentAmount;
        uint256 platformFee = (totalAmount * PLATFORM_FEE_PERCENTAGE) / PERCENTAGE_BASE;
        uint256 freelancerPayment = totalAmount - platformFee;
        
        // Update platform fees
        totalFeesCollected += platformFee;
        
        // Pay the freelancer
        if (freelancerPayment > 0) {
            (bool success, ) = payable(agreement.freelancer).call{value: freelancerPayment}("");
            require(success, "Payment to freelancer failed");
        }
        
        emit ClientFired(agreementId, reason);
        emit AgreementCompleted(agreementId, freelancerPayment, platformFee);
    }
    
    /**
     * @dev Complete the agreement and release funds
     * @param agreementId ID of the agreement
     */
    function completeAgreement(uint256 agreementId)
        external
        agreementExists(agreementId)
        agreementActive(agreementId)
    {
        Agreement storage agreement = agreements[agreementId];
        require(
            msg.sender == agreement.freelancer || msg.sender == agreement.client,
            "Only freelancer or client can complete"
        );
        require(agreement.fundsDeposited, "Funds not deposited");
        
        agreement.status = AgreementStatus.Completed;
        agreement.completedAt = block.timestamp;
        
        // Calculate payments
        uint256 totalAmount = agreement.currentAmount;
        uint256 platformFee = (totalAmount * PLATFORM_FEE_PERCENTAGE) / PERCENTAGE_BASE;
        uint256 freelancerPayment = totalAmount - platformFee;
        
        // Update platform fees
        totalFeesCollected += platformFee;
        
        // Pay the freelancer
        if (freelancerPayment > 0) {
            (bool success, ) = payable(agreement.freelancer).call{value: freelancerPayment}("");
            require(success, "Payment to freelancer failed");
        }
        
        emit AgreementCompleted(agreementId, freelancerPayment, platformFee);
    }
    
    /**
     * @dev Cancel an agreement (only if funds not deposited)
     * @param agreementId ID of the agreement
     */
    function cancelAgreement(uint256 agreementId)
        external
        agreementExists(agreementId)
        agreementActive(agreementId)
    {
        Agreement storage agreement = agreements[agreementId];
        require(
            msg.sender == agreement.freelancer || msg.sender == agreement.client,
            "Only freelancer or client can cancel"
        );
        require(!agreement.fundsDeposited, "Cannot cancel after funds deposited");
        
        agreement.status = AgreementStatus.Cancelled;
        agreement.completedAt = block.timestamp;
        
        emit AgreementCancelled(agreementId, msg.sender);
    }
    
    /**
     * @dev Platform owner withdraws collected fees
     */
    function withdrawFees() external onlyPlatformOwner {
        uint256 amount = totalFeesCollected;
        require(amount > 0, "No fees to withdraw");
        
        totalFeesCollected = 0;
        
        (bool success, ) = payable(platformOwner).call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit FeesWithdrawn(platformOwner, amount);
    }
    
    /**
     * @dev Get agreement details
     * @param agreementId ID of the agreement
     */
    function getAgreement(uint256 agreementId) 
        external 
        view 
        agreementExists(agreementId)
        returns (
            address freelancer,
            address client,
            uint256 originalAmount,
            uint256 currentAmount,
            uint256 scopeChanges,
            string memory originalScope,
            AgreementStatus status,
            uint256 createdAt,
            uint256 completedAt,
            bool fundsDeposited
        ) 
    {
        Agreement storage agreement = agreements[agreementId];
        return (
            agreement.freelancer,
            agreement.client,
            agreement.originalAmount,
            agreement.currentAmount,
            agreement.scopeChanges,
            agreement.originalScope,
            agreement.status,
            agreement.createdAt,
            agreement.completedAt,
            agreement.fundsDeposited
        );
    }
    
    /**
     * @dev Calculate additional charge for a scope change
     * @param agreementId ID of the agreement
     */
    function calculateScopeChangeCharge(uint256 agreementId) 
        external 
        view 
        agreementExists(agreementId)
        returns (uint256) 
    {
        Agreement storage agreement = agreements[agreementId];
        return (agreement.originalAmount * SCOPE_CHANGE_FEE_PERCENTAGE) / PERCENTAGE_BASE;
    }
    
    /**
     * @dev Check if client is at risk of being fired
     * @param agreementId ID of the agreement
     */
    function isClientAtRisk(uint256 agreementId) 
        external 
        view 
        agreementExists(agreementId)
        returns (bool, uint256, uint256) 
    {
        Agreement storage agreement = agreements[agreementId];
        uint256 remainingChanges = 0;
        if (agreement.scopeChanges < MAX_SCOPE_CHANGES) {
            remainingChanges = MAX_SCOPE_CHANGES - agreement.scopeChanges;
        }
        return (
            agreement.scopeChanges >= MAX_SCOPE_CHANGES - 1,
            agreement.scopeChanges,
            remainingChanges
        );
    }
}
