// 컨트랙이 두개이지만 거의 하나와 다름 없으므로, 하나의 테스트만 한다.
const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require('../ethereum/build/CampaignFactory.json');
const compiledCampaign = require('../ethereum/build/Campaign.json');

let accounts;
let factory;
let campaignAddress;
let campaign;
let managerInfo;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  managerInfo = { from: accounts[0], gas: '1000000'};
  // 팩토리 배포, web3.eth.Contract로 배포 할때는 json 타입의 string이 아닌 실제 JSON 객체를 올려야 하기 때문에, parse필요
  factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({ data: compiledFactory.bytecode })
    .send(managerInfo);

  // createCampaign 함수 호출, 어디에 캠페인이 배포 됬는지 알기 위해서 주소를 담아야함.
  await factory.methods.createCampaign('100').send(managerInfo);

  // getDeployedCampaigns 함수는 view함수이므로 call 로 호출.
  // 아래에 [campaignAddress] 는 es6 문법인데, 받은 배열의 첫번째 값을 campaignAddress에 할당시키는 문법임
  [campaignAddress] = await factory.methods.getDeployedCampaigns().call();

  // 이미 배포된 컨트랙을 가져오는 함수. 읽기만 함.
  campaign = await new web3.eth.Contract(
    JSON.parse(compiledCampaign.interface),
    campaignAddress
  )
});

describe('Campaigns', () => {
  // 제대로 배포 됬는지 테스트 한다. 주소 존재로 판단
  it('deploys a factory and a campaign', () => {
    assert.ok(factory.options.address);
    assert.ok(campaign.options.address);
  });

  // 캠페인 배포자가 매니저로 잘 들어갔는지 확인
  it('marks callers as the campaign manager', async () => {
    const manager = await campaign.methods.manager().call();
    assert.equal(accounts[0], manager);
  });

  it('allows people to contribute money and marks them as approvers', async () => {
    await campaign.methods.contribute().send({
      value: '200', from: accounts[1]
    });
    const isContributor = await campaign.methods.approvers(accounts[1]).call();
    assert(isContributor);
  });

  it('requires a minimum contribution', async () => {
    try {
      await campaign.methods.contribute().send({ value: '5', from: accounts[1] });
      assert(false);
    } catch (e) {
      assert(e);
    }
  });

  it('allows a manager to make a payment request', async () => {
    await campaign.methods.createRequest('Buy batteries', '100', accounts[1]).send(managerInfo);
    const request = await campaign.methods.requests(0).call();
    assert.equal('Buy batteries', request.description);
  });

  it('processes requests', async () => {
    await campaign.methods.contribute().send({
      from : accounts[0],
      value: web3.utils.toWei('10', 'ether')
    });

    await campaign.methods
      .createRequest('A', web3.utils.toWei('5', 'ether'), accounts[1])
      .send({ from: accounts[0], gas: '1000000'});

    await campaign.methods.approveRequest(0).send({
      from: accounts[0],
      gas: '1000000'
    });

    await campaign.methods.finalizeRequest(0).send({
      from: accounts[0],
      gas: '1000000'
    });

    // balance will be returned as string
    // 여기에서 테스트 도중이라서 accounts[1]에 정확히 얼마나 있는지는 트랙킹하기 어렵다
    // ganache에서도 그런 기능을 아직은 제공하지 않아서 accounts[1]이 대충 얼마 있을지 감 잡아야함.
    let balance = await web3.eth.getBalance(accounts[1]);
    balance = web3.utils.fromWei(balance, 'ether');
    balance = parseFloat(balance); // takes string and turn into decimal number

    console.log(balance);
    assert(balance > 104)
  });
});


