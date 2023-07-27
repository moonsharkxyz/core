# What is Moonshark?
Moonshark is the protocol for decentralized options trading on the Ton blockchain. The protocol allows to trade crypto options on ETH, BTC and TON. Moonshark works on the AMM model and acts as an intermediary between liquidity providers and traders. The project is currently in beta and is only available on the testnet.

[Moonshark website](https://moonshark.xyz)

[Moonshark docs](https://docs.moonshark.xyz)

# System architecture
Moonshark runs on the proof-of-stake Ton blockchain and consists of several smart contracts in Ton's native language - FunC. The main objectives of the system are to give the opportunity to buy/sell options, correctly price options and enable liquidity providers to participate in the Moonshark pool.

![image](https://773214883-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fm9jjkplmuJ7nbMBMRsnc%2Fuploads%2Fw81wzKneLKN5GDhC47hC%2FFlowchart%20(3).jpg?alt=media&token=9555938a-4009-4834-9d21-7048efd6858a)

The Ton blockchain actively uses sharding technology. Sharding is based on a simple idea: “if something gets too big, you can split it into smaller segments.” Smart contracts development in Moonshark also uses sharding for user.fc, position.fc, board.fc, and strike.fc contracts.

## Contracts

### Main
Main.fc is the primary contract in our system and it is used to trade options and to create other contracts.

### Board
Board.fc is responsible for representing the active board. The board is one expiration for one asset. Creation and updating occurs by admin. The board creates a strike.fc contracts.

### Strike
Each Strike.fc contract is responsible for a specific strike on a specific board. The contract stores the strike value itself and the skew parameter used to price options.

### User
The User.fc contract is used as a proxy for storing information about a particular user. Contract is used to fetch all user's positions.

### Position
Position.fc is a contract for storing data and implementing logic for interacting with positions. 

## Oracle

The Moonshark protocol uses price feeds to price options and perform positions opening and closing. At the moment, the protocol uses its own oracle. The oracle source code is available at the [moonsharkxyz/oracle](https://github.com/moonsharkxyz/oracle) repository.

## Actors

Let's analyze the user groups that interact with the protocol.

### Traders
Traders can buy/sell options. Traders have access to the following functions:

- **openPosition (0x124ccada)** Allows to open a position on the Main contract. The arguments are asset id, strike, expiration, number of options, option type and collateral when opening a short position.
- **closePosition (0x49cf872f)** Allows to close a position in the position contract. If at the time of expiration the position turned out to be profitable, the trader is paid the profit.

### Keepers
Traders who sell options must enter collateral for their position into the protocol. If the price of the asset has changed unfavorably for the trader, his position will be liquidated. Liquidation of a position can be initiated by any person. After that, the protocol will check the correctness of the data and pay a reward for the liquidation.

- **liquidatePosition (0x9df26739)** Liquidation of a position that does not have enough collateral. 

### Admin
The admin is the protocol team that deployed all system contracts. The admin has two main tasks: creating boards and updating them.

- **initBoard (0xeef6342a)** Creation of a board. The arguments are asset id, expiration time, base IV, all strikes, and all skews.
- **closeBoard (0x724d7817)** Сlosing the board after the expiration moment.
- **addStrike (0xe11966ec)** Adding a strike price to a specific board.
- **removeStrike (0xacab1b2a)** Removing a strike price if it is no longer relevant.
