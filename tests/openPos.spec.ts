import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, Cell, SendMode, TupleBuilder, beginCell, toNano } from 'ton-core';
import { Main } from '../wrappers/Main';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
//"EQDqi1tJSJyTn7YdVA0aV8PMn2mVAOp4GNEeaQgiJcLlA7C9"a
describe('Main', () => {
    let mainCode: Cell;
    let main: SandboxContract<Main>;
    let blockchain: Blockchain;
    let owner: SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        mainCode = await compile('Main');
    });


    beforeEach(async () => {
        blockchain = await Blockchain.create();
        const deployer = await blockchain.treasury('deployer');
        let user_contract = await compile('User');
        let position_contract = await compile('Position');
        let board_contract = await compile('Board');
        let strike_contract = await compile('Strike');
        main = blockchain.openContract(Main.createFromConfig({
            user_contract,
            position_contract,
            board_contract,
            strike_contract,
            oracle: deployer.address,
            aaddr: deployer.address,
            jaddr: deployer.address,
        }, mainCode));
        const deployResult = await main.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: main.address,
            deploy: true,
            success: true,
        });

        let params = {
            asset_id: 2,
            exp_time: 1694944000,
            strike: 170000000,
            iv: 550,
            skew: 1100,
            ss: 450,
            is_call: false,
            is_long: false,
            q: 1,
            collateral: 3317700000,
            marketPrice: 165000000
        }

        //add board
        let res = await main.sendInitBoard(deployer.getSender(), params);

        //get board
        let b_addr: Address;
        let boards = await main.getBoards();
        let board_cell = boards.stack.readCell();
        if (board_cell.refs.length > 0) {
            let adr = board_cell.beginParse().loadMaybeAddress();
            b_addr = adr!;
        } else {
            throw ("no board");
        }
        expect(res.transactions).toHaveTransaction({ //sended back
            from: b_addr,
            to: deployer.address,
            deploy: false,
            success: true,
        });

        //add strike
        res = await main.sendAddStrike(deployer.getSender(), params)
        
        expect(res.transactions).toHaveTransaction({
            from: b_addr,
            deploy: true,
            success: true
        });

        let args = new TupleBuilder();
        args.writeNumber(params.strike)
        let board = await blockchain.getContract(b_addr);
        let r = board.get("get_strike_address", args.build())
        let strike_addr = r.stackReader.readAddress()

        expect(res.transactions).toHaveTransaction({
            from: strike_addr,
            to: deployer.address
        });

        //get iv
        let b_info = board.get("get_info") //(is_live, asset, exp_time, iv, strikes)
        let b_is_live = b_info.stackReader.readBoolean()
        let iv = b_info.stackReader.skip(2).readNumber()
        console.log(b_is_live)
        //get skew
        let strike = await blockchain.getContract(strike_addr);
        let s_info = strike.get("get_info") //(is_live, strike, skew, 0)
        let s_is_live = s_info.stackReader.readBoolean()
        let skew = s_info.stackReader.skip().readNumber()

        console.log(s_is_live)

        //openpos
        res = await main.sendOpenPos(deployer.getSender(), params);


        res = await deployer.send({
            value: toNano('0.1'),
            to: main.address,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(params.asset_id, 3)
                .storeUint(params.marketPrice, 64)
                .endCell(),
        })

        //get user addr
        let u_addr = (await main.getUserAddr(deployer.getSender())).stack.readAddress()

        //get pos addr
        let user = await blockchain.getContract(u_addr);
        args = new TupleBuilder();
        args.writeNumber(0)
        r = user.get("get_position_address", args.build())
        let pos_addr = r.stackReader.readAddress()


        //get iv
        board = await blockchain.getContract(b_addr);
        b_info = board.get("get_info") //(is_live, asset, exp_time, iv, strikes)
        let iv2 = b_info.stackReader.skip(3).readNumber()

        //get skew
        strike = await blockchain.getContract(strike_addr);
        s_info = strike.get("get_info") //(is_live, strike, skew, 0)
        let skew2 = s_info.stackReader.skip(2).readNumber()

        if (iv == iv2) {
            throw ("iv not changed")
        }

        if (skew == skew2) {
            throw ("skew not changed")
        }

        //close board
        res = await main.sendCloseBoard(deployer.getSender(), params);

        res = await deployer.send({
            value: toNano('0.1'),
            to: main.address,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(params.asset_id, 3)
                .storeUint(params.marketPrice, 64)
                .endCell(),
        })

        expect(res.transactions).toHaveTransaction({ //sended back
            from: b_addr,
            to: deployer.address,
            deploy: false,
            success: true,
        });

        //closepos
        res = await deployer.send({
            value: toNano('0.1'),
            to: pos_addr,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        })

        // get pos
        let position = await blockchain.getContract(pos_addr);
        let pos_info = position.get("get_info")
        
        args = new TupleBuilder();
        args.writeNumber(params.marketPrice);
        args.writeNumber(params.strike);
        args.writeBoolean(params.is_call);
        args.writeNumber(params.exp_time);
        args.writeNumber(params.iv * 1000000000000000);
        
        let opt_price = await main.getCalcOptPrice(args.build())
        //console.log(opt_price)
    });
    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and oracle are ready to use
    });
});
